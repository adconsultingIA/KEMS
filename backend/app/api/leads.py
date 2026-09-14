from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.lead import Lead
from app.schemas.lead import (
    LeadCreate,
    LeadQualify,
    LeadResponse,
)


router = APIRouter(
    prefix="/api/v1/leads",
    tags=["Leads"],
)


@router.post(
    "",
    response_model=LeadResponse,
    status_code=201,
)
def create_lead(
    payload: LeadCreate,
    db: Session = Depends(get_db),
):
    lead = Lead(
        organization_id=payload.organization_id,
        contact_id=payload.contact_id,
        owner_id=payload.owner_id,
        source=payload.source,
        source_detail=payload.source_detail,
        need_summary=payload.need_summary,
        estimated_value=payload.estimated_value,
        currency=payload.currency,
        urgency=payload.urgency,
        fit_score=payload.fit_score,
        intent_score=payload.intent_score,
        engagement_score=payload.engagement_score,
        potential_score=payload.potential_score,
        qualification_notes=payload.qualification_notes,
    )

    db.add(lead)
    db.commit()
    db.refresh(lead)

    return lead


@router.get(
    "",
    response_model=list[LeadResponse],
)
def list_leads(
    db: Session = Depends(get_db),
):
    statement = select(Lead).order_by(
        Lead.created_at.desc()
    )

    return db.scalars(statement).all()


@router.get(
    "/{lead_id}",
    response_model=LeadResponse,
)
def get_lead(
    lead_id: str,
    db: Session = Depends(get_db),
):
    lead = db.get(Lead, lead_id)

    if not lead:
        raise HTTPException(
    status_code=404,
    detail="Lead introuvable.",
)

    return lead


@router.post(
    "/{lead_id}/qualify",
    response_model=LeadResponse,
)
def qualify_lead(
    lead_id: str,
    payload: LeadQualify,
    db: Session = Depends(get_db),
):
    lead = db.get(Lead, lead_id)

    if not lead:
        raise HTTPException(
    status_code=404,
    detail="Lead introuvable.",
)

    if lead.status == "qualified":
        raise HTTPException(
    status_code=400,
    detail="Ce lead est déjà qualifié.",
    )

    if lead.status == "converted_to_opportunity":
        raise HTTPException(
    status_code=400,
    detail="Ce lead a déjà été converti en opportunité.",
    )

    if lead.status == "disqualified":
        raise HTTPException(
    status_code=400,
    detail=(
        "Un lead disqualifié ne peut pas "
        "être qualifié directement."
    ),
    )

    lead.status = "qualified"
    lead.qualified_at = datetime.now(timezone.utc)

    if payload.qualification_notes is not None:
        lead.qualification_notes = (
            payload.qualification_notes
        )

    db.commit()
    db.refresh(lead)

    return lead