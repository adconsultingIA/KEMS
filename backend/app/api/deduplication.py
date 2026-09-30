from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.contact import Contact
from app.models.organization import Organization
from app.schemas.deduplication import (
    DuplicateCandidate,
    DuplicateCandidateResponse,
    DuplicateEntitySummary,
)
from app.services.deduplication import (
    contact_duplicate_score,
    organization_duplicate_score,
)


router = APIRouter(
    prefix="/api/v1/core/deduplication",
    tags=["KEMS Core - Deduplication"],
)


def confidence_from_score(
    score: int,
) -> str:
    if score >= 100:
        return "exact"

    if score >= 90:
        return "high"

    return "possible"


@router.get(
    "/contacts",
    response_model=DuplicateCandidateResponse,
)
def contact_duplicate_candidates(
    min_score: int = Query(
        default=80,
        ge=80,
        le=100,
    ),
    db: Session = Depends(get_db),
):
    contacts = db.scalars(
        select(Contact).where(
            Contact.is_active.is_(True)
        )
    ).all()

    candidates = []

    for index, left in enumerate(contacts):
        for right in contacts[index + 1 :]:
            score, reasons = (
                contact_duplicate_score(
                    left,
                    right,
                )
            )

            if score < min_score:
                continue

            candidates.append(
                DuplicateCandidate(
                    score=score,
                    confidence=confidence_from_score(
                        score
                    ),
                    reasons=reasons,
                    left=DuplicateEntitySummary(
                        id=left.id,
                        label=(
                            f"{left.first_name} "
                            f"{left.last_name}"
                        ),
                    ),
                    right=DuplicateEntitySummary(
                        id=right.id,
                        label=(
                            f"{right.first_name} "
                            f"{right.last_name}"
                        ),
                    ),
                )
            )

    candidates.sort(
        key=lambda item: item.score,
        reverse=True,
    )

    return DuplicateCandidateResponse(
        total=len(candidates),
        candidates=candidates,
    )


@router.get(
    "/organizations",
    response_model=DuplicateCandidateResponse,
)
def organization_duplicate_candidates(
    min_score: int = Query(
        default=80,
        ge=80,
        le=100,
    ),
    db: Session = Depends(get_db),
):
    organizations = db.scalars(
        select(Organization).where(
            Organization.is_active.is_(True)
        )
    ).all()

    candidates = []

    for index, left in enumerate(
        organizations
    ):
        for right in organizations[
            index + 1 :
        ]:
            score, reasons = (
                organization_duplicate_score(
                    left,
                    right,
                )
            )

            if score < min_score:
                continue

            candidates.append(
                DuplicateCandidate(
                    score=score,
                    confidence=confidence_from_score(
                        score
                    ),
                    reasons=reasons,
                    left=DuplicateEntitySummary(
                        id=left.id,
                        label=left.name,
                    ),
                    right=DuplicateEntitySummary(
                        id=right.id,
                        label=right.name,
                    ),
                )
            )

    candidates.sort(
        key=lambda item: item.score,
        reverse=True,
    )

    return DuplicateCandidateResponse(
        total=len(candidates),
        candidates=candidates,
    )
