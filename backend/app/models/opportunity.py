import uuid

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base


class Opportunity(Base):
    __tablename__ = "opportunities"

    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    lead_id: Mapped[str] = mapped_column(
        String,
        ForeignKey("leads.id"),
        nullable=False,
        unique=True,
        index=True,
    )

    organization_id: Mapped[str | None] = mapped_column(
        String,
        ForeignKey("organizations.id"),
        nullable=True,
        index=True,
    )

    primary_contact_id: Mapped[str | None] = mapped_column(
        String,
        ForeignKey("contacts.id"),
        nullable=True,
    )

    owner_id: Mapped[str | None] = mapped_column(
        String,
        ForeignKey("profiles.id"),
        nullable=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    stage: Mapped[str] = mapped_column(
        String,
        nullable=False,
        default="qualified",
        index=True,
    )

    estimated_value: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    currency: Mapped[str] = mapped_column(
        String(3),
        nullable=False,
        default="CHF",
    )

    probability: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    expected_close_date = mapped_column(
        Date,
        nullable=True,
    )

    won_at = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    lost_at = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    lost_reason: Mapped[str | None] = mapped_column(
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