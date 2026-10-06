from datetime import (
    datetime,
    timezone,
)

from fastapi import HTTPException

from app.models.lead import Lead


EDITABLE_STATUSES = {
    "new",
    "contacted",
    "qualifying",
}

QUALIFIABLE_STATUSES = {
    "new",
    "contacted",
    "qualifying",
}


def utcnow():
    return datetime.now(
        timezone.utc
    )


def ensure_not_converted(
    lead: Lead,
):
    if (
        lead.status
        == "converted_to_opportunity"
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                "Ce lead a déjà été "
                "converti en opportunité."
            ),
        )


def mark_lead_contacted(
    lead: Lead,
):
    ensure_not_converted(
        lead
    )

    if (
        lead.status
        == "disqualified"
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                "Un lead disqualifié doit "
                "être rouvert avant contact."
            ),
        )

    if (
        lead.status
        == "qualified"
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                "Un lead déjà qualifié "
                "ne peut pas revenir "
                "au statut contacted."
            ),
        )

    if (
        lead.contacted_at
        is None
    ):
        lead.contacted_at = (
            utcnow()
        )

    if (
        lead.status
        == "new"
    ):
        lead.status = (
            "contacted"
        )

    return lead


def start_lead_qualification(
    lead: Lead,
):
    ensure_not_converted(
        lead
    )

    if (
        lead.status
        == "disqualified"
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                "Le lead doit être rouvert "
                "avant une nouvelle "
                "qualification."
            ),
        )

    if (
        lead.status
        == "qualified"
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                "Ce lead est déjà qualifié."
            ),
        )

    if (
        lead.status
        not in {
            "new",
            "contacted",
            "qualifying",
        }
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                "Le statut actuel ne permet "
                "pas la qualification."
            ),
        )

    if (
        lead.qualification_started_at
        is None
    ):
        lead.qualification_started_at = (
            utcnow()
        )

    lead.status = (
        "qualifying"
    )

    return lead


def apply_qualification_data(
    lead: Lead,
    data: dict,
):
    ensure_not_converted(
        lead
    )

    if (
        lead.status
        == "disqualified"
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                "Un lead disqualifié doit "
                "être rouvert avant "
                "modification de sa "
                "qualification."
            ),
        )

    if (
        lead.status
        == "qualified"
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                "La qualification d'un lead "
                "déjà qualifié est figée."
            ),
        )

    allowed_fields = {
        "need_summary",
        "estimated_value",
        "currency",
        "urgency",
        "fit_score",
        "intent_score",
        "engagement_score",
        "potential_score",
        "qualification_notes",
    }

    for key, value in (
        data.items()
    ):
        if (
            key
            not in allowed_fields
        ):
            continue

        setattr(
            lead,
            key,
            value,
        )

    if (
        lead.status
        in {
            "new",
            "contacted",
        }
    ):
        start_lead_qualification(
            lead
        )

    return lead


def qualify_lead(
    lead: Lead,
    data: dict,
):
    ensure_not_converted(
        lead
    )

    if (
        lead.status
        == "qualified"
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                "Ce lead est déjà qualifié."
            ),
        )

    if (
        lead.status
        == "disqualified"
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                "Un lead disqualifié doit "
                "être rouvert avant "
                "qualification."
            ),
        )

    if (
        lead.status
        not in QUALIFIABLE_STATUSES
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                "Le statut actuel ne permet "
                "pas de qualifier ce lead."
            ),
        )

    apply_qualification_data(
        lead,
        data,
    )

    if (
        lead.qualification_started_at
        is None
    ):
        lead.qualification_started_at = (
            utcnow()
        )

    lead.status = (
        "qualified"
    )

    lead.qualified_at = (
        utcnow()
    )

    lead.disqualified_at = None
    lead.disqualified_reason = None

    return lead


def disqualify_lead(
    lead: Lead,
    reason: str,
):
    ensure_not_converted(
        lead
    )

    if (
        lead.status
        == "qualified"
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                "Un lead qualifié ne peut "
                "pas être disqualifié "
                "directement."
            ),
        )

    if (
        lead.status
        == "disqualified"
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                "Ce lead est déjà "
                "disqualifié."
            ),
        )

    lead.status = (
        "disqualified"
    )

    lead.disqualified_at = (
        utcnow()
    )

    lead.disqualified_reason = (
        reason.strip()
    )

    return lead


def reopen_lead(
    lead: Lead,
):
    ensure_not_converted(
        lead
    )

    if (
        lead.status
        != "disqualified"
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                "Seul un lead disqualifié "
                "peut être rouvert."
            ),
        )

    lead.status = (
        "qualifying"
    )

    lead.disqualified_at = None
    lead.disqualified_reason = None

    lead.qualification_started_at = (
        utcnow()
    )

    lead.qualified_at = None

    return lead


def return_qualified_lead_to_qualification(
    lead,
):
    """
    Correct an explicit qualification decision.

    Keeps:
    - scoring
    - qualification notes
    - Core links/materialization

    Only the commercial qualification decision is reverted.
    """

    if lead.status != "qualified":
        raise ValueError(
            "Seul un lead qualifié peut revenir en qualification."
        )

    lead.status = "qualifying"

    # The previous qualification decision is no longer current.
    lead.qualified_at = None

    # Do not delete:
    # - qualification_started_at
    # - scores
    # - notes
    # - contact_id / organization_id
    # - core_converted_at

    return lead
