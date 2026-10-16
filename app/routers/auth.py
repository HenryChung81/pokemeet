
import os
import jwt

from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from pwdlib import PasswordHash
from google.auth.exceptions import GoogleAuthError
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token

from app.database import engine
from app.schemas.user import LoginRequest, UserUpdate


# .env ファイルを読み込む
load_dotenv()


# 認証関係のAPIをまとめるRouter
router = APIRouter()


# パスワードの検証に使う
password_hash = PasswordHash.recommended()


# Bearer認証を使用する
security = HTTPBearer()


# .envからJWT署名用の秘密鍵を取得
SECRET_KEY = os.getenv("SECRET_KEY")


# Googleログインで使用するOAuthクライアントID
# フロントエンドと同じGoogleクライアントIDを設定する。
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")


# GoogleログインAPIで受け取るIDトークン
class GoogleLoginRequest(BaseModel):
    credential: str


# JWTで使用する署名方式
ALGORITHM = "HS256"


# JWTの有効期限
ACCESS_TOKEN_EXPIRE_MINUTES = 30


# JWTを作成する関数
def create_access_token(user_id: int):

    # 現在時刻から30分後を有効期限にする
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    # JWTの中に入れるデータ
    payload = {
        "sub": str(user_id),
        "exp": expire
    }

    # JWTを作成する
    token = jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return token


# JWTを検証して、
# ログイン中ユーザーのIDを取得する
def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    # Bearerの後ろにあるJWT本体を取得
    token = credentials.credentials

    try:

        # JWTを検証する
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        # JWTからuser_idを取得
        user_id = payload.get("sub")

        # user_idが入っていなければ不正
        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="無効なトークンです"
            )

        return int(user_id)

    except jwt.PyJWTError:

        raise HTTPException(
            status_code=401,
            detail="無効なトークンです"
        )


# ログインAPI
@router.post("/login")
def login(login_data: LoginRequest):

    # MySQLへ接続
    with engine.connect() as connection:

        # login_idでユーザーを検索
        result = connection.execute(
            text("""
                SELECT
                    id,
                    nickname,
                    password_hash
                FROM users
                WHERE login_id = :login_id
            """),
            {
                "login_id": login_data.login_id
            }
        )

        # 検索結果を1件取得
        user = result.fetchone()

        # ユーザーが存在しない場合
        if user is None:
            raise HTTPException(
                status_code=401,
                detail="ログインIDまたはパスワードが違います"
            )

        # Googleログイン専用アカウントなど、
        # パスワードが設定されていない場合は通常ログインを拒否する。
        if user.password_hash is None:
            raise HTTPException(
                status_code=401,
                detail="ログインIDまたはパスワードが違います"
            )

        # パスワードを検証
        password_ok = password_hash.verify(
            login_data.password,
            user.password_hash
        )

        # パスワードが違う場合
        if not password_ok:
            raise HTTPException(
                status_code=401,
                detail="ログインIDまたはパスワードが違います"
            )

        # ログイン成功したのでJWTを作成
        access_token = create_access_token(
            user.id
        )

        # JWTを返す
        return {
            "message": "ログイン成功",
            "access_token": access_token,
            "token_type": "bearer"
        }


