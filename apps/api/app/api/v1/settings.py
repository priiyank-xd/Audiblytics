from fastapi import APIRouter

from app.core.deps import CurrentUser, DbSession
from app.models.user_settings import UserSettings
from app.schemas.settings import SettingsPatch, SettingsResponse

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("", response_model=SettingsResponse)
async def get_settings(user: CurrentUser) -> SettingsResponse:
    assert user.settings is not None
    return SettingsResponse.from_row(user.settings)


@router.patch("", response_model=SettingsResponse)
async def patch_settings(body: SettingsPatch, user: CurrentUser, db: DbSession) -> SettingsResponse:
    row = user.settings
    assert row is not None
    if body.theme is not None:
        row.theme = body.theme
    if body.persona is not None:
        row.persona = body.persona
    if body.length is not None:
        row.length = body.length
    if body.retention is not None:
        row.retention = body.retention
    if body.voiceURI is not None:
        row.voice_uri = body.voiceURI
    if body.activeProvider is not None:
        row.active_provider = body.activeProvider
    await db.commit()
    await db.refresh(row)
    return SettingsResponse.from_row(row)
