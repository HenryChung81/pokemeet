from typing import Literal

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
    # 既存機能との互換性を維持するため、1つの文字列も受け付ける
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
    # 既存のフロントエンドとの互換性を維持するために残す
    favorite_pokemon: str | None = None

    # 好きなポケモンの一覧
    # 新しいプロフィール画面では複数のポケモンを登録する
    favorite_pokemon_list: list[str] | None = None

    # 使用する言語
    language: str | None = None

    # 自己紹介
    introduction: str | None = None

    # 性別
    # 未入力の場合はNoneを受け付ける
    gender: str | None = None

    # 性別を公開するかどうか
    # Trueなら公開、Falseなら非公開
    is_gender_public: bool | None = None

    # Nintendo Switchのフレンドコード
    # 未入力の場合はNoneを受け付ける
    friend_code: str | None = None

    # フレンドコードを公開するかどうか
    # Trueなら公開、Falseなら非公開
    is_friend_code_public: bool | None = None

    # プリセットアイコンの選択
    #
    # Literalを使うことで、指定した識別子以外の値を
    # 受け付けないようにする。
    #
    # アップロード画像の保存先は、この項目では直接指定しない。
    # 画像アップロードAPI側で保存先を設定する。
    avatar_preset: (
        Literal[
            "pokeball",
            "pikachu",
            "eevee",
            "venusaur",
            "charizard",
            "blastoise",
        ]
        | None
    ) = None

    # よく遊ぶポケモンのゲーム
    #
    # ゲーム名そのものではなく、DBに登録したslugを送信する。
    # 例：["pokemon-sv", "pokemon-go"]
    game_slugs: list[str] | None = None

    # プレイスタイル
    #
    # DBに登録したslugを複数指定できる。
    # 例：["battle", "trading", "raids"]
    play_style_slugs: list[str] | None = None