import os
import jwt

from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import text
from pwdlib import PasswordHash

from app.database import engine
from app.schemas.user import LoginRequest


# .env ファイルの内容を読み込む
load_dotenv()


# 認証関係のAPIをまとめるRouter
router = APIRouter()


# パスワードのハッシュ化・検証に使う
password_hash = PasswordHash.recommended()


# Authorization: Bearer <token>
# という形式の認証を使う
security = HTTPBearer()


# .env からJWT署名用の秘密鍵を取得する
SECRET_KEY = os.getenv("SECRET_KEY")


# JWTの署名アルゴリズム
ALGORITHM = "HS256"


# JWTの有効期限
ACCESS_TOKEN_EXPIRE_MINUTES = 30


# JWTを作成する関数
def create_access_token(user_id: int):

    # 現在時刻から30分後をJWTの有効期限にする
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    # JWTの中に入れるデータ
    payload = {
        # sub は subject の略
        # 「このJWTが誰のものか」を表す
        "sub": str(user_id),

        # exp は expiration の略
        # JWTの有効期限
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
# ログイン中ユーザーのIDを取得する関数
def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    # Authorizationヘッダーから
    # JWT本体だけを取得する
    token = credentials.credentials

    try:

        # JWTを検証して中身を取り出す
        #
        # ・署名が正しいか
        # ・有効期限が切れていないか
        #
        # などを確認してくれる
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        # JWTのsubからuser_idを取得する
        user_id = payload.get("sub")

        # user_idがJWTに入っていない場合
        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="無効なトークンです"
            )

        # JWTでは文字列として保存しているため
        # int型へ変換して返す
        return int(user_id)

    # JWTが壊れている、
    # 署名が違う、
    # 有効期限が切れている、
    # などの場合
    except jwt.PyJWTError:

        raise HTTPException(
            status_code=401,
            detail="無効なトークンです"
        )


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
            raise HTTPException(
                status_code=401,
                detail="ユーザー名またはパスワードが違います"
            )

        # ユーザーが入力したパスワードと
        # DBに保存されているハッシュ値を比較する
        password_ok = password_hash.verify(
            login_data.password,
            user.password_hash
        )

        # パスワードが一致しない場合
        if not password_ok:
            raise HTTPException(
                status_code=401,
                detail="ユーザー名またはパスワードが違います"
            )

        # ログイン成功したユーザー用のJWTを作る
        access_token = create_access_token(
            user.id
        )

        # JWTをクライアントへ返す
        return {
            "message": "ログイン成功",
            "access_token": access_token,
            "token_type": "bearer"
        }


# ログイン中ユーザー取得API
@router.get("/me")
def get_me(
    # /meを実行する前に
    # get_current_user_id()を実行して
    # JWTからuser_idを取得する
    user_id: int = Depends(get_current_user_id)
):

    # MySQLへ接続する
    with engine.connect() as connection:

        # JWTから取得したuser_idを使って
        # ユーザー情報を検索する
        result = connection.execute(
            text("""
                SELECT
                    id,
                    nickname
                FROM users
                WHERE id = :user_id
            """),
            {
                "user_id": user_id
            }
        )

        # 検索結果から1件取得する
        user = result.fetchone()

        # JWT自体は正しいが、
        # DB上にユーザーが存在しない場合
        if user is None:
            raise HTTPException(
                status_code=404,
                detail="ユーザーが見つかりません"
            )

        # ログイン中ユーザーの情報を返す
        return {
            "id": user.id,
            "nickname": user.nickname
        }