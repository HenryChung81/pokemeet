
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel
from pwdlib import PasswordHash

from app.database import engine
from app.schemas.user import UserCreate
from app.routers.auth import get_current_user_id


# ユーザー関係のAPIをまとめるRouter
router = APIRouter()


# パスワードのハッシュ化に使う
password_hash = PasswordHash.recommended()


# プロフィール公開設定の更新に使う型
class ProfileVisibilityUpdate(BaseModel):
    is_profile_public: bool


# ユーザーのプロフィール情報を組み立てる共通処理
#
# ユーザー一覧APIとユーザー詳細APIで共通して使用する。
# 既存のプロフィール項目に加え、好きなポケモン一覧、
# ゲーム、プレイスタイル、アイコン情報を取得する。
def _build_user_response(
    connection,
    user,
    current_user_id: int,
):
    # 本人かどうかを確認する。
    # 性別とフレンドコードの個別公開設定は、本人以外には適用する。
    is_self = user.id == current_user_id

    # 好きなポケモンの一覧を取得する
    favorite_result = connection.execute(
        text("""
            SELECT pokemon_name
            FROM user_favorite_pokemon
            WHERE user_id = :user_id
            ORDER BY display_order ASC, pokemon_name ASC
        """),
        {"user_id": user.id},
    )

    favorite_pokemon_list = [
        row.pokemon_name
        for row in favorite_result.fetchall()
    ]

    # 移行前のデータや一覧テーブルに登録されていない
    # 既存ユーザーにも対応するため、従来の項目を予備として使う。
    if (
        not favorite_pokemon_list
        and user.favorite_pokemon
        and user.favorite_pokemon.strip()
    ):
        favorite_pokemon_list = [
            user.favorite_pokemon.strip()
        ]

    # よく遊ぶポケモンのゲームをslugで取得する
    game_result = connection.execute(
        text("""
            SELECT pg.slug
            FROM user_games AS ug
            JOIN pokemon_games AS pg
                ON pg.id = ug.game_id
            WHERE ug.user_id = :user_id
            ORDER BY pg.id ASC
        """),
        {"user_id": user.id},
    )

    game_slugs = [
        row.slug
        for row in game_result.fetchall()
    ]

    # プレイスタイルをslugで取得する
    play_style_result = connection.execute(
        text("""
            SELECT ps.slug
            FROM user_play_styles AS ups
            JOIN play_styles AS ps
                ON ps.id = ups.play_style_id
            WHERE ups.user_id = :user_id
            ORDER BY ps.id ASC
        """),
        {"user_id": user.id},
    )

    play_style_slugs = [
        row.slug
        for row in play_style_result.fetchall()
    ]

    # アイコンの種類と保存値を取得する
    avatar_type = user.avatar_type or "preset"
    avatar_value = user.avatar_value

    # プリセットアイコンの場合はプリセット名を返す。
    # アップロード画像の場合は保存値を画像URLとして返す。
    avatar_preset = (
        avatar_value
        if avatar_type == "preset"
        else None
    )

    avatar_url = (
        avatar_value
        if avatar_type in ("upload", "uploaded")
        else None
    )

    # ユーザー情報を返す
    #
    # login_id、password_hash、個別の公開設定そのものは返さない。
    # 非公開の性別・フレンドコードはNoneにして値を隠す。
    return {
        "id": user.id,
        "nickname": user.nickname,
        "favorite_pokemon": user.favorite_pokemon,
        "favorite_pokemon_list": favorite_pokemon_list,
        "language": user.language,
        "introduction": user.introduction,
        "gender": (
            user.gender
            if is_self or bool(user.is_gender_public)
            else None
        ),
        "friend_code": (
            user.friend_code
            if is_self or bool(user.is_friend_code_public)
            else None
        ),
        "avatar_type": avatar_type,
        "avatar_preset": avatar_preset,
        "avatar_url": avatar_url,
        "game_slugs": game_slugs,
        "play_style_slugs": play_style_slugs,
    }


