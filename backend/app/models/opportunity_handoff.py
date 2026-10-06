import uuid

from sqlalchemy import (
    DateTime,
    ForeignKey,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)
from sqlalchemy.sql import func

from app.core.database import Base


class OpportunityHandoff(Base):
    __tablename__ = "opportunity_handoffs"

    __table_args__ = (
        UniqueConstraint(
            "opportunity_id",
            name="uq_opportunity_handoff_opportunity",
        ),
    )

    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    opportunity_id: Mapped[str] = mapped_column(
        String,
        ForeignKey("opportunities.id"),
        nullable=False,
        index=True,
    )

    target_unit_id: Mapped[str] = mapped_column(
        String,
        ForeignKey("organizational_units.id"),
        nullable=False,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String,
        nullable=False,
        default="handed_off",
        index=True,
    )

    handed_off_at = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    handed_off_by_profile_id: Mapped[
        str | None
    ] = mapped_column(
        String,
        ForeignKey("profiles.id"),
        nullable=True,
        index=True,
    )

    accepted_at = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    accepted_by_profile_id: Mapped[
        str | None
    ] = mapped_column(
        String,
        ForeignKey("profiles.id"),
        nullable=True,
        index=True,
    )

    started_at = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    completed_at = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    notes: Mapped[
        str | None
    ] = mapped_column(
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
