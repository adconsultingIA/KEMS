import uuid

from sqlalchemy import Boolean, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base


class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    name: Mapped[str] = mapped_column(
        String,
        nullable=False,
        index=True,
    )

    legal_name: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    organization_type: Mapped[str] = mapped_column(
        String,
        nullable=False,
        default="company",
        index=True,
    )

    industry: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
        index=True,
    )

    website: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    domain: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
        index=True,
    )

    email: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
        index=True,
    )

    phone: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    country: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
        index=True,
    )

    city: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
        index=True,
    )

    address: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    source_type: Mapped[str] = mapped_column(
        String,
        nullable=False,
        default="manual",
        index=True,
    )

    source_reference: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    verification_status: Mapped[str] = mapped_column(
        String,
        nullable=False,
        default="unverified",
        index=True,
    )

    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        index=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    collected_at = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    last_verified_at = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    updated_at = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
