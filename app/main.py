from fastapi import FastAPI
from sqlalchemy import text
from pydantic import BaseModel
from pwdlib import PasswordHash

from app.database import engine


# FastAPIのアプリ本体を作る
app = FastAPI()


# パスワードを安全にハッシュ化するための設定
# recommended() を使うことで、pwdlib推奨の方式を利用する
password_hash = PasswordHash.recommended()


# ユーザー登録時に受け取るJSONの形を定義する
class UserCreate(BaseModel):
    nickname: str
    password: str


# トップページ
@app.get("/")
def home():
    return {
        "message": "PokeMeetへようこそ！"
    }


# ユーザー一覧を取得するAPI
@app.get("/users")
def get_users():

    # MySQLへ接続する
    with engine.connect() as connection:

        # usersテーブルから全ユーザーを取得する
        result = connection.execute(
            text("SELECT * FROM users")
        )

        # APIで返すデータを入れるリスト
        users = []

        # DBから取得した結果を1行ずつ処理する
        for row in result:

            # password_hashは外部へ返さない
            users.append({
                "id": row.id,
                "nickname": row.nickname
            })

        return users


# 新しいユーザーを登録するAPI
@app.post("/users")
def create_user(user: UserCreate):

    # ユーザーが入力したパスワードをハッシュ化する
    hashed_password = password_hash.hash(user.password)

    # MySQLへ接続する
    with engine.connect() as connection:

        # usersテーブルへ登録する
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

        # INSERTした変更を確定する
        connection.commit()

    return {
        "message": "ユーザーを登録しました"
    }