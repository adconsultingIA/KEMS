import uuid

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base


class ContactOrganization(Base):
    __tablename__ = "contact_organizations"

    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    contact_id: Mapped[str] = mapped_column(
        String,
        ForeignKey("contacts.id"),
        nullable=False,
        index=True,
    )

    organization_id: Mapped[str] = mapped_column(
        String,
        ForeignKey("organizations.id"),
        nullable=False,
        index=True,
    )

    relationship_type: Mapped[str] = mapped_column(
        String,
        nullable=False,
        default="employee",
        index=True,
    )

    job_title: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    relationship_role: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    is_primary: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        index=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        index=True,
    )

    started_at = mapped_column(
        Date,
        nullable=True,
    )

    ended_at = mapped_column(
        Date,
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