# ユーザー一覧取得API
@router.get("/users")
def get_users(
    current_user_id: int = Depends(get_current_user_id),
):

    # MySQLへ接続する
    with engine.connect() as connection:

        # ログインユーザーの権限を確認する
        requester_result = connection.execute(
            text("""
                SELECT role
                FROM users
                WHERE id = :user_id
            """),
            {"user_id": current_user_id},
        )

        requester = requester_result.fetchone()

        if requester is None:
            raise HTTPException(
                status_code=404,
                detail="ユーザーが見つかりません",
            )

        # 管理者かどうかを確認する
        is_admin = requester.role == "admin"

        # 公開プロフィールと自分のプロフィールを取得する
        # 管理者は非公開プロフィールも取得できる
        result = connection.execute(
            text("""
                SELECT
                    id,
                    nickname,
                    favorite_pokemon,
                    language,
                    introduction,
                    gender,
                    is_gender_public,
                    friend_code,
                    is_friend_code_public,
                    avatar_type,
                    avatar_value
                FROM users
                WHERE
                    (:is_admin = 1)
                    OR (is_profile_public = 1)
                    OR (id = :current_user_id)
                ORDER BY id ASC
            """),
            {
                "is_admin": int(is_admin),
                "current_user_id": current_user_id,
            },
        )

        # 後続の追加クエリを実行する前に、一覧結果を取得しておく
        user_rows = result.fetchall()

        users = []

        # DBの結果を1行ずつ処理する
        for row in user_rows:

            # 共通処理で新しいプロフィール項目も組み立てる
            users.append(
                _build_user_response(
                    connection,
                    row,
                    current_user_id,
                )
            )

        return users


