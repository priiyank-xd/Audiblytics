import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import DateTime, ForeignKey, String, Text, Uuid
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.user import User

# SQLite (tests) uses generic JSON; Postgres uses JSONB.
HardWordsColumn = JSON().with_variant(JSONB(), "postgresql")


class ParagraphCache(Base):
    __tablename__ = "paragraph_cache"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    paragraph: Mapped[str] = mapped_column(Text, nullable=False)
    hard_words: Mapped[list[dict[str, Any]]] = mapped_column(HardWordsColumn, nullable=False)
    theme: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    persona: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)

    user: Mapped["User"] = relationship(back_populates="paragraph_cache")
