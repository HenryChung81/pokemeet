from datetime import datetime

from pydantic import BaseModel


# 交流会を新規作成するときに受け取るデータ
class EventCreate(BaseModel):

    # 交流会名
    title: str

    # 交流会の説明
    description: str | None = None

    # 開催日時
    event_date: datetime

    # 開催場所
    location: str

    # 定員
    capacity: int = 20


# 交流会一覧・詳細で返すデータ
class EventResponse(BaseModel):

    # 交流会ID
    id: int

    # 交流会名
    title: str

    # 交流会の説明
    description: str | None = None

    # 開催日時
    event_date: datetime

    # 開催場所
    location: str

    # 定員
    capacity: int

    # 作成したユーザーのID
    created_by: int

    # 作成日時
    created_at: datetime