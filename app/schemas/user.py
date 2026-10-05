from pydantic import BaseModel


# ユーザー登録時に受け取るデータ
class UserCreate(BaseModel):
    nickname: str
    password: str
    favorite_pokemon: str | None = None
    language: str | None = None
    introduction: str | None = None


# ログイン時に受け取るデータ
class LoginRequest(BaseModel):
    nickname: str
    password: str


# プロフィール編集時に受け取るデータ
class UserUpdate(BaseModel):
    nickname: str
    favorite_pokemon: str | None = None
    language: str | None = None
    introduction: str | None = None