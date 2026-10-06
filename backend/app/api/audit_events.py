from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
)
from sqlalchemy import (
    or_,
    select,
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import (
    get_current_auth_context,
)
from app.models.audit_event import (
    AuditEvent,
)
from app.schemas.audit_event import (
    AuditEventResponse,
)
from app.schemas.auth import (
    AuthContextResponse,
)


router = APIRouter(
    prefix="/api/v1/core/audit-events",
    tags=[
        "KEMS Core - Audit & Governance"
    ],
)


def require_direction(
    auth: AuthContextResponse,
):
    if (
        auth.account_type
        != "internal"
        or not auth.profile
    ):
        raise HTTPException(
            status_code=403,
            detail=(
                "Accès réservé "
                "à la Direction KEMS."
            ),
        )

    if (
        auth.projection
        != "direction"
    ):
        raise HTTPException(
            status_code=403,
            detail=(
                "Le journal d'audit "
                "est réservé "
                "à la Direction KEMS."
            ),
        )


@router.get(
    "",
    response_model=list[
        AuditEventResponse
    ],
)
def list_audit_events(
    effective_context: str | None = Query(
        default=None
    ),
    action_type: str | None = Query(
        default=None
    ),
    actor_type: str | None = Query(
        default=None
    ),
    actor_profile_id: str | None = Query(
        default=None
    ),
    actor_unit_id: str | None = Query(
        default=None
    ),
    entity_type: str | None = Query(
        default=None
    ),
    entity_id: str | None = Query(
        default=None
    ),
    contact_id: str | None = Query(
        default=None
    ),
    organization_id: str | None = Query(
        default=None
    ),
    action_id: str | None = Query(
        default=None
    ),
    source_type: str | None = Query(
        default=None
    ),
    search: str | None = Query(
        default=None
    ),
    limit: int = Query(
        default=100,
        ge=1,
        le=500,
    ),
    auth: AuthContextResponse = Depends(
        get_current_auth_context
    ),
    db: Session = Depends(
        get_db
    ),
):
    require_direction(
        auth
    )

    statement = select(
        AuditEvent
    )

    if effective_context:
        statement = statement.where(
            AuditEvent.effective_context
            == effective_context
        )

    if action_type:
        statement = statement.where(
            AuditEvent.action_type
            == action_type
        )

    if actor_type:
        statement = statement.where(
            AuditEvent.actor_type
            == actor_type
        )

    if actor_profile_id:
        statement = statement.where(
            AuditEvent.actor_profile_id
            == actor_profile_id
        )

    if actor_unit_id:
        statement = statement.where(
            AuditEvent.actor_unit_id
            == actor_unit_id
        )

    if entity_type:
        statement = statement.where(
            AuditEvent.entity_type
            == entity_type
        )

    if entity_id:
        statement = statement.where(
            AuditEvent.entity_id
            == entity_id
        )

    if contact_id:
        statement = statement.where(
            AuditEvent.contact_id
            == contact_id
        )

    if organization_id:
        statement = statement.where(
            AuditEvent.organization_id
            == organization_id
        )

    if action_id:
        statement = statement.where(
            AuditEvent.action_id
            == action_id
        )

    if source_type:
        statement = statement.where(
            AuditEvent.source_type
            == source_type
        )

    if (
        search
        and search.strip()
    ):
        term = (
            f"%{search.strip()}%"
        )

        statement = statement.where(
            or_(
                AuditEvent.actor_name
                .ilike(term),
                AuditEvent.actor_role_name
                .ilike(term),
                AuditEvent.actor_unit_name
                .ilike(term),
                AuditEvent.action_type
                .ilike(term),
                AuditEvent.description
                .ilike(term),
                AuditEvent.entity_type
                .ilike(term),
                AuditEvent.entity_id
                .ilike(term),
                AuditEvent.source_type
                .ilike(term),
                AuditEvent.source_entity_type
                .ilike(term),
                AuditEvent.source_entity_id
                .ilike(term),
            )
        )

    statement = (
        statement
        .order_by(
            AuditEvent.created_at.desc(),
            AuditEvent.id.desc(),
        )
        .limit(
            limit
        )
    )

    return db.scalars(
        statement
    ).all()


@router.get(
    "/{audit_event_id}",
    response_model=AuditEventResponse,
)
def get_audit_event(
    audit_event_id: str,
    auth: AuthContextResponse = Depends(
        get_current_auth_context
    ),
    db: Session = Depends(
        get_db
    ),
):
    require_direction(
        auth
    )

    event = db.get(
        AuditEvent,
        audit_event_id,
    )

    if not event:
        raise HTTPException(
            status_code=404,
            detail=(
                "Événement d'audit "
                "introuvable."
            ),
        )

    return event
