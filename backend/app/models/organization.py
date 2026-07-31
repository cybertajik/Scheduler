import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Boolean, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin

class Organization(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "organizations"

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    domain: Mapped[Optional[str]] = mapped_column(String(255), unique=True, index=True, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    require_employee_id: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    # Country & public holiday settings
    country_code: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)
    extra_country_code: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)
    # SaaS Subscription & Contact details
    billing_cycle: Mapped[str] = mapped_column(String(20), default="MONTHLY", nullable=False)
    subscription_status: Mapped[str] = mapped_column(String(20), default="ACTIVE", nullable=False)
    grace_period_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    contact_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    contact_tel: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    admin_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    departments = relationship("Department", back_populates="organization", cascade="all, delete-orphan")
    workers = relationship("Worker", back_populates="organization", cascade="all, delete-orphan")
