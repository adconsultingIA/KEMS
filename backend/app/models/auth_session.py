import uuid

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base


class AuthSession(Base):
    __tablename__ = "auth_sessions"

    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    account_id: Mapped[str] = mapped_column(
        String,
        ForeignKey("auth_accounts.id"),
        nullable=False,
        index=True,
    )

    token_hash: Mapped[str] = mapped_column(
        String,
        unique=True,
        nullable=False,
        index=True,
    )

    expires_at = mapped_column(
        DateTime,
        nullable=False,
        index=True,
    )

    created_at = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
