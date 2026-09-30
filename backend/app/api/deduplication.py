import json

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.contact import Contact
from app.models.contact_merge import ContactMerge
from app.models.organization import Organization
from app.schemas.deduplication import (
    ContactMergeCreate,
    ContactMergeResponse,
    DuplicateCandidate,
    DuplicateCandidateResponse,
    DuplicateEntitySummary,
)
from app.services.contact_merge import (
    merge_contacts,
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


def serialize_merge(
    merge: ContactMerge,
) -> ContactMergeResponse:
    return ContactMergeResponse(
        id=merge.id,
        canonical_contact_id=(
            merge.canonical_contact_id
        ),
        duplicate_contact_id=(
            merge.duplicate_contact_id
        ),
        reason=merge.reason,
        copied_fields=json.loads(
            merge.copied_fields or "[]"
        ),
        transferred_relationships=(
            merge.transferred_relationships
        ),
        transferred_leads=(
            merge.transferred_leads
        ),
        transferred_opportunities=(
            merge.transferred_opportunities
        ),
        created_at=merge.created_at,
    )


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


@router.post(
    "/contacts/merge",
    response_model=ContactMergeResponse,
    status_code=201,
)
def merge_contact_duplicates(
    payload: ContactMergeCreate,
    db: Session = Depends(get_db),
):
    if not payload.confirmed:
        raise HTTPException(
            status_code=400,
            detail=(
                "La fusion doit être "
                "explicitement confirmée."
            ),
        )

    if (
        payload.canonical_contact_id
        == payload.duplicate_contact_id
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Le contact canonique et le "
                "doublon doivent être différents."
            ),
        )

    canonical = db.get(
        Contact,
        payload.canonical_contact_id,
    )

    duplicate = db.get(
        Contact,
        payload.duplicate_contact_id,
    )

    if not canonical:
        raise HTTPException(
            status_code=404,
            detail="Contact canonique introuvable.",
        )

    if not duplicate:
        raise HTTPException(
            status_code=404,
            detail="Contact doublon introuvable.",
        )

    if not canonical.is_active:
        raise HTTPException(
            status_code=400,
            detail=(
                "Le contact canonique doit être actif."
            ),
        )

    if not duplicate.is_active:
        raise HTTPException(
            status_code=400,
            detail=(
                "Le contact doublon est déjà inactif."
            ),
        )

    if duplicate.merged_into_contact_id:
        raise HTTPException(
            status_code=409,
            detail=(
                "Ce contact a déjà été fusionné."
            ),
        )

    score, reasons = contact_duplicate_score(
        canonical,
        duplicate,
    )

    if score < 80:
        raise HTTPException(
            status_code=400,
            detail={
                "message": (
                    "Les contacts ne sont pas "
                    "identifiés comme doublons."
                ),
                "score": score,
                "reasons": reasons,
            },
        )

    try:
        merge = merge_contacts(
            db,
            canonical,
            duplicate,
            payload.reason,
        )

        db.commit()
        db.refresh(merge)

        return serialize_merge(
            merge
        )

    except Exception:
        db.rollback()
        raise


@router.get(
    "/contact-merges",
    response_model=list[ContactMergeResponse],
)
def list_contact_merges(
    db: Session = Depends(get_db),
):
    merges = db.scalars(
        select(ContactMerge).order_by(
            ContactMerge.created_at.desc()
        )
    ).all()

    return [
        serialize_merge(merge)
        for merge in merges
    ]
