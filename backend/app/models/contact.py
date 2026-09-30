import uuid

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base


class Contact(Base):
    __tablename__ = "contacts"

    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    organization_id: Mapped[str | None] = mapped_column(
        String,
        ForeignKey("organizations.id"),
        nullable=True,
        index=True,
    )

    first_name: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    last_name: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    normalized_name: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
        index=True,
    )

    job_title: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    email: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
        index=True,
    )

    phone: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
        index=True,
    )

    linkedin_url: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    decision_role: Mapped[str] = mapped_column(
        String,
        nullable=False,
        default="unknown",
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

    is_primary: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
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
