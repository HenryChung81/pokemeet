from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routers import users
from app.routers import auth
from app.routers import events


# FastAPIアプリ本体
app = FastAPI()


# 交流会画像保存用フォルダを作成する
Path("uploads/events").mkdir(
    parents=True,
    exist_ok=True
)


# アップロードした画像をブラウザから表示できるようにする
app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads"
)


# ReactからFastAPIへのアクセスを許可する
app.add_middleware(
    CORSMiddleware,

    # React開発サーバーからのアクセスだけ許可
    allow_origins=[
        "http://localhost:5173"
    ],

    # Cookieなどの認証情報を許可
    allow_credentials=True,

    # GET、POST、PUT、DELETEなどを許可
    allow_methods=["*"],

    # AuthorizationなどのHTTPヘッダーを許可
    allow_headers=["*"],
)


# ユーザー関係APIを登録
app.include_router(users.router)


# 認証関係APIを登録
app.include_router(auth.router)


# 交流会関係APIを登録
app.include_router(events.router)


# トップページ
@app.get("/")
def home():

    return {
        "message": "PokeMeetへようこそ！"
    }