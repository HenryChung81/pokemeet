from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text

from app.database import engine
from app.schemas.event import EventCreate
from app.routers.auth import get_current_user_id


# 交流会関係のAPIをまとめるRouter
router = APIRouter()


# 交流会一覧取得API
@router.get("/events")
def get_events():

    # MySQLへ接続する
    with engine.connect() as connection:

        # eventsテーブルから交流会一覧を取得する
        result = connection.execute(
            text("""
                SELECT
                    id,
                    title,
                    description,
                    event_date,
                    location,
                    capacity,
                    created_by,
                    created_at
                FROM events
                ORDER BY event_date ASC
            """)
        )

        events = []

        # DBの結果を1件ずつ処理する
        for row in result:

            events.append({
                "id": row.id,
                "title": row.title,
                "description": row.description,
                "event_date": row.event_date,
                "location": row.location,
                "capacity": row.capacity,
                "created_by": row.created_by,
                "created_at": row.created_at
            })

        return events


# 交流会詳細取得API
@router.get("/events/{event_id}")
def get_event(event_id: int):

    # MySQLへ接続する
    with engine.connect() as connection:

        # 指定された交流会を取得する
        result = connection.execute(
            text("""
                SELECT
                    id,
                    title,
                    description,
                    event_date,
                    location,
                    capacity,
                    created_by,
                    created_at
                FROM events
                WHERE id = :event_id
            """),
            {
                "event_id": event_id
            }
        )

        # DBから1件取得する
        event = result.fetchone()

        # 交流会が存在しない場合
        if event is None:

            raise HTTPException(
                status_code=404,
                detail="交流会が見つかりません"
            )

        # 交流会情報を返す
        return {
            "id": event.id,
            "title": event.title,
            "description": event.description,
            "event_date": event.event_date,
            "location": event.location,
            "capacity": event.capacity,
            "created_by": event.created_by,
            "created_at": event.created_at
        }


# 交流会新規作成API
@router.post("/events")
def create_event(
    event_data: EventCreate,
    user_id: int = Depends(get_current_user_id)
):

    # MySQLへ接続する
    with engine.connect() as connection:

        # 交流会をDBへ登録する
        connection.execute(
            text("""
                INSERT INTO events (
                    title,
                    description,
                    event_date,
                    location,
                    capacity,
                    created_by
                )
                VALUES (
                    :title,
                    :description,
                    :event_date,
                    :location,
                    :capacity,
                    :created_by
                )
            """),
            {
                "title": event_data.title,
                "description": event_data.description,
                "event_date": event_data.event_date,
                "location": event_data.location,
                "capacity": event_data.capacity,
                "created_by": user_id
            }
        )

        # INSERTを確定する
        connection.commit()

    return {
        "message": "交流会を作成しました"
    }