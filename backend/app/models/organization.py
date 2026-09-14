import uuid

from sqlalchemy import DateTime, String, Text
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
    )

    industry: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    website: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    email: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    phone: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    country: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    city: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    address: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
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