import os
import jwt

from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import text
from pwdlib import PasswordHash

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
                    role
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

        # パスワード情報は返さず、
        # プロフィール情報と権限だけ返す
        return {
            "id": user.id,
            "nickname": user.nickname,
            "favorite_pokemon": user.favorite_pokemon,
            "language": user.language,
            "introduction": user.introduction,
            "role": user.role
        }


# ログイン中ユーザーのプロフィール編集
@router.put("/me")
def update_me(
    user_data: UserUpdate,
    user_id: int = Depends(get_current_user_id)
):

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

        # プロフィール情報を更新する
        connection.execute(
            text("""
                UPDATE users
                SET
                    nickname = :nickname,
                    favorite_pokemon = :favorite_pokemon,
                    language = :language,
                    introduction = :introduction
                WHERE id = :user_id
            """),
            {
                "nickname": user_data.nickname,
                "favorite_pokemon": user_data.favorite_pokemon,
                "language": user_data.language,
                "introduction": user_data.introduction,
                "user_id": user_id
            }
        )

        # 更新内容を確定する
        connection.commit()

    return {
        "message": "プロフィールを更新しました"
    }