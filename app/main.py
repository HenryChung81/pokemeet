from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routers import users, auth, events, avatars

app = FastAPI()

# イベント画像・プロフィール画像の保存先を作成
Path("uploads/events").mkdir(parents=True, exist_ok=True)
Path("uploads/avatars").mkdir(parents=True, exist_ok=True)

# uploadsフォルダを静的ファイルとして公開
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Viteの開発サーバーからのアクセスを許可
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(auth.router)
app.include_router(events.router)
app.include_router(avatars.router)


@app.get("/")
def home():
    return {"message": "PokeMeetへようこそ！"}
