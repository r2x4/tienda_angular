"""Storage abstraction and local filesystem implementation for media files."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Protocol
from uuid import uuid4

from fastapi import HTTPException, status

from app.core.config import Settings


class MediaStorage(Protocol):
    def save_image(self, content: bytes, extension: str) -> "StoredMediaFile": ...
    def public_url(self, filename: str) -> str: ...


@dataclass(frozen=True)
class StoredMediaFile:
    filename: str
    relative_path: str
    size_bytes: int


class LocalMediaStorage:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.root = settings.media_root_path
        self.images_dir = self.root / "images"

    def ensure_directories(self) -> None:
        self.images_dir.mkdir(parents=True, exist_ok=True)

    def save_image(self, content: bytes, extension: str) -> StoredMediaFile:
        self.ensure_directories()
        ext = extension.lower().lstrip(".")
        if ext not in {"jpg", "png", "webp"}:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Unsupported image extension")

        # UUID name, never trust client filename; create file exclusively to avoid overwrite.
        for _ in range(5):
            filename = f"{uuid4().hex}.{ext}"
            target = (self.images_dir / filename).resolve()
            if self.images_dir.resolve() not in target.parents:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid storage path")
            if target.exists():
                continue
            with target.open("xb") as fh:
                fh.write(content)
            return StoredMediaFile(filename=filename, relative_path=f"images/{filename}", size_bytes=len(content))

        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not allocate file name")

    def public_url(self, filename: str) -> str:
        safe = Path(filename).name
        return f"{self.settings.media_url_prefix}/images/{safe}"
