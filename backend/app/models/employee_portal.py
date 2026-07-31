import uuid
from datetime import datetime, date, timezone
from typing import Optional
from sqlalchemy import Integer, String, Boolean, Text, ForeignKey, DateTime, Date, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin

class VacationRequest(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "vacation_requests"

    worker_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workers.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="PENDING", index=True, nullable=False) # PENDING, APPROVED, REJECTED, CANCELLED
    admin_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    approved_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )

    # Relationships
    worker = relationship("Worker")
    approved_by = relationship("User")

class ShiftSwapRequest(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "shift_swap_requests"

    requestor_worker_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workers.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )
    target_worker_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workers.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )
    requestor_assignment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("assignments.id", ondelete="CASCADE"),
        nullable=False
    )
    target_assignment_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("assignments.id", ondelete="CASCADE"),
        nullable=True
    )
    status: Mapped[str] = mapped_column(String(50), default="PROPOSED", index=True, nullable=False) # PROPOSED, ACCEPTED, DECLINED, APPROVED, REJECTED, CANCELLED
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    requestor_worker = relationship("Worker", foreign_keys=[requestor_worker_id])
    target_worker = relationship("Worker", foreign_keys=[target_worker_id])
    requestor_assignment = relationship("Assignment", foreign_keys=[requestor_assignment_id])
    target_assignment = relationship("Assignment", foreign_keys=[target_assignment_id])

class AvailabilitySubmission(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "availability_submissions"

    worker_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workers.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    availability_type: Mapped[str] = mapped_column(String(50), default="UNAVAILABLE", nullable=False) # UNAVAILABLE, PREFERRED_OFF, PREFERRED_SHIFT
    shift_type_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("shift_types.id", ondelete="CASCADE"),
        nullable=True
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    worker = relationship("Worker")
    shift_type = relationship("ShiftType")

class UserNotification(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "user_notifications"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(50), default="SCHEDULE", nullable=False) # SCHEDULE, VACATION, SWAP, ANNOUNCEMENT
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    user = relationship("User")
