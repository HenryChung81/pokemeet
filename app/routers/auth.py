from fastapi import APIRouter
from sqlalchemy import text
from pwdlib import PasswordHash

from app.database import engine
from app.schemas.user import LoginRequest


# 認証関係のRouterを作る
router = APIRouter()


# パスワードを検証するための機能
password_hash = PasswordHash.recommended()


# ログインAPI
@router.post("/login")
def login(login_data: LoginRequest):

    # MySQLへ接続する
    with engine.connect() as connection:

        # nicknameが一致するユーザーを検索する
        result = connection.execute(
            text("""
                SELECT
                    id,
                    nickname,
                    password_hash
                FROM users
                WHERE nickname = :nickname
            """),
            {
                "nickname": login_data.nickname
            }
        )

        # 検索結果から1件取得する
        user = result.fetchone()

        # ユーザーが存在しない場合
        if user is None:
            return {
                "message": "ユーザーが見つかりません"
            }

        # 入力されたパスワードと
        # DBのハッシュ値を比較する
        password_ok = password_hash.verify(
            login_data.password,
            user.password_hash
        )

        # パスワードが違う場合
        if not password_ok:
            return {
                "message": "パスワードが違います"
            }

        # 認証成功
        return {
            "message": "ログイン成功",
            "user_id": user.id,
            "nickname": user.nickname
        }