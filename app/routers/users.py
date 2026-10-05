from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from pwdlib import PasswordHash

from app.database import engine
from app.schemas.user import UserCreate


# ユーザー関係のAPIをまとめるRouter
router = APIRouter()


# パスワードのハッシュ化に使う
password_hash = PasswordHash.recommended()


# ユーザー一覧取得API
@router.get("/users")
def get_users():

    # MySQLへ接続する
    with engine.connect() as connection:

        # usersテーブルから必要な項目を取得する
        result = connection.execute(
            text("""
                SELECT
                    id,
                    nickname,
                    favorite_pokemon,
                    language,
                    introduction
                FROM users
            """)
        )

        users = []

        # DBの結果を1行ずつ処理する
        for row in result:

            users.append({
                "id": row.id,
                "nickname": row.nickname,
                "favorite_pokemon": row.favorite_pokemon,
                "language": row.language,
                "introduction": row.introduction
            })

        return users


# ユーザー詳細取得API
@router.get("/users/{user_id}")
def get_user(user_id: int):

    # MySQLへ接続する
    with engine.connect() as connection:

        # 指定されたIDのユーザーを取得する
        result = connection.execute(
            text("""
                SELECT
                    id,
                    nickname,
                    favorite_pokemon,
                    language,
                    introduction
                FROM users
                WHERE id = :user_id
            """),
            {
                "user_id": user_id
            }
        )

        # DBから1件取得する
        user = result.fetchone()

        # ユーザーが存在しない場合
        if user is None:
            raise HTTPException(
                status_code=404,
                detail="ユーザーが見つかりません"
            )

        # ユーザー情報を返す
        return {
            "id": user.id,
            "nickname": user.nickname,
            "favorite_pokemon": user.favorite_pokemon,
            "language": user.language,
            "introduction": user.introduction
        }


# ユーザー新規登録API
@router.post("/users")
def create_user(user: UserCreate):

    # 入力されたパスワードをハッシュ化する
    hashed_password = password_hash.hash(
        user.password
    )

    # MySQLへ接続する
    with engine.connect() as connection:

        # ユーザー情報をDBへ登録する
        connection.execute(
            text("""
                INSERT INTO users (
                    nickname,
                    password_hash,
                    favorite_pokemon,
                    language,
                    introduction
                )
                VALUES (
                    :nickname,
                    :password_hash,
                    :favorite_pokemon,
                    :language,
                    :introduction
                )
            """),
            {
                "nickname": user.nickname,
                "password_hash": hashed_password,
                "favorite_pokemon": user.favorite_pokemon,
                "language": user.language,
                "introduction": user.introduction
            }
        )

        # INSERTを確定する
        connection.commit()

    return {
        "message": "ユーザーを登録しました"
    }
