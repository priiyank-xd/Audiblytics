import uuid
from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Date, ForeignKey, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class DaysOfUse(Base):
    __tablename__ = "days_of_use"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    utc_date: Mapped[date] = mapped_column(Date, primary_key=True)

    user: Mapped["User"] = relationship(back_populates="days_of_use")
