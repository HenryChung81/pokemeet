from fastapi import APIRouter
from sqlalchemy import text
from pwdlib import PasswordHash

from app.database import engine
from app.schemas.user import UserCreate


# このファイル専用のRouterを作る
router = APIRouter()


# パスワードをハッシュ化するための機能
password_hash = PasswordHash.recommended()


# ユーザー一覧取得API
@router.get("/users")
def get_users():

    # MySQLへ接続する
    with engine.connect() as connection:

        # usersテーブルのデータを取得する
        result = connection.execute(
            text("SELECT * FROM users")
        )

        # APIで返すユーザー一覧
        users = []

        # DBの結果を1行ずつ処理する
        for row in result:

            users.append({
                "id": row.id,
                "nickname": row.nickname
            })

        return users


# ユーザー新規登録API
@router.post("/users")
def create_user(user: UserCreate):

    # 入力されたパスワードをハッシュ化する
    hashed_password = password_hash.hash(
        user.password
    )

    # MySQLへ接続する
    with engine.connect() as connection:

        # usersテーブルへ登録
        connection.execute(
            text("""
                INSERT INTO users (
                    nickname,
                    password_hash
                )
                VALUES (
                    :nickname,
                    :password_hash
                )
            """),
            {
                "nickname": user.nickname,
                "password_hash": hashed_password
            }
        )

        # DB変更を確定する
        connection.commit()

    return {
        "message": "ユーザーを登録しました"
    }