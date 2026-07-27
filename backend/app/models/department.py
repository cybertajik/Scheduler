import uuid
from typing import Optional
from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin

class Department(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "departments"

    organization_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        index=True,
        nullable=True
    )
    name: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    organization = relationship("Organization", back_populates="departments")
    workers = relationship("Worker", back_populates="department")
