import uuid
from datetime import date
from typing import Optional, Any
from sqlalchemy import Date, Integer, Boolean, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin
from app.models.enums import ConstraintType

class WorkerConstraint(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "worker_constraints"

    worker_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workers.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )
    constraint_type: Mapped[ConstraintType] = mapped_column(
        SQLEnum(ConstraintType, name="constrainttype_enum"),
        index=True,
        nullable=False
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    priority: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    metadata_json: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)

    # Relationships
    worker = relationship("Worker", back_populates="constraints")
