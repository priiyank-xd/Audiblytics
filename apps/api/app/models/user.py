import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.collection_word import CollectionWord
    from app.models.day_completion import DayCompletion
    from app.models.paragraph_cache import ParagraphCache
    from app.models.recording import Recording
    from app.models.user_settings import UserSettings


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    settings: Mapped["UserSettings"] = relationship(back_populates="user", uselist=False)
    paragraph_cache: Mapped[list["ParagraphCache"]] = relationship(back_populates="user")
    recordings: Mapped[list["Recording"]] = relationship(back_populates="user")
    collection_words: Mapped[list["CollectionWord"]] = relationship(back_populates="user")
    day_completions: Mapped[list["DayCompletion"]] = relationship(back_populates="user")
