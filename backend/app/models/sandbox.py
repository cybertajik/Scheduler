import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import Integer, String, Boolean, Text, ForeignKey, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin
from app.models.enums import AssignmentSource

class SandboxSchedule(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "sandbox_schedules"

    parent_schedule_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("schedules.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="DRAFT", index=True, nullable=False) # DRAFT, SIMULATED, APPROVED, REJECTED, PROMOTED, ARCHIVED
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    author_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    month: Mapped[int] = mapped_column(Integer, nullable=False)
    scenario_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True) # SICK_CALL, VACATION_REQUEST, STAFF_SHORTAGE, EXTRA_STAFF, RULE_MODIFICATION, CUSTOM
    scenario_params: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Relationships
    parent_schedule = relationship("Schedule", foreign_keys=[parent_schedule_id])
    author = relationship("User", foreign_keys=[author_id])
    shift_instances = relationship("SandboxShiftInstance", back_populates="sandbox_schedule", cascade="all, delete-orphan")
    versions = relationship("SandboxVersion", back_populates="sandbox_schedule", cascade="all, delete-orphan")

class SandboxShiftInstance(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "sandbox_shift_instances"

    sandbox_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sandbox_schedules.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )
    date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    shift_type_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("shift_types.id", ondelete="CASCADE"),
        nullable=False
    )
    required_workers: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    # Relationships
    sandbox_schedule = relationship("SandboxSchedule", back_populates="shift_instances")
    shift_type = relationship("ShiftType")
    assignments = relationship("SandboxAssignment", back_populates="shift_instance", cascade="all, delete-orphan")

class SandboxAssignment(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "sandbox_assignments"

    sandbox_shift_instance_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sandbox_shift_instances.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )
    worker_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workers.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )
    assignment_source: Mapped[str] = mapped_column(String(50), default="SOLVER", nullable=False)
    locked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    shift_instance = relationship("SandboxShiftInstance", back_populates="assignments")
    worker = relationship("Worker")

class SandboxVersion(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "sandbox_versions"

    sandbox_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sandbox_schedules.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    change_description: Mapped[str] = mapped_column(Text, nullable=False)
    author_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    snapshot_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Relationships
    sandbox_schedule = relationship("SandboxSchedule", back_populates="versions")
    author = relationship("User")