# Googleログイン・新規登録API
@router.post("/google-login")
def google_login(login_data: GoogleLoginRequest):
    # クライアントIDが未設定ならGoogleログインを受け付けない。
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=500,
            detail="Googleログインの設定が完了していません"
        )

    # Googleから受け取ったIDトークンをサーバー側で検証する。
    try:
        google_user = google_id_token.verify_oauth2_token(
            login_data.credential,
            google_requests.Request(),
            GOOGLE_CLIENT_ID
        )
    except (ValueError, GoogleAuthError):
        raise HTTPException(
            status_code=401,
            detail="Googleログインの認証に失敗しました。もう一度お試しください"
        )

    # Googleの安定したユーザー識別子と確認済みメールを確認する。
    google_sub = google_user.get("sub")
    email = google_user.get("email")
    email_verified = google_user.get("email_verified")

    if not google_sub or not email or not email_verified:
        raise HTTPException(
            status_code=401,
            detail="Googleアカウントのメールアドレスを確認できませんでした"
        )

    # Googleアカウントの表示名を初期ニックネームに使用する。
    nickname = (
        google_user.get("name")
        or email.split("@", 1)[0]
        or "Googleユーザー"
    ).strip()
    if not nickname:
        nickname = "Googleユーザー"
    nickname = nickname[:50]

    try:
        # google_subを本人識別の基準にする。
        # メールアドレスだけで既存アカウントと自動連携しない。
        with engine.begin() as connection:
            existing_user = connection.execute(
                text("""
                    SELECT id
                    FROM users
                    WHERE google_sub = :google_sub
                """),
                {"google_sub": google_sub}
            ).fetchone()

            if existing_user is not None:
                user_id = existing_user.id
            else:
                # 同じメールアドレスが別アカウントに登録済みなら、
                # 自動連携せずエラーにする。
                email_user = connection.execute(
                    text("""
                        SELECT id, google_sub
                        FROM users
                        WHERE email = :email
                    """),
                    {"email": email}
                ).fetchone()

                if email_user is not None:
                    if email_user.google_sub == google_sub:
                        user_id = email_user.id
                    else:
                        raise HTTPException(
                            status_code=409,
                            detail=(
                                "このメールアドレスは別のアカウントに登録されています。"
                                "既存アカウントとの連携が必要な場合は、管理者にご相談ください"
                            )
                        )
                else:
                    # 初回Googleログイン時にユーザーを作成する。
                    # Google専用アカウントはlogin_id/password_hashを持たない。
                    insert_result = connection.execute(
                        text("""
                            INSERT INTO users (
                                login_id,
                                nickname,
                                password_hash,
                                email,
                                google_sub
                            )
                            VALUES (
                                NULL,
                                :nickname,
                                NULL,
                                :email,
                                :google_sub
                            )
                        """),
                        {
                            "nickname": nickname,
                            "email": email,
                            "google_sub": google_sub
                        }
                    )
                    user_id = insert_result.lastrowid

    except IntegrityError:
        # 同時に初回ログインされた場合の重複登録に対応する。
        with engine.connect() as connection:
            existing_user = connection.execute(
                text("""
                    SELECT id
                    FROM users
                    WHERE google_sub = :google_sub
                """),
                {"google_sub": google_sub}
            ).fetchone()

        if existing_user is None:
            raise HTTPException(
                status_code=409,
                detail="Googleアカウントの登録に失敗しました。もう一度お試しください"
            )

        user_id = existing_user.id

    # 既存のログインと同じJWTを発行する。
    access_token = create_access_token(user_id)

    return {
        "message": "Googleログイン成功",
        "access_token": access_token,
        "token_type": "bearer"
    }


