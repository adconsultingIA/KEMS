import uuid

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base


class AuthAccount(Base):
    __tablename__ = "auth_accounts"

    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    account_type: Mapped[str] = mapped_column(
        String,
        nullable=False,
        index=True,
    )

    profile_id: Mapped[str | None] = mapped_column(
        String,
        ForeignKey("profiles.id"),
        unique=True,
        nullable=True,
        index=True,
    )

    contact_id: Mapped[str | None] = mapped_column(
        String,
        ForeignKey("contacts.id"),
        unique=True,
        nullable=True,
        index=True,
    )

    email: Mapped[str] = mapped_column(
        String,
        unique=True,
        nullable=False,
        index=True,
    )

    password_hash: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        index=True,
    )

    last_login_at = mapped_column(
        DateTime,
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
