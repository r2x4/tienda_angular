"""Media service: validation, storage, and response building."""

from __future__ import annotations

from io import BytesIO

from fastapi import HTTPException, UploadFile, status
from PIL import Image, UnidentifiedImageError

from app.core.config import Settings
from app.modules.media.schemas import MediaImageUploadResponse
from app.modules.media.storage import LocalMediaStorage

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}


def _read_limited(upload: UploadFile, max_bytes: int) -> bytes:
    data = bytearray()
    while True:
        chunk = upload.file.read(1024 * 1024)
        if not chunk:
            break
        data.extend(chunk)
        if len(data) > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds maximum size of {max_bytes // (1024 * 1024)} MB",
            )
    if not data:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Empty file")
    return bytes(data)


def _validate_and_normalize_image(content: bytes, declared_content_type: str | None) -> tuple[bytes, str, str]:
    declared = (declared_content_type or "").lower().split(";")[0].strip()
    if declared and declared not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Unsupported image type")

    try:
        with Image.open(BytesIO(content)) as img:
            img.verify()
    except (UnidentifiedImageError, OSError):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid or malformed image file") from None

    # Re-open for parsing/normalization after verify().
    try:
        with Image.open(BytesIO(content)) as img:
            fmt = (img.format or "").upper()
            if fmt == "JPEG":
                canonical_mime = "image/jpeg"
                ext = "jpg"
                # Normalize JPEG bytes to strip unknown payloads and ensure valid encoding.
                out = BytesIO()
                rgb = img.convert("RGB")
                rgb.save(out, format="JPEG", quality=95, optimize=True)
                normalized = out.getvalue()
            elif fmt == "PNG":
                canonical_mime = "image/png"
                ext = "png"
                out = BytesIO()
                img.save(out, format="PNG")
                normalized = out.getvalue()
            elif fmt == "WEBP":
                canonical_mime = "image/webp"
                ext = "webp"
                out = BytesIO()
                img.save(out, format="WEBP")
                normalized = out.getvalue()
            else:
                raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Unsupported image format")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid image content") from None

    if declared and declared != canonical_mime:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Declared content type does not match image content")

    return normalized, canonical_mime, ext


def upload_image(file: UploadFile, settings: Settings) -> MediaImageUploadResponse:
    if not file:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="File is required")

    content = _read_limited(file, settings.media_max_upload_bytes)
    normalized, content_type, ext = _validate_and_normalize_image(content, file.content_type)

    storage = LocalMediaStorage(settings)
    stored = storage.save_image(normalized, ext)
    return MediaImageUploadResponse(
        url=storage.public_url(stored.filename),
        filename=stored.filename,
        content_type=content_type,
        size_bytes=stored.size_bytes,
    )
