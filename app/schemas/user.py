from pydantic import BaseModel


# ユーザー登録時に受け取るデータ
class UserCreate(BaseModel):
    nickname: str
    password: str


# ログイン時に受け取るデータ
class LoginRequest(BaseModel):
    nickname: str
    password: str