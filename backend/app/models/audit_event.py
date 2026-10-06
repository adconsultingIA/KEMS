import uuid

from sqlalchemy import (
    JSON,
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


class AuditEvent(Base):
    """
    Immutable audit record.

    AuditEvent is intentionally separate from Activity:
    Activity supports operational timelines.
    AuditEvent supports governance, traceability and evidence.
    """

    __tablename__ = "audit_events"

    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(
            uuid.uuid4()
        ),
    )

    # --------------------------------------------------------
    # Actor identity at execution time
    # --------------------------------------------------------

    actor_type: Mapped[str] = mapped_column(
        String,
        nullable=False,
        index=True,
    )

    actor_account_id: Mapped[
        str | None
    ] = mapped_column(
        String,
        nullable=True,
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

    actor_role_id: Mapped[
        str | None
    ] = mapped_column(
        String,
        ForeignKey(
            "roles.id"
        ),
        nullable=True,
        index=True,
    )

    actor_unit_id: Mapped[
        str | None
    ] = mapped_column(
        String,
        ForeignKey(
            "organizational_units.id"
        ),
        nullable=True,
        index=True,
    )

    # Human-readable snapshots.
    # They preserve historical meaning even if names change later.

    actor_name: Mapped[
        str | None
    ] = mapped_column(
        String,
        nullable=True,
    )

    actor_role_name: Mapped[
        str | None
    ] = mapped_column(
        String,
        nullable=True,
    )

    actor_unit_name: Mapped[
        str | None
    ] = mapped_column(
        String,
        nullable=True,
    )

    # --------------------------------------------------------
    # Effective execution context
    # --------------------------------------------------------

    effective_context: Mapped[
        str
    ] = mapped_column(
        String,
        nullable=False,
        index=True,
    )

    # --------------------------------------------------------
    # Operation
    # Examples:
    # action.create
    # action.update
    # contact.update
    # organization.merge
    # --------------------------------------------------------

    action_type: Mapped[str] = mapped_column(
        String,
        nullable=False,
        index=True,
    )

    description: Mapped[
        str | None
    ] = mapped_column(
        Text,
        nullable=True,
    )

    # --------------------------------------------------------
    # Primary target entity
    # --------------------------------------------------------

    entity_type: Mapped[str] = mapped_column(
        String,
        nullable=False,
        index=True,
    )

    entity_id: Mapped[
        str | None
    ] = mapped_column(
        String,
        nullable=True,
        index=True,
    )

    # --------------------------------------------------------
    # Business subject
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # Origin
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # Change evidence
    # --------------------------------------------------------

    before_data: Mapped[
        dict | None
    ] = mapped_column(
        JSON,
        nullable=True,
    )

    after_data: Mapped[
        dict | None
    ] = mapped_column(
        JSON,
        nullable=True,
    )

    # --------------------------------------------------------
    # Request / session evidence
    # Optional for now; ready for later middleware.
    # --------------------------------------------------------

    request_id: Mapped[
        str | None
    ] = mapped_column(
        String,
        nullable=True,
        index=True,
    )

    ip_address: Mapped[
        str | None
    ] = mapped_column(
        String,
        nullable=True,
    )

    user_agent: Mapped[
        str | None
    ] = mapped_column(
        Text,
        nullable=True,
    )

    created_at = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )
