import uuid

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base


class ContactMerge(Base):
    __tablename__ = "contact_merges"

    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    canonical_contact_id: Mapped[str] = mapped_column(
        String,
        ForeignKey("contacts.id"),
        nullable=False,
        index=True,
    )

    duplicate_contact_id: Mapped[str] = mapped_column(
        String,
        ForeignKey("contacts.id"),
        nullable=False,
        index=True,
    )

    reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    duplicate_snapshot: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    copied_fields: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="[]",
    )

    transferred_relationships: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    transferred_leads: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    transferred_opportunities: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    created_at = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
