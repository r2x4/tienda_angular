"""Schemas for media uploads."""

from pydantic import BaseModel


class MediaImageUploadResponse(BaseModel):
    url: str
    filename: str
    content_type: str
    size_bytes: int
