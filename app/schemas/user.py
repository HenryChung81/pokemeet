from pydantic import BaseModel


# ユーザー登録時に受け取るデータ
#
# login_id：
# ログインするときに使用するID。
# ユーザーを識別するために使用する。
#
# nickname：
# 他のユーザーにも表示される名前。
# 後から変更できる。
class UserCreate(BaseModel):

    # ログイン専用のID
    login_id: str

    # 画面に表示するニックネーム
    nickname: str

    # ログイン用パスワード
    password: str

    # 好きなポケモン
    favorite_pokemon: str | None = None

    # 使用する言語
    language: str | None = None

    # 自己紹介
    introduction: str | None = None


# ログイン時に受け取るデータ
#
# ログインにはnicknameではなく、
# login_idを使用する。
class LoginRequest(BaseModel):

    # ログイン専用のID
    login_id: str

    # ログイン用パスワード
    password: str


# プロフィール編集時に受け取るデータ
#
# パスワードとlogin_idは今回は変更しない。
# プロフィールに関係する項目だけ変更する。
class UserUpdate(BaseModel):

    # 表示名
    # login_idとは別なので変更可能
    nickname: str

    # 好きなポケモン
    favorite_pokemon: str | None = None

    # 使用する言語
    language: str | None = None

    # 自己紹介
    introduction: str | None = None