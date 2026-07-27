import uuid
from typing import Optional, List
from sqlalchemy import String, Boolean, Text
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

    # Relationships
    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    departments = relationship("Department", back_populates="organization", cascade="all, delete-orphan")
    workers = relationship("Worker", back_populates="organization", cascade="all, delete-orphan")
