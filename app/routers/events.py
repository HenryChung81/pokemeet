
from pathlib import Path
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
)
from sqlalchemy import text

from app.database import engine
from app.schemas.event import EventCreate
from app.routers.auth import get_current_user_id


router = APIRouter()


# =========================================================
# 画像設定
# =========================================================

UPLOAD_DIR = Path("uploads/events")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

MAX_IMAGE_SIZE = 5 * 1024 * 1024


def delete_uploaded_image(image_url: str | None) -> None:
    """アプリがアップロードした画像だけを削除する。"""
    if not image_url:
        return

    relative_path = image_url.lstrip("/")

    if not relative_path.startswith("uploads/events/"):
        return

    filename = Path(relative_path).name
    file_path = UPLOAD_DIR / filename

    if file_path.is_file():
        file_path.unlink()


def check_event_permission(
    event_id: int,
    user_id: int,
):
    """交流会の存在と、管理者または作成者の権限を確認する。"""
    with engine.connect() as connection:
        result = connection.execute(
            text("""
                SELECT
                    e.id,
                    e.created_by,
                    e.image_url,
                    u.role
                FROM events e
                JOIN users u ON u.id = :user_id
                WHERE e.id = :event_id
            """),
            {
                "event_id": event_id,
                "user_id": user_id,
            },
        )
        event = result.fetchone()

    if event is None:
        raise HTTPException(
            status_code=404,
            detail="交流会が見つかりません",
        )

    if event.role != "admin" and event.created_by != user_id:
        raise HTTPException(
            status_code=403,
            detail="この交流会を変更する権限がありません",
        )

    return event


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
                    e.image_url,
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
                    e.image_url,
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
                0,
            )

            events.append({
                "id": row.id,
                "title": row.title,
                "description": row.description,
                "event_date": row.event_date,
                "location": row.location,
                "capacity": row.capacity,
                "participation_fee": row.participation_fee,
                "image_url": row.image_url,
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
    user_id: int = Depends(get_current_user_id),
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
                    e.image_url,
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
                    e.image_url,
                    e.created_by,
                    e.created_at
            """),
            {"event_id": event_id},
        )

        event = result.fetchone()

        if event is None:
            raise HTTPException(
                status_code=404,
                detail="交流会が見つかりません",
            )

        participant_count = int(event.participant_count)
        remaining_slots = max(
            event.capacity - participant_count,
            0,
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
                "user_id": user_id,
            },
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
            "image_url": event.image_url,
            "created_by": event.created_by,
            "created_at": event.created_at,
            "participant_count": participant_count,
            "remaining_slots": remaining_slots,
            "is_joined": is_joined,
        }


# =========================================================
# 交流会作成（管理者のみ）
# =========================================================

@router.post("/events")
def create_event(
    event_data: EventCreate,
    user_id: int = Depends(get_current_user_id),
):
    with engine.connect() as connection:
        user_result = connection.execute(
            text("""
                SELECT role
                FROM users
                WHERE id = :user_id
            """),
            {"user_id": user_id},
        )
        user = user_result.fetchone()

        if user is None:
            raise HTTPException(
                status_code=404,
                detail="ユーザーが見つかりません",
            )

        if user.role != "admin":
            raise HTTPException(
                status_code=403,
                detail="交流会を作成できるのは管理者のみです",
            )

        if event_data.capacity <= 0:
            raise HTTPException(
                status_code=400,
                detail="定員は1名以上にしてください",
            )

        if event_data.participation_fee < 0:
            raise HTTPException(
                status_code=400,
                detail="参加料金は0円以上にしてください",
            )

        result = connection.execute(
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
                "created_by": user_id,
            },
        )

        event_id = result.lastrowid
        connection.commit()

    return {
        "message": "交流会を作成しました",
        "event_id": event_id,
    }


# =========================================================
# 交流会編集（管理者または作成者）
# =========================================================

@router.put("/events/{event_id}")
def update_event(
    event_id: int,
    event_data: EventCreate,
    user_id: int = Depends(get_current_user_id),
):
    check_event_permission(event_id, user_id)

    if event_data.capacity <= 0:
        raise HTTPException(
            status_code=400,
            detail="定員は1名以上にしてください",
        )

    if event_data.participation_fee < 0:
        raise HTTPException(
            status_code=400,
            detail="参加料金は0円以上にしてください",
        )

    with engine.connect() as connection:
        connection.execute(
            text("""
                UPDATE events
                SET
                    title = :title,
                    description = :description,
                    event_date = :event_date,
                    location = :location,
                    capacity = :capacity,
                    participation_fee = :participation_fee
                WHERE id = :event_id
            """),
            {
                "event_id": event_id,
                "title": event_data.title,
                "description": event_data.description,
                "event_date": event_data.event_date,
                "location": event_data.location,
                "capacity": event_data.capacity,
                "participation_fee": event_data.participation_fee,
            },
        )
        connection.commit()

    return {
        "message": "交流会を更新しました",
        "event_id": event_id,
    }


# =========================================================
# 交流会削除（管理者または作成者）
# =========================================================

@router.delete("/events/{event_id}")
def delete_event(
    event_id: int,
    user_id: int = Depends(get_current_user_id),
):
    event = check_event_permission(event_id, user_id)
    old_image_url = event.image_url

    with engine.connect() as connection:
        transaction = connection.begin()

        try:
            connection.execute(
                text("""
                    DELETE FROM event_participants
                    WHERE event_id = :event_id
                """),
                {"event_id": event_id},
            )

            connection.execute(
                text("""
                    DELETE FROM events
                    WHERE id = :event_id
                """),
                {"event_id": event_id},
            )

            transaction.commit()

        except Exception:
            transaction.rollback()
            raise

    delete_uploaded_image(old_image_url)

    return {
        "message": "交流会を削除しました",
        "event_id": event_id,
    }


# =========================================================
# 交流会画像アップロード
# =========================================================

@router.post("/events/{event_id}/image")
async def upload_event_image(
    event_id: int,
    image: UploadFile = File(...),
    user_id: int = Depends(get_current_user_id),
):
    if image.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="JPG、PNG、WebP画像のみアップロードできます",
        )

    # 画像変更の権限と既存画像を確認
    event = check_event_permission(event_id, user_id)
    old_image_url = event.image_url

    contents = await image.read()

    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="画像サイズは5MB以下にしてください",
        )

    extension = ALLOWED_IMAGE_TYPES[image.content_type]
    filename = f"{event_id}_{uuid4().hex}{extension}"
    file_path = UPLOAD_DIR / filename

    file_path.write_bytes(contents)
    image_url = f"/uploads/events/{filename}"

    try:
        with engine.connect() as connection:
            result = connection.execute(
                text("""
                    UPDATE events
                    SET image_url = :image_url
                    WHERE id = :event_id
                """),
                {
                    "image_url": image_url,
                    "event_id": event_id,
                },
            )

            if result.rowcount == 0:
                raise HTTPException(
                    status_code=404,
                    detail="交流会が見つかりません",
                )

            connection.commit()

    except Exception:
        if file_path.is_file():
            file_path.unlink()
        raise

    if old_image_url and old_image_url != image_url:
        delete_uploaded_image(old_image_url)

    return {
        "message": "交流会画像をアップロードしました",
        "image_url": image_url,
    }


# =========================================================
# 交流会画像をリセット（場所の画像に戻す）
# =========================================================

@router.delete("/events/{event_id}/image")
def delete_event_image(
    event_id: int,
    user_id: int = Depends(get_current_user_id),
):
    event = check_event_permission(event_id, user_id)
    old_image_url = event.image_url

    with engine.connect() as connection:
        connection.execute(
            text("""
                UPDATE events
                SET image_url = NULL
                WHERE id = :event_id
            """),
            {"event_id": event_id},
        )
        connection.commit()

    delete_uploaded_image(old_image_url)

    return {
        "message": "開催場所に対応する画像に戻しました",
        "image_url": None,
    }


# =========================================================
# 交流会に参加
# =========================================================

@router.post("/events/{event_id}/join")
def join_event(
    event_id: int,
    user_id: int = Depends(get_current_user_id),
):
    with engine.connect() as connection:
        transaction = connection.begin()

        try:
            # 交流会をロックして定員超過を防ぐ
            event_result = connection.execute(
                text("""
                    SELECT id, capacity
                    FROM events
                    WHERE id = :event_id
                    FOR UPDATE
                """),
                {"event_id": event_id},
            )

            event = event_result.fetchone()

            if event is None:
                raise HTTPException(
                    status_code=404,
                    detail="交流会が見つかりません",
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
                    "user_id": user_id,
                },
            )

            if joined_result.fetchone() is not None:
                raise HTTPException(
                    status_code=400,
                    detail="すでにこの交流会に参加しています",
                )

            count_result = connection.execute(
                text("""
                    SELECT COUNT(*) AS participant_count
                    FROM event_participants
                    WHERE event_id = :event_id
                """),
                {"event_id": event_id},
            )

            participant_count = int(
                count_result.fetchone().participant_count
            )

            if participant_count >= event.capacity:
                raise HTTPException(
                    status_code=400,
                    detail="この交流会は満員です",
                )

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
                    "user_id": user_id,
                },
            )

            transaction.commit()

            return {
                "message": "交流会に参加しました",
            }

        except Exception:
            if transaction.is_active:
                transaction.rollback()
            raise


# =========================================================
# 交流会から退出（参加キャンセル）
# =========================================================

@router.delete("/events/{event_id}/join")
def leave_event(
    event_id: int,
    user_id: int = Depends(get_current_user_id),
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
                "user_id": user_id,
            },
        )

        connection.commit()

        if result.rowcount == 0:
            raise HTTPException(
                status_code=400,
                detail="この交流会には参加していません",
            )

    return {
        "message": "交流会への参加をキャンセルしました",
    }



# =========================================================
# 交流会の参加者一覧（管理者のみ）
# =========================================================

@router.get("/events/{event_id}/participants")
def get_event_participants(
    event_id: int,
    user_id: int = Depends(get_current_user_id),
):
    with engine.connect() as connection:

        # 交流会が存在するか確認
        event_result = connection.execute(
            text("""
                SELECT id
                FROM events
                WHERE id = :event_id
            """),
            {"event_id": event_id},
        )

        event = event_result.fetchone()

        if event is None:
            raise HTTPException(
                status_code=404,
                detail="交流会が見つかりません",
            )

        # ログインユーザーの権限を確認
        user_result = connection.execute(
            text("""
                SELECT role
                FROM users
                WHERE id = :user_id
            """),
            {"user_id": user_id},
        )

        user = user_result.fetchone()

        if user is None:
            raise HTTPException(
                status_code=404,
                detail="ユーザーが見つかりません",
            )

        # 管理者以外は参加者一覧を取得できない
        if user.role != "admin":
            raise HTTPException(
                status_code=403,
                detail="参加者一覧を閲覧する権限がありません",
            )

        # 参加者のIDとニックネームを取得
        result = connection.execute(
            text("""
                SELECT
                    ep.user_id,
                    u.nickname
                FROM event_participants ep
                JOIN users u
                    ON u.id = ep.user_id
                WHERE ep.event_id = :event_id
                ORDER BY ep.id ASC
            """),
            {"event_id": event_id},
        )

        participants = [
            {
                "user_id": int(row.user_id),
                "nickname": row.nickname,
            }
            for row in result
        ]

        return {
            "event_id": event_id,
            "participants": participants,
            "participant_count": len(participants),
        }

