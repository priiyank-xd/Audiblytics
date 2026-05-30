import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.user import User

DEFAULT_THEME = "adventure"
DEFAULT_PERSONA = "storyteller"
DEFAULT_LENGTH = 150
DEFAULT_RETENTION = "90-day-rolling"
DEFAULT_ACTIVE_PROVIDER = "gemini"


class UserSettings(Base):
    __tablename__ = "user_settings"

    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    theme: Mapped[str] = mapped_column(String(64), nullable=False, default=DEFAULT_THEME)
    persona: Mapped[str] = mapped_column(String(64), nullable=False, default=DEFAULT_PERSONA)
    length: Mapped[int] = mapped_column(Integer, nullable=False, default=DEFAULT_LENGTH)
    retention: Mapped[str] = mapped_column(String(32), nullable=False, default=DEFAULT_RETENTION)
    voice_uri: Mapped[str | None] = mapped_column(String(512), nullable=True)
    active_provider: Mapped[str] = mapped_column(String(32), nullable=False, default=DEFAULT_ACTIVE_PROVIDER)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="settings")
