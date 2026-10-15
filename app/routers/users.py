
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
                    introduction
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

        users = []

        # DBの結果を1行ずつ処理する
        for row in result:

            users.append({
                "id": row.id,
                "nickname": row.nickname,
                "favorite_pokemon": row.favorite_pokemon,
                "language": row.language,
                "introduction": row.introduction,
            })

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
                    is_profile_public
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

        # ユーザー情報を返す
        #
        # login_idやpassword_hash、
        # 公開設定の内部情報は返さない。
        return {
            "id": user.id,
            "nickname": user.nickname,
            "favorite_pokemon": user.favorite_pokemon,
            "language": user.language,
            "introduction": user.introduction,
        }


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

        # 公開設定を更新する
        result = connection.execute(
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

        # ユーザーが存在しない場合
        if result.rowcount == 0:
            connection.rollback()

            raise HTTPException(
                status_code=404,
                detail="ユーザーが見つかりません",
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
            connection.execute(
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