# ログイン中ユーザーのプロフィール取得
@router.get("/me")
def get_me(
    user_id: int = Depends(get_current_user_id)
):

    # MySQLへ接続
    with engine.connect() as connection:

        # JWTから取得したuser_idで
        # 自分のプロフィールを検索する
        result = connection.execute(
            text("""
                SELECT
                    id,
                    nickname,
                    favorite_pokemon,
                    language,
                    introduction,
                    role,
                    is_profile_public,
                    gender,
                    is_gender_public,
                    friend_code,
                    is_friend_code_public,
                    avatar_type,
                    avatar_value
                FROM users
                WHERE id = :user_id
            """),
            {
                "user_id": user_id
            }
        )

        # 検索結果を1件取得
        user = result.fetchone()

        # DBにユーザーが存在しない場合
        if user is None:
            raise HTTPException(
                status_code=404,
                detail="ユーザーが見つかりません"
            )

        # 好きなポケモンを複数取得する
        favorite_result = connection.execute(
            text("""
                SELECT pokemon_name
                FROM user_favorite_pokemon
                WHERE user_id = :user_id
                ORDER BY display_order ASC, pokemon_name ASC
            """),
            {
                "user_id": user_id
            }
        )

        # DBの結果をリストに変換する
        favorite_pokemon_list = [
            row.pokemon_name
            for row in favorite_result
        ]

        # よく遊ぶゲームのslugを取得する
        game_result = connection.execute(
            text("""
                SELECT g.slug
                FROM user_games AS ug
                INNER JOIN pokemon_games AS g
                    ON ug.game_id = g.id
                WHERE ug.user_id = :user_id
                ORDER BY g.id ASC
            """),
            {
                "user_id": user_id
            }
        )

        # ゲームの識別子をリストにする
        game_slugs = [
            row.slug
            for row in game_result
        ]

        # プレイスタイルのslugを取得する
        play_style_result = connection.execute(
            text("""
                SELECT ps.slug
                FROM user_play_styles AS ups
                INNER JOIN play_styles AS ps
                    ON ups.play_style_id = ps.id
                WHERE ups.user_id = :user_id
                ORDER BY ps.id ASC
            """),
            {
                "user_id": user_id
            }
        )

        # プレイスタイルの識別子をリストにする
        play_style_slugs = [
            row.slug
            for row in play_style_result
        ]

        # パスワード情報は返さず、
        # プロフィール情報と権限だけ返す
        return {
            "id": user.id,
            "nickname": user.nickname,

            # 既存APIとの互換性のため、従来の項目も残す
            "favorite_pokemon": user.favorite_pokemon,

            # 新しい複数登録用の項目
            "favorite_pokemon_list": favorite_pokemon_list,

            "language": user.language,
            "introduction": user.introduction,
            "role": user.role,

            # プロフィール全体の公開設定
            "is_profile_public": bool(user.is_profile_public),

            # 性別と公開設定
            "gender": user.gender,
            "is_gender_public": bool(user.is_gender_public),

            # フレンドコードと公開設定
            "friend_code": user.friend_code,
            "is_friend_code_public": bool(
                user.is_friend_code_public
            ),

            # プリセット画像かアップロード画像かを返す
            "avatar_type": user.avatar_type,
            "avatar_preset": (
                user.avatar_value
                if user.avatar_type == "preset"
                else None
            ),
            "avatar_url": (
                user.avatar_value
                if user.avatar_type == "upload"
                else None
            ),

            # 複数選択したゲームとプレイスタイル
            "game_slugs": game_slugs,
            "play_style_slugs": play_style_slugs
        }


