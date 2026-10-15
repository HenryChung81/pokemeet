from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import text

from app.database import engine
from app.routers.auth import get_current_user_id


# プロフィール画像アップロード用のRouter
router = APIRouter()


# プロフィール画像の保存先
UPLOAD_DIR = Path("uploads/avatars")

# アップロードできる画像の最大サイズ（5MB）
MAX_IMAGE_SIZE = 5 * 1024 * 1024


# 画像データの先頭部分を確認し、形式を判定する
#
# ファイル名やContent-Typeだけでは、画像形式を
# 正しく判定できないため、実際のデータを確認する。
#
# SVGなどの形式は許可せず、JPEG・PNG・WebPだけを受け付ける。
def _detect_image_extension(contents: bytes) -> str | None:

    # JPEGのファイルシグネチャを確認する
    if contents.startswith(b"\xff\xd8\xff"):
        return "jpg"

    # PNGのファイルシグネチャを確認する
    if contents.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"

    # WebPのファイルシグネチャを確認する
    if (
        len(contents) >= 12
        and contents[0:4] == b"RIFF"
        and contents[8:12] == b"WEBP"
    ):
        return "webp"

    # 対応していない形式
    return None


# 自分のプロフィール画像をアップロードするAPI
@router.post("/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    user_id: int = Depends(get_current_user_id),
):

    # 画像を最大サイズ＋1バイトまで読み込む
    #
    # 1バイト余分に読むことで、上限を超えたかどうかを
    # 判定できる。
    contents = await file.read(MAX_IMAGE_SIZE + 1)

    # 空ファイルを拒否する
    if not contents:
        raise HTTPException(
            status_code=400,
            detail="画像ファイルが空です",
        )

    # 5MBを超える画像を拒否する
    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="画像サイズは5MB以下にしてください",
        )

    # 実際の画像データから形式を判定する
    extension = _detect_image_extension(contents)

    if extension is None:
        raise HTTPException(
            status_code=400,
            detail="JPEG・PNG・WebP形式の画像を選択してください",
        )

    # 元のファイル名を使わず、ランダムなファイル名を生成する
    #
    # 同名ファイルによる上書きや、ファイル名を利用した
    # 不正なパス指定を避ける。
    filename = f"{uuid4().hex}.{extension}"

    # 保存先のパスを組み立てる
    image_path = UPLOAD_DIR / filename

    # ブラウザからアクセスするためのURL
    avatar_url = f"/uploads/avatars/{filename}"

    try:

        # 保存先フォルダが存在しない場合は作成する
        UPLOAD_DIR.mkdir(
            parents=True,
            exist_ok=True,
        )

        # 画像ファイルを保存する
        image_path.write_bytes(contents)

        # DBの更新が成功した場合だけ処理を確定する
        with engine.begin() as connection:

            # プロフィール画像の保存先を更新する
            #
            # avatar_typeをuploadにすることで、
            # プリセット画像ではなくアップロード画像を
            # 使用していることを示す。
            result = connection.execute(
                text("""
                    UPDATE users
                    SET
                        avatar_type = 'upload',
                        avatar_value = :avatar_value
                    WHERE id = :user_id
                """),
                {
                    "avatar_value": avatar_url,
                    "user_id": user_id,
                },
            )

            # 対象ユーザーが存在しない場合
            if result.rowcount == 0:
                raise HTTPException(
                    status_code=404,
                    detail="ユーザーが見つかりません",
                )

    except HTTPException:

        # DB更新に失敗した場合は、保存した画像を削除する
        image_path.unlink(missing_ok=True)
        raise

    except Exception as error:

        # 保存やDB更新に失敗した場合は、
        # 中途半端に保存された画像を削除する
        image_path.unlink(missing_ok=True)

        raise HTTPException(
            status_code=500,
            detail="プロフィール画像の保存に失敗しました",
        ) from error

    # 成功した場合は保存先URLを返す
    return {
        "message": "プロフィール画像をアップロードしました",
        "avatar_type": "upload",
        "avatar_url": avatar_url,
    }