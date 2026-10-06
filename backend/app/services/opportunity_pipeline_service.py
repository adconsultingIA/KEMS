from datetime import (
    datetime,
    timezone,
)

from fastapi import HTTPException

from app.models.opportunity import (
    Opportunity,
)


STAGE_TRANSITIONS = {
    "qualified": {
        "proposal",
        "lost",
    },
    "proposal": {
        "negotiation",
        "won",
        "lost",
    },
    "negotiation": {
        "won",
        "lost",
    },
    "won": set(),
    "lost": set(),
}


DEFAULT_PROBABILITIES = {
    "qualified": 25,
    "proposal": 50,
    "negotiation": 75,
    "won": 100,
    "lost": 0,
}


def utcnow():
    return datetime.now(
        timezone.utc
    )


def update_opportunity_stage(
    opportunity: Opportunity,
    *,
    new_stage: str,
    lost_reason: str | None = None,
):
    current_stage = (
        opportunity.stage
    )

    if (
        current_stage
        == new_stage
    ):
        return opportunity

    allowed = (
        STAGE_TRANSITIONS.get(
            current_stage,
            set(),
        )
    )

    if (
        new_stage
        not in allowed
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                "Transition de pipeline "
                f"interdite : "
                f"{current_stage} → "
                f"{new_stage}."
            ),
        )

    if (
        new_stage
        == "lost"
        and not lost_reason
    ):
        raise HTTPException(
            status_code=422,
            detail=(
                "Le motif de perte "
                "est obligatoire."
            ),
        )

    opportunity.stage = (
        new_stage
    )

    opportunity.probability = (
        DEFAULT_PROBABILITIES[
            new_stage
        ]
    )

    if (
        new_stage
        == "won"
    ):
        opportunity.won_at = (
            utcnow()
        )

        opportunity.lost_at = None
        opportunity.lost_reason = None

    elif (
        new_stage
        == "lost"
    ):
        opportunity.lost_at = (
            utcnow()
        )

        opportunity.lost_reason = (
            lost_reason
        )

        opportunity.won_at = None

    else:
        opportunity.won_at = None
        opportunity.lost_at = None
        opportunity.lost_reason = None

    return opportunity
