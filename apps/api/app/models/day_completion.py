import uuid
from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Date, ForeignKey, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class DayCompletion(Base):
    __tablename__ = "day_completions"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    utc_date: Mapped[date] = mapped_column(Date, primary_key=True)
    has_read_it: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    has_recording: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    used_offline_pack: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    user: Mapped["User"] = relationship(back_populates="day_completions")
