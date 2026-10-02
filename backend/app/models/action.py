import uuid

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base


class Action(Base):
    __tablename__ = "actions"

    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    title: Mapped[str] = mapped_column(
        String,
        nullable=False,
        index=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String,
        nullable=False,
        default="todo",
        index=True,
    )

    priority: Mapped[str] = mapped_column(
        String,
        nullable=False,
        default="medium",
        index=True,
    )

    context: Mapped[str] = mapped_column(
        String,
        nullable=False,
        default="core",
        index=True,
    )

    owner_profile_id: Mapped[str | None] = mapped_column(
        String,
        ForeignKey("profiles.id"),
        nullable=True,
        index=True,
    )

    unit_id: Mapped[str | None] = mapped_column(
        String,
        ForeignKey("organizational_units.id"),
        nullable=True,
        index=True,
    )

    contact_id: Mapped[str | None] = mapped_column(
        String,
        ForeignKey("contacts.id"),
        nullable=True,
        index=True,
    )

    organization_id: Mapped[str | None] = mapped_column(
        String,
        ForeignKey("organizations.id"),
        nullable=True,
        index=True,
    )

    source_type: Mapped[str] = mapped_column(
        String,
        nullable=False,
        default="manual",
        index=True,
    )

    source_entity_type: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
        index=True,
    )

    source_entity_id: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
        index=True,
    )

    created_by_profile_id: Mapped[str | None] = mapped_column(
        String,
        ForeignKey("profiles.id"),
        nullable=True,
        index=True,
    )

    due_at = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )

    completed_at = mapped_column(
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
