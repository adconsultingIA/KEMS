import uuid

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    # Relations avec le socle KEMS Hub
    organization_id: Mapped[str | None] = mapped_column(
        String,
        ForeignKey("organizations.id"),
        nullable=True,
        index=True,
    )

    contact_id: Mapped[str | None] = mapped_column(
        String,
        ForeignKey("contacts.id"),
        nullable=True,
        index=True,
    )

    owner_id: Mapped[str | None] = mapped_column(
        String,
        ForeignKey("profiles.id"),
        nullable=True,
        index=True,
    )

    # Origine du lead
    source: Mapped[str] = mapped_column(
        String,
        nullable=False,
        default="manual",
    )

    source_detail: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    # Cycle du lead
    status: Mapped[str] = mapped_column(
        String,
        nullable=False,
        default="new",
        index=True,
    )

    # Qualification commerciale
    need_summary: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
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

    urgency: Mapped[str] = mapped_column(
        String,
        nullable=False,
        default="medium",
    )

    # Growth Score
    fit_score: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    intent_score: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    engagement_score: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    potential_score: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    qualification_notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    qualified_at = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    disqualified_reason: Mapped[str | None] = mapped_column(
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

    @hybrid_property
    def growth_score(self) -> int:
        return (
    self.fit_score
    + self.intent_score
    + self.engagement_score
    + self.potential_score
)

    @growth_score.expression
    def growth_score(cls):
        return (
    cls.fit_score
    + cls.intent_score
    + cls.engagement_score
    + cls.potential_score
)