import uuid

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base


class UserMembership(Base):
    __tablename__ = "user_memberships"

    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    user_id: Mapped[str] = mapped_column(
        String,
        ForeignKey("profiles.id"),
        nullable=False,
        index=True,
    )

    unit_id: Mapped[str] = mapped_column(
        String,
        ForeignKey("organizational_units.id"),
        nullable=False,
        index=True,
    )

    team_id: Mapped[str | None] = mapped_column(
        String,
        ForeignKey("teams.id"),
        nullable=True,
        index=True,
    )

    role_id: Mapped[str] = mapped_column(
        String,
        ForeignKey("roles.id"),
        nullable=False,
        index=True,
    )

    is_primary: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    created_at = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
