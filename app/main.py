from fastapi import FastAPI

from app.routers import users
from app.routers import auth


# FastAPIアプリ本体を作る
app = FastAPI()


# users.pyで定義したRouterを
# FastAPIアプリに登録する
app.include_router(users.router)


# auth.pyで定義したRouterを
# FastAPIアプリに登録する
app.include_router(auth.router)


# トップページ
@app.get("/")
def home():

    return {
        "message": "PokeMeetへようこそ！"
    }