# ログイン中ユーザーのプロフィール編集
@router.put("/me")
def update_me(
    user_data: UserUpdate,
    user_id: int = Depends(get_current_user_id)
):

    # リクエストで実際に送信された項目を取得する
    #
    # 送信されていない項目を勝手にNoneで上書きしないために使う。
    fields_set = user_data.model_fields_set

    # MySQLへ接続
    with engine.connect() as connection:

        # JWTから取得したuser_idで
        # ユーザーが存在するか確認する
        result = connection.execute(
            text("""
                SELECT
                    id
                FROM users
                WHERE id = :user_id
            """),
            {
                "user_id": user_id
            }
        )

        # 検索結果を1件取得
        user = result.fetchone()

        # DBにユーザーが存在しない場合
        if user is None:
            raise HTTPException(
                status_code=404,
                detail="ユーザーが見つかりません"
            )

        # ==========================================
        # 1. 入力された複数選択項目を検証する
        # ==========================================

        # 好きなポケモンの保存内容を準備する
        favorite_pokemon_to_save = None

        # 新しい複数登録項目が送信された場合
        if "favorite_pokemon_list" in fields_set:

            # 前後の空白を除き、重複を取り除く
            favorite_pokemon_to_save = list(dict.fromkeys(
                name.strip()
                for name in (user_data.favorite_pokemon_list or [])
                if name.strip()
            ))

        # 古い1項目形式で送信された場合
        elif "favorite_pokemon" in fields_set:

            # 古い形式も引き続き受け付ける
            old_favorite = user_data.favorite_pokemon

            if old_favorite and old_favorite.strip():
                favorite_pokemon_to_save = [
                    old_favorite.strip()
                ]
            else:
                favorite_pokemon_to_save = []

        # ゲームの選択内容を準備する
        game_slugs_to_save = None

        if "game_slugs" in fields_set:

            # 重複と前後の空白を取り除く
            game_slugs_to_save = list(dict.fromkeys(
                slug.strip()
                for slug in (user_data.game_slugs or [])
                if slug.strip()
            ))

            # DBに登録されているゲームのslugを取得する
            available_games = connection.execute(
                text("""
                    SELECT slug
                    FROM pokemon_games
                """)
            ).scalars().all()

            available_game_slugs = set(available_games)

            # 存在しないゲームが指定されていないか確認する
            unknown_games = [
                slug
                for slug in game_slugs_to_save
                if slug not in available_game_slugs
            ]

            if unknown_games:
                raise HTTPException(
                    status_code=400,
                    detail="存在しないゲームが指定されています"
                )

        # プレイスタイルの選択内容を準備する
        play_style_slugs_to_save = None

        if "play_style_slugs" in fields_set:

            # 重複と前後の空白を取り除く
            play_style_slugs_to_save = list(dict.fromkeys(
                slug.strip()
                for slug in (user_data.play_style_slugs or [])
                if slug.strip()
            ))

            # DBに登録されているプレイスタイルのslugを取得する
            available_styles = connection.execute(
                text("""
                    SELECT slug
                    FROM play_styles
                """)
            ).scalars().all()

            available_style_slugs = set(available_styles)

            # 存在しないプレイスタイルが指定されていないか確認する
            unknown_styles = [
                slug
                for slug in play_style_slugs_to_save
                if slug not in available_style_slugs
            ]

            if unknown_styles:
                raise HTTPException(
                    status_code=400,
                    detail="存在しないプレイスタイルが指定されています"
                )

        # ==========================================
        # 2. usersテーブルの更新内容を準備する
        # ==========================================

        # SQLに渡す値をまとめる
        update_values = {
            "user_id": user_id
        }

        # 更新するカラムをまとめる
        update_parts = []

        # 表示名
        if "nickname" in fields_set:
            update_parts.append("nickname = :nickname")
            update_values["nickname"] = user_data.nickname

        # 好きなポケモン
        #
        # 新しい複数登録が送信された場合は、
        # 最初のポケモンを旧カラムにも保存する。
        # これにより既存機能との互換性を維持する。
        if favorite_pokemon_to_save is not None:

            old_favorite = (
                favorite_pokemon_to_save[0]
                if favorite_pokemon_to_save
                else None
            )

            update_parts.append(
                "favorite_pokemon = :favorite_pokemon"
            )
            update_values["favorite_pokemon"] = old_favorite

        # 使用する言語
        if "language" in fields_set:
            update_parts.append("language = :language")
            update_values["language"] = user_data.language

        # 自己紹介
        if "introduction" in fields_set:
            update_parts.append("introduction = :introduction")
            update_values["introduction"] = user_data.introduction

        # 性別
        if "gender" in fields_set:
            update_parts.append("gender = :gender")
            update_values["gender"] = user_data.gender

        # 性別の公開設定
        if (
            "is_gender_public" in fields_set
            and user_data.is_gender_public is not None
        ):
            update_parts.append(
                "is_gender_public = :is_gender_public"
            )
            update_values["is_gender_public"] = int(
                user_data.is_gender_public
            )

        # Nintendo Switchのフレンドコード
        if "friend_code" in fields_set:
            update_parts.append("friend_code = :friend_code")
            update_values["friend_code"] = user_data.friend_code

        # フレンドコードの公開設定
        if (
            "is_friend_code_public" in fields_set
            and user_data.is_friend_code_public is not None
        ):
            update_parts.append(
                "is_friend_code_public = :is_friend_code_public"
            )
            update_values["is_friend_code_public"] = int(
                user_data.is_friend_code_public
            )

        # プリセットアイコンの変更
        if (
            "avatar_preset" in fields_set
            and user_data.avatar_preset is not None
        ):
            update_parts.append("avatar_type = :avatar_type")
            update_parts.append("avatar_value = :avatar_value")

            update_values["avatar_type"] = "preset"
            update_values["avatar_value"] = user_data.avatar_preset

        # 更新対象がある場合だけUPDATE文を実行する
        #
        # カラム名はプログラム内で固定した文字列を使い、
        # ユーザー入力をSQLのカラム名として使用しない。
        if update_parts:

            update_sql = (
                "UPDATE users SET "
                + ", ".join(update_parts)
                + " WHERE id = :user_id"
            )

            connection.execute(
                text(update_sql),
                update_values
            )

        # ==========================================
        # 3. 好きなポケモンを複数保存する
        # ==========================================

        if favorite_pokemon_to_save is not None:

            # 以前の選択を削除する
            connection.execute(
                text("""
                    DELETE FROM user_favorite_pokemon
                    WHERE user_id = :user_id
                """),
                {
                    "user_id": user_id
                }
            )

            # 新しい選択を保存する
            for index, pokemon_name in enumerate(
                favorite_pokemon_to_save
            ):
                connection.execute(
                    text("""
                        INSERT INTO user_favorite_pokemon (
                            user_id,
                            pokemon_name,
                            display_order
                        )
                        VALUES (
                            :user_id,
                            :pokemon_name,
                            :display_order
                        )
                    """),
                    {
                        "user_id": user_id,
                        "pokemon_name": pokemon_name,
                        "display_order": index
                    }
                )

        # ==========================================
        # 4. よく遊ぶゲームを複数保存する
        # ==========================================

        if game_slugs_to_save is not None:

            # 以前のゲーム選択を削除する
            connection.execute(
                text("""
                    DELETE FROM user_games
                    WHERE user_id = :user_id
                """),
                {
                    "user_id": user_id
                }
            )

            # 選択されたゲームを1件ずつ関連付ける
            for slug in game_slugs_to_save:

                # ゲームのIDを取得する
                game_result = connection.execute(
                    text("""
                        SELECT id
                        FROM pokemon_games
                        WHERE slug = :slug
                    """),
                    {
                        "slug": slug
                    }
                )

                game = game_result.fetchone()

                # 存在確認は上ですでに行っている
                if game is not None:

                    connection.execute(
                        text("""
                            INSERT INTO user_games (
                                user_id,
                                game_id
                            )
                            VALUES (
                                :user_id,
                                :game_id
                            )
                        """),
                        {
                            "user_id": user_id,
                            "game_id": game.id
                        }
                    )

        # ==========================================
        # 5. プレイスタイルを複数保存する
        # ==========================================

        if play_style_slugs_to_save is not None:

            # 以前のプレイスタイルを削除する
            connection.execute(
                text("""
                    DELETE FROM user_play_styles
                    WHERE user_id = :user_id
                """),
                {
                    "user_id": user_id
                }
            )

            # 選択されたプレイスタイルを1件ずつ関連付ける
            for slug in play_style_slugs_to_save:

                # プレイスタイルのIDを取得する
                style_result = connection.execute(
                    text("""
                        SELECT id
                        FROM play_styles
                        WHERE slug = :slug
                    """),
                    {
                        "slug": slug
                    }
                )

                style = style_result.fetchone()

                # 存在確認は上ですでに行っている
                if style is not None:

                    connection.execute(
                        text("""
                            INSERT INTO user_play_styles (
                                user_id,
                                play_style_id
                            )
                            VALUES (
                                :user_id,
                                :play_style_id
                            )
                        """),
                        {
                            "user_id": user_id,
                            "play_style_id": style.id
                        }
                    )

        # すべてのプロフィール変更を確定する
        #
        # 途中でエラーが発生して確定前に接続が閉じられた場合、
        # 未確定のトランザクションはロールバックされる。
        connection.commit()

    return {
        "message": "プロフィールを更新しました"
    }
