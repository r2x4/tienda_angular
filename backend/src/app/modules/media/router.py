"""Admin media router."""

from fastapi import APIRouter, Depends, File, UploadFile, status

from app.core.config import settings
from app.core.dependencies import require_roles
from app.modules.auth.models import User
from app.modules.media.schemas import MediaImageUploadResponse
from app.modules.media.service import upload_image

router = APIRouter(prefix="/admin/media", tags=["admin-media"])


@router.post("/images", response_model=MediaImageUploadResponse, status_code=status.HTTP_201_CREATED)
async def admin_upload_image(
    file: UploadFile = File(...),
    _: User = Depends(require_roles("ADMIN")),
) -> MediaImageUploadResponse:
    # service handles validation and secure storage
    return upload_image(file=file, settings=settings)
