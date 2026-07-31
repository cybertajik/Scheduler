import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy import Integer, String, Boolean, Text, ForeignKey, DateTime, JSON, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin

class ScheduleRepair(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "schedule_repairs"

    schedule_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("schedules.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )
    author_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    plan_name: Mapped[str] = mapped_column(String(150), nullable=False)
    disruption_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    conflicts_resolved_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    assignments_changed_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="PROPOSED", index=True, nullable=False) # PROPOSED, APPLIED, REJECTED, REVERTED
    explainability_report: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    snapshot_before: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    snapshot_after: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    applied_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    reverted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    schedule = relationship("Schedule", foreign_keys=[schedule_id])
    author = relationship("User", foreign_keys=[author_id])
