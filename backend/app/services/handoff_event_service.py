from sqlalchemy.orm import Session

from app.models.opportunity import (
    Opportunity,
)
from app.models.opportunity_handoff import (
    OpportunityHandoff,
)
from app.models.organizational_unit import (
    OrganizationalUnit,
)
from app.schemas.auth import (
    AuthContextResponse,
)
from app.services.activity_service import (
    record_activity,
)
from app.services.audit_service import (
    record_audit_event,
)


HANDOFF_EVENT_LABELS = {
    "handed_off": {
        "event_type": "handoff.created",
        "title": "Opportunité transmise au métier",
    },
    "accepted": {
        "event_type": "handoff.accepted",
        "title": "Opportunité prise en charge",
    },
    "in_progress": {
        "event_type": "handoff.started",
        "title": "Traitement métier démarré",
    },
    "completed": {
        "event_type": "handoff.completed",
        "title": "Traitement métier terminé",
    },
}


def _iso(
    value,
):
    if value is None:
        return None

    return (
        value.isoformat()
        if hasattr(
            value,
            "isoformat",
        )
        else str(value)
    )


def handoff_audit_snapshot(
    handoff: OpportunityHandoff,
    target_unit: OrganizationalUnit,
) -> dict:
    return {
        "opportunity_id":
            handoff.opportunity_id,
        "target_unit_id":
            handoff.target_unit_id,
        "target_unit_code":
            target_unit.code,
        "target_unit_name":
            target_unit.name,
        "status":
            handoff.status,
        "handed_off_at":
            _iso(
                handoff.handed_off_at
            ),
        "accepted_at":
            _iso(
                handoff.accepted_at
            ),
        "started_at":
            _iso(
                handoff.started_at
            ),
        "completed_at":
            _iso(
                handoff.completed_at
            ),
        "notes":
            handoff.notes,
    }


def record_handoff_governance(
    db: Session,
    *,
    auth: AuthContextResponse,
    opportunity: Opportunity,
    handoff: OpportunityHandoff,
    target_unit: OrganizationalUnit,
    effective_context: str,
    previous_status: str | None,
) -> None:
    metadata = (
        HANDOFF_EVENT_LABELS.get(
            handoff.status
        )
    )

    if not metadata:
        return

    target_name = (
        target_unit.name
    )

    description = (
        f"{opportunity.name} → "
        f"{target_name}."
    )

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

    # --------------------------------------------------------
    # Activity = timeline métier
    # --------------------------------------------------------

    record_activity(
        db,
        event_type=(
            metadata[
                "event_type"
            ]
        ),
        title=(
            metadata[
                "title"
            ]
        ),
        description=description,
        context=(
            effective_context
        ),
        actor_type=(
            auth.account_type
        ),
        actor_profile_id=(
            actor_profile_id
        ),
        actor_contact_id=(
            actor_contact_id
        ),
        contact_id=(
            opportunity
            .primary_contact_id
        ),
        organization_id=(
            opportunity
            .organization_id
        ),
        source_type=(
            "growth_engine"
        ),
        source_entity_type=(
            "opportunity_handoff"
        ),
        source_entity_id=(
            handoff.id
        ),
    )

    # --------------------------------------------------------
    # Audit = preuve de gouvernance
    # --------------------------------------------------------

    before_data = None

    if (
        previous_status
        is not None
    ):
        before_data = {
            "status":
                previous_status,
            "target_unit_id":
                target_unit.id,
            "target_unit_code":
                target_unit.code,
            "target_unit_name":
                target_unit.name,
            "opportunity_id":
                opportunity.id,
        }

    record_audit_event(
        db,
        auth=auth,
        effective_context=(
            effective_context
        ),
        action_type=(
            metadata[
                "event_type"
            ]
        ),
        entity_type=(
            "opportunity_handoff"
        ),
        entity_id=(
            handoff.id
        ),
        contact_id=(
            opportunity
            .primary_contact_id
        ),
        organization_id=(
            opportunity
            .organization_id
        ),
        description=(
            description
        ),
        source_type=(
            "growth_engine"
        ),
        source_entity_type=(
            "opportunity"
        ),
        source_entity_id=(
            opportunity.id
        ),
        before_data=(
            before_data
        ),
        after_data=(
            handoff_audit_snapshot(
                handoff,
                target_unit,
            )
        ),
    )
