import uuid

from sqlalchemy import Boolean, DateTime, ForeignKey, String
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

    created_at = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    updated_at = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
    