import uuid

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base


class IngestionRecord(Base):
    __tablename__ = "ingestion_records"

    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    entity_type: Mapped[str] = mapped_column(
        String,
        nullable=False,
        index=True,
    )

    source_type: Mapped[str] = mapped_column(
        String,
        nullable=False,
        index=True,
    )

    source_reference: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String,
        nullable=False,
        index=True,
    )

    entity_id: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
        index=True,
    )

    candidate_entity_id: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
        index=True,
    )

    match_score: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    match_reason: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    raw_payload: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    normalized_payload: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    error_message: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
