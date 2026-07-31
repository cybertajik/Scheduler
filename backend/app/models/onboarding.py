import uuid
from typing import Optional
from sqlalchemy import String, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin

class OnboardingApplication(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "onboarding_applications"

    org_name: Mapped[str] = mapped_column(String(150), nullable=False)
    contact_name: Mapped[str] = mapped_column(String(100), nullable=False)
    contact_email: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    contact_tel: Mapped[str] = mapped_column(String(50), nullable=False)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    requested_domain: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    estimated_employees: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="PENDING", index=True, nullable=False) # PENDING, APPROVED, REJECTED
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
