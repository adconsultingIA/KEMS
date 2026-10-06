from datetime import (
    datetime,
    timezone,
)

from fastapi import HTTPException

from app.models.opportunity_handoff import (
    OpportunityHandoff,
)


HANDOFF_TRANSITIONS = {
    "handed_off": {
        "accepted",
    },
    "accepted": {
        "in_progress",
    },
    "in_progress": {
        "completed",
    },
    "completed": set(),
}


def utcnow():
    return datetime.now(
        timezone.utc
    )


def update_handoff_status(
    handoff: OpportunityHandoff,
    *,
    new_status: str,
    actor_profile_id:
        str | None = None,
):
    current_status = (
        handoff.status
    )

    if (
        current_status
        == new_status
    ):
        return handoff

    allowed = (
        HANDOFF_TRANSITIONS.get(
            current_status,
            set(),
        )
    )

    if (
        new_status
        not in allowed
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                "Transition de handoff "
                "interdite : "
                f"{current_status} "
                f"→ {new_status}."
            ),
        )

    now = utcnow()

    handoff.status = (
        new_status
    )

    if (
        new_status
        == "accepted"
    ):
        handoff.accepted_at = now
        handoff.accepted_by_profile_id = (
            actor_profile_id
        )

    elif (
        new_status
        == "in_progress"
    ):
        handoff.started_at = now

    elif (
        new_status
        == "completed"
    ):
        handoff.completed_at = now

    return handoff
