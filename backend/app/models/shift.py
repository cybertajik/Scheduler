import uuid
from datetime import time, date
from typing import Optional
from sqlalchemy import String, Boolean, Time, Date, Float, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin

class ShiftType(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "shift_types"

    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    color: Mapped[str] = mapped_column(String(20), default="#3B82F6", nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    duration: Mapped[float] = mapped_column(Float, nullable=False)
    is_night_shift: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    requires_rest_day: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    instances = relationship("ShiftInstance", back_populates="shift_type")

class ShiftInstance(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "shift_instances"

    schedule_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("schedules.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )
    date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    shift_type_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("shift_types.id", ondelete="RESTRICT"),
        index=True,
        nullable=False
    )
    required_workers: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    # Relationships
    schedule = relationship("Schedule", back_populates="shift_instances")
    shift_type = relationship("ShiftType", back_populates="instances")
    assignments = relationship("Assignment", back_populates="shift_instance", cascade="all, delete-orphan")
