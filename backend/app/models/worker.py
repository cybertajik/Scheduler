import uuid
from datetime import date, datetime, timezone
from typing import Optional, List
from sqlalchemy import String, Boolean, Date, Float, Text, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin
from app.models.enums import ContractType

class WorkerSkill(Base):
    __tablename__ = "worker_skills"

    worker_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workers.id", ondelete="CASCADE"),
        primary_key=True
    )
    skill_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("skills.id", ondelete="CASCADE"),
        primary_key=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

class Skill(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "skills"

    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    workers: Mapped[List["Worker"]] = relationship(
        "Worker",
        secondary="worker_skills",
        back_populates="skills"
    )

class Worker(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "workers"

    organization_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        index=True,
        nullable=True
    )
    employee_number: Mapped[Optional[str]] = mapped_column(String(50), index=True, nullable=True)
    department_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("departments.id", ondelete="RESTRICT"),
        index=True,
        nullable=False
    )
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        unique=True,
        nullable=True
    )
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    hire_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    weekly_contract_hours: Mapped[float] = mapped_column(Float, default=40.0, nullable=False)
    contract_type: Mapped[ContractType] = mapped_column(
        SQLEnum(ContractType, name="contracttype_enum"),
        default=ContractType.HOURLY,
        nullable=False
    )
    hourly_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    monthly_salary: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    organization = relationship("Organization", back_populates="workers")
    department = relationship("Department", back_populates="workers")
    user = relationship("User", back_populates="worker")
    skills: Mapped[List[Skill]] = relationship(
        "Skill",
        secondary="worker_skills",
        back_populates="workers"
    )
    constraints = relationship("WorkerConstraint", back_populates="worker", cascade="all, delete-orphan")
    assignments = relationship("Assignment", back_populates="worker", cascade="all, delete-orphan")
