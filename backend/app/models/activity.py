import uuid

from sqlalchemy import (
    DateTime,
    ForeignKey,
    String,
    Text,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)
from sqlalchemy.sql import func

from app.core.database import Base


class Activity(Base):
    __tablename__ = "activities"

    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(
            uuid.uuid4()
        ),
    )

    event_type: Mapped[str] = mapped_column(
        String,
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    description: Mapped[
        str | None
    ] = mapped_column(
        Text,
        nullable=True,
    )

    context: Mapped[str] = mapped_column(
        String,
        nullable=False,
        default="core",
        index=True,
    )

    actor_type: Mapped[str] = mapped_column(
        String,
        nullable=False,
        default="system",
        index=True,
    )

    actor_profile_id: Mapped[
        str | None
    ] = mapped_column(
        String,
        ForeignKey(
            "profiles.id"
        ),
        nullable=True,
        index=True,
    )

    actor_contact_id: Mapped[
        str | None
    ] = mapped_column(
        String,
        ForeignKey(
            "contacts.id"
        ),
        nullable=True,
        index=True,
    )

    contact_id: Mapped[
        str | None
    ] = mapped_column(
        String,
        ForeignKey(
            "contacts.id"
        ),
        nullable=True,
        index=True,
    )

    organization_id: Mapped[
        str | None
    ] = mapped_column(
        String,
        ForeignKey(
            "organizations.id"
        ),
        nullable=True,
        index=True,
    )

    action_id: Mapped[
        str | None
    ] = mapped_column(
        String,
        ForeignKey(
            "actions.id"
        ),
        nullable=True,
        index=True,
    )

    source_type: Mapped[str] = mapped_column(
        String,
        nullable=False,
        default="core",
        index=True,
    )

    source_entity_type: Mapped[
        str | None
    ] = mapped_column(
        String,
        nullable=True,
        index=True,
    )

    source_entity_id: Mapped[
        str | None
    ] = mapped_column(
        String,
        nullable=True,
        index=True,
    )

    created_at = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )
