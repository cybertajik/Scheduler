import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import Integer, String, Boolean, Text, ForeignKey, DateTime, Enum as SQLEnum, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin
from app.models.enums import ScheduleStatus, AssignmentSource

class Schedule(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "schedules"
    __table_args__ = (
        UniqueConstraint("year", "month", name="uq_schedule_year_month"),
    )

    month: Mapped[int] = mapped_column(Integer, nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[ScheduleStatus] = mapped_column(
        SQLEnum(ScheduleStatus, name="schedulestatus_enum"),
        default=ScheduleStatus.DRAFT,
        index=True,
        nullable=False
    )
    generated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    generated_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    solver_score: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Relationships
    generated_by_user = relationship("User", back_populates="schedules_generated")
    shift_instances = relationship("ShiftInstance", back_populates="schedule", cascade="all, delete-orphan")

class Assignment(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "assignments"
    __table_args__ = (
        UniqueConstraint("shift_instance_id", "worker_id", name="uq_shift_worker_assignment"),
    )

    shift_instance_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("shift_instances.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )
    worker_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workers.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )
    assigned_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    assignment_source: Mapped[AssignmentSource] = mapped_column(
        SQLEnum(AssignmentSource, name="assignmentsource_enum"),
        default=AssignmentSource.SOLVER,
        nullable=False
    )
    locked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    shift_instance = relationship("ShiftInstance", back_populates="assignments")
    worker = relationship("Worker", back_populates="assignments")
    assigned_by_user = relationship("User", back_populates="assignments_made")
