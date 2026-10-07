from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text

from app.database import engine
from app.schemas.event import EventCreate
from app.routers.auth import get_current_user_id


router = APIRouter()


# =========================================================
# 交流会一覧
# =========================================================

@router.get("/events")
def get_events():
    with engine.connect() as connection:
        result = connection.execute(
            text("""
                SELECT
                    e.id,
                    e.title,
                    e.description,
                    e.event_date,
                    e.location,
                    e.capacity,
                    e.participation_fee,
                    e.created_by,
                    e.created_at,
                    COUNT(ep.id) AS participant_count
                FROM events e
                LEFT JOIN event_participants ep
                    ON e.id = ep.event_id
                GROUP BY
                    e.id,
                    e.title,
                    e.description,
                    e.event_date,
                    e.location,
                    e.capacity,
                    e.participation_fee,
                    e.created_by,
                    e.created_at
                ORDER BY e.event_date ASC
            """)
        )

        events = []

        for row in result:
            participant_count = int(row.participant_count)
            remaining_slots = max(
                row.capacity - participant_count,
                0
            )

            events.append({
                "id": row.id,
                "title": row.title,
                "description": row.description,
                "event_date": row.event_date,
                "location": row.location,
                "capacity": row.capacity,
                "participation_fee": row.participation_fee,
                "created_by": row.created_by,
                "created_at": row.created_at,
                "participant_count": participant_count,
                "remaining_slots": remaining_slots,
            })

        return events


# =========================================================
# 交流会詳細
# =========================================================

@router.get("/events/{event_id}")
def get_event(
    event_id: int,
    user_id: int = Depends(get_current_user_id)
):
    with engine.connect() as connection:
        result = connection.execute(
            text("""
                SELECT
                    e.id,
                    e.title,
                    e.description,
                    e.event_date,
                    e.location,
                    e.capacity,
                    e.participation_fee,
                    e.created_by,
                    e.created_at,
                    COUNT(ep.id) AS participant_count
                FROM events e
                LEFT JOIN event_participants ep
                    ON e.id = ep.event_id
                WHERE e.id = :event_id
                GROUP BY
                    e.id,
                    e.title,
                    e.description,
                    e.event_date,
                    e.location,
                    e.capacity,
                    e.participation_fee,
                    e.created_by,
                    e.created_at
            """),
            {
                "event_id": event_id
            }
        )

        event = result.fetchone()

        if event is None:
            raise HTTPException(
                status_code=404,
                detail="交流会が見つかりません"
            )

        participant_count = int(event.participant_count)

        remaining_slots = max(
            event.capacity - participant_count,
            0
        )

        joined_result = connection.execute(
            text("""
                SELECT id
                FROM event_participants
                WHERE event_id = :event_id
                  AND user_id = :user_id
            """),
            {
                "event_id": event_id,
                "user_id": user_id
            }
        )

        is_joined = joined_result.fetchone() is not None

        return {
            "id": event.id,
            "title": event.title,
            "description": event.description,
            "event_date": event.event_date,
            "location": event.location,
            "capacity": event.capacity,
            "participation_fee": event.participation_fee,
            "created_by": event.created_by,
            "created_at": event.created_at,
            "participant_count": participant_count,
            "remaining_slots": remaining_slots,
            "is_joined": is_joined,
        }


# =========================================================
# 交流会作成
# =========================================================

@router.post("/events")
def create_event(
    event_data: EventCreate,
    user_id: int = Depends(get_current_user_id)
):
    if event_data.capacity <= 0:
        raise HTTPException(
            status_code=400,
            detail="定員は1名以上にしてください"
        )

    if event_data.participation_fee < 0:
        raise HTTPException(
            status_code=400,
            detail="参加料金は0円以上にしてください"
        )

    with engine.connect() as connection:
        connection.execute(
            text("""
                INSERT INTO events (
                    title,
                    description,
                    event_date,
                    location,
                    capacity,
                    participation_fee,
                    created_by
                )
                VALUES (
                    :title,
                    :description,
                    :event_date,
                    :location,
                    :capacity,
                    :participation_fee,
                    :created_by
                )
            """),
            {
                "title": event_data.title,
                "description": event_data.description,
                "event_date": event_data.event_date,
                "location": event_data.location,
                "capacity": event_data.capacity,
                "participation_fee": event_data.participation_fee,
                "created_by": user_id
            }
        )

        connection.commit()

    return {
        "message": "交流会を作成しました"
    }


# =========================================================
# 交流会に参加
# =========================================================

@router.post("/events/{event_id}/join")
def join_event(
    event_id: int,
    user_id: int = Depends(get_current_user_id)
):
    with engine.connect() as connection:
        transaction = connection.begin()

        try:
            # -------------------------------------------------
            # 交流会をロックして取得
            # 同時に複数人が参加した場合の定員オーバーを防ぐ
            # -------------------------------------------------

            event_result = connection.execute(
                text("""
                    SELECT
                        id,
                        capacity
                    FROM events
                    WHERE id = :event_id
                    FOR UPDATE
                """),
                {
                    "event_id": event_id
                }
            )

            event = event_result.fetchone()

            if event is None:
                transaction.rollback()

                raise HTTPException(
                    status_code=404,
                    detail="交流会が見つかりません"
                )

            # -------------------------------------------------
            # すでに参加しているか確認
            # -------------------------------------------------

            joined_result = connection.execute(
                text("""
                    SELECT id
                    FROM event_participants
                    WHERE event_id = :event_id
                      AND user_id = :user_id
                """),
                {
                    "event_id": event_id,
                    "user_id": user_id
                }
            )

            already_joined = joined_result.fetchone()

            if already_joined is not None:
                transaction.rollback()

                raise HTTPException(
                    status_code=400,
                    detail="すでにこの交流会に参加しています"
                )

            # -------------------------------------------------
            # 現在の参加者数を取得
            # -------------------------------------------------

            count_result = connection.execute(
                text("""
                    SELECT COUNT(*) AS participant_count
                    FROM event_participants
                    WHERE event_id = :event_id
                """),
                {
                    "event_id": event_id
                }
            )

            participant_count = int(
                count_result.fetchone().participant_count
            )

            # -------------------------------------------------
            # 定員チェック
            # -------------------------------------------------

            if participant_count >= event.capacity:
                transaction.rollback()

                raise HTTPException(
                    status_code=400,
                    detail="この交流会は満員です"
                )

            # -------------------------------------------------
            # 参加登録
            # -------------------------------------------------

            connection.execute(
                text("""
                    INSERT INTO event_participants (
                        event_id,
                        user_id
                    )
                    VALUES (
                        :event_id,
                        :user_id
                    )
                """),
                {
                    "event_id": event_id,
                    "user_id": user_id
                }
            )

            transaction.commit()

            return {
                "message": "交流会に参加しました"
            }

        except HTTPException:
            raise

        except Exception:
            transaction.rollback()
            raise


# =========================================================
# 交流会から退出
# =========================================================

@router.delete("/events/{event_id}/join")
def leave_event(
    event_id: int,
    user_id: int = Depends(get_current_user_id)
):
    with engine.connect() as connection:
        result = connection.execute(
            text("""
                DELETE FROM event_participants
                WHERE event_id = :event_id
                  AND user_id = :user_id
            """),
            {
                "event_id": event_id,
                "user_id": user_id
            }
        )

        connection.commit()

        if result.rowcount == 0:
            raise HTTPException(
                status_code=400,
                detail="この交流会には参加していません"
            )

        return {
            "message": "交流会への参加をキャンセルしました"
        }