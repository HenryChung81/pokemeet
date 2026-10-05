from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import users
from app.routers import auth


# FastAPIアプリ本体
app = FastAPI()


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


# トップページ
@app.get("/")
def home():

    return {
        "message": "PokeMeetへようこそ！"
    }