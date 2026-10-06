from sqlalchemy.orm import Session

from app.models.audit_event import (
    AuditEvent,
)
from app.schemas.auth import (
    AuthContextResponse,
)


def record_audit_event(
    db: Session,
    *,
    auth: AuthContextResponse,
    effective_context: str,
    action_type: str,
    entity_type: str,
    entity_id: str | None = None,
    description: str | None = None,
    contact_id: str | None = None,
    organization_id: str | None = None,
    action_id: str | None = None,
    source_type: str = "core",
    source_entity_type: str | None = None,
    source_entity_id: str | None = None,
    before_data: dict | None = None,
    after_data: dict | None = None,
    request_id: str | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> AuditEvent:
    """
    Record one immutable governance event.

    Important:
    effective_context represents where the operation
    was performed, while auth.role / primary_unit preserve
    the actor's authenticated identity and authority.
    """

    actor_profile_id = (
        auth.profile.id
        if auth.profile
        else None
    )

    actor_contact_id = (
        auth.contact.id
        if auth.contact
        else None
    )

    actor_name = (
        auth.profile.full_name
        if auth.profile
        else (
            (
                f"{auth.contact.first_name} "
                f"{auth.contact.last_name}"
            )
            if auth.contact
            else auth.email
        )
    )

    event = AuditEvent(
        actor_type=(
            auth.account_type
        ),
        actor_account_id=(
            auth.account_id
        ),
        actor_profile_id=(
            actor_profile_id
        ),
        actor_contact_id=(
            actor_contact_id
        ),
        actor_role_id=(
            auth.role.id
            if auth.role
            else None
        ),
        actor_unit_id=(
            auth.primary_unit.id
            if auth.primary_unit
            else None
        ),
        actor_name=(
            actor_name
        ),
        actor_role_name=(
            auth.role.name
            if auth.role
            else None
        ),
        actor_unit_name=(
            auth.primary_unit.name
            if auth.primary_unit
            else None
        ),
        effective_context=(
            effective_context
        ),
        action_type=(
            action_type
        ),
        description=(
            description
        ),
        entity_type=(
            entity_type
        ),
        entity_id=(
            entity_id
        ),
        contact_id=(
            contact_id
        ),
        organization_id=(
            organization_id
        ),
        action_id=(
            action_id
        ),
        source_type=(
            source_type
        ),
        source_entity_type=(
            source_entity_type
        ),
        source_entity_id=(
            source_entity_id
        ),
        before_data=(
            before_data
        ),
        after_data=(
            after_data
        ),
        request_id=(
            request_id
        ),
        ip_address=(
            ip_address
        ),
        user_agent=(
            user_agent
        ),
    )

    db.add(
        event
    )

    db.flush()

    return event