# ユーザー詳細取得API
@router.get("/users/{user_id}")
def get_user(
    user_id: int,
    current_user_id: int = Depends(get_current_user_id),
):

    # MySQLへ接続する
    with engine.connect() as connection:

        # ログインユーザーの権限を確認する
        requester_result = connection.execute(
            text("""
                SELECT role
                FROM users
                WHERE id = :current_user_id
            """),
            {"current_user_id": current_user_id},
        )

        requester = requester_result.fetchone()

        if requester is None:
            raise HTTPException(
                status_code=404,
                detail="ユーザーが見つかりません",
            )

        # 管理者かどうかを確認する
        is_admin = requester.role == "admin"

        # 指定されたIDのユーザーを取得する
        result = connection.execute(
            text("""
                SELECT
                    id,
                    nickname,
                    favorite_pokemon,
                    language,
                    introduction,
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
            {"user_id": user_id},
        )

        # DBから1件取得する
        user = result.fetchone()

        # ユーザーが存在しない場合
        if user is None:
            raise HTTPException(
                status_code=404,
                detail="ユーザーが見つかりません",
            )

        # 非公開プロフィールは本人と管理者以外に見せない
        # 非公開であること自体も外部に知らせないよう404を返す
        if (
            not bool(user.is_profile_public)
            and user_id != current_user_id
            and not is_admin
        ):
            raise HTTPException(
                status_code=404,
                detail="ユーザーが見つかりません",
            )

        # 共通処理でプロフィール情報を組み立てる
        # 性別・フレンドコードは、それぞれの公開設定にも従う
        return _build_user_response(
            connection,
            user,
            current_user_id,
        )


# 自分のプロフィール公開設定を取得するAPI
@router.get("/me/profile-visibility")
def get_profile_visibility(
    user_id: int = Depends(get_current_user_id),
):

    # MySQLへ接続する
    with engine.connect() as connection:

        # 自分の公開設定を取得する
        result = connection.execute(
            text("""
                SELECT is_profile_public
                FROM users
                WHERE id = :user_id
            """),
            {"user_id": user_id},
        )

        user = result.fetchone()

        # ユーザーが存在しない場合
        if user is None:
            raise HTTPException(
                status_code=404,
                detail="ユーザーが見つかりません",
            )

        return {
            "is_profile_public": bool(user.is_profile_public)
        }


# 自分のプロフィール公開設定を更新するAPI
@router.put("/me/profile-visibility")
def update_profile_visibility(
    visibility: ProfileVisibilityUpdate,
    user_id: int = Depends(get_current_user_id),
):

    # MySQLへ接続する
    with engine.connect() as connection:

        # 先にユーザーが存在するか確認する
        #
        # UPDATEのrowcountだけで判断すると、
        # 設定値が変更されなかった場合にも
        # ユーザーが存在しないと誤判定する可能性がある。
        user_result = connection.execute(
            text("""
                SELECT id
                FROM users
                WHERE id = :user_id
            """),
            {"user_id": user_id},
        )

        user = user_result.fetchone()

        # ユーザーが存在しない場合
        if user is None:
            raise HTTPException(
                status_code=404,
                detail="ユーザーが見つかりません",
            )

        # 公開設定を更新する
        connection.execute(
            text("""
                UPDATE users
                SET is_profile_public = :is_profile_public
                WHERE id = :user_id
            """),
            {
                "is_profile_public": int(
                    visibility.is_profile_public
                ),
                "user_id": user_id,
            },
        )

        # DBの変更を確定する
        connection.commit()

    return {
        "message": "プロフィールの公開設定を更新しました",
        "is_profile_public": visibility.is_profile_public,
    }


# ユーザー新規登録API
@router.post("/users")
def create_user(user: UserCreate):

    # 入力されたパスワードをハッシュ化する
    #
    # DBには平文のパスワードを保存しない。
    hashed_password = password_hash.hash(
        user.password
    )

    # MySQLへ接続する
    with engine.connect() as connection:

        try:

            # ユーザー情報をDBへ登録する
            #
            # login_idとnicknameを別々に保存する。
            # is_profile_publicはDBのデフォルト値（公開）を使用する。
            insert_result = connection.execute(
                text("""
                    INSERT INTO users (
                        login_id,
                        nickname,
                        password_hash,
                        favorite_pokemon,
                        language,
                        introduction
                    )
                    VALUES (
                        :login_id,
                        :nickname,
                        :password_hash,
                        :favorite_pokemon,
                        :language,
                        :introduction
                    )
                """),
                {
                    # ログインに使用するID
                    "login_id": user.login_id,

                    # 他のユーザーに表示する名前
                    "nickname": user.nickname,

                    # ハッシュ化したパスワード
                    "password_hash": hashed_password,

                    # 好きなポケモン
                    "favorite_pokemon":
                        user.favorite_pokemon,

                    # 使用する言語
                    "language": user.language,

                    # 自己紹介
                    "introduction": user.introduction,
                },
            )

            # 新しく登録したユーザーのIDを取得する
            new_user_id = insert_result.lastrowid

            # 好きなポケモンが入力されている場合は、
            # 新しい一覧テーブルにも登録する。
            #
            # 従来のfavorite_pokemon列も引き続き保存するため、
            # 既存機能との互換性を維持できる。
            if (
                user.favorite_pokemon
                and user.favorite_pokemon.strip()
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
                            0
                        )
                    """),
                    {
                        "user_id": new_user_id,
                        "pokemon_name":
                            user.favorite_pokemon.strip(),
                    },
                )

            # INSERTを確定する
            connection.commit()

        except IntegrityError as error:

            # DBの変更を取り消す
            connection.rollback()

            # login_idのUNIQUE制約違反の場合
            if "uq_users_login_id" in str(error.orig):

                raise HTTPException(
                    status_code=400,
                    detail="このログインIDはすでに使用されています",
                )

            # その他のDBエラー
            raise HTTPException(
                status_code=500,
                detail="ユーザー登録に失敗しました",
            )

    return {
        "message": "ユーザーを登録しました"
    }
