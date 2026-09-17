from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.lead import Lead
from app.models.opportunity import Opportunity
from app.schemas.opportunity import (
    OpportunityCreate,
    OpportunityResponse,
)


router = APIRouter(
    prefix="/api/v1/opportunities",
    tags=["Opportunities"],
)


@router.post(
    "",
    response_model=OpportunityResponse,
    status_code=201,
)
def create_opportunity(
    payload: OpportunityCreate,
    db: Session = Depends(get_db),
):
    lead = db.get(
        Lead,
        payload.lead_id,
    )

    if not lead:
        raise HTTPException(
    status_code=404,
    detail="Lead introuvable.",
)

    if lead.status != "qualified":
        raise HTTPException(
    status_code=400,
    detail=(
        "Le lead doit être qualifié "
        "avant de devenir une opportunité."
    ),
    )

    existing_opportunity = db.scalar(
        select(Opportunity).where(
            Opportunity.lead_id == lead.id
        )
    )

    if existing_opportunity:
        raise HTTPException(
    status_code=400,
    detail=(
        "Une opportunité existe déjà "
        "pour ce lead."
    ),
    )

    opportunity = Opportunity(
        lead_id=lead.id,
        organization_id=lead.organization_id,
        primary_contact_id=lead.contact_id,
        owner_id=lead.owner_id,
        name=payload.name,
        description=payload.description,
        estimated_value=(
            payload.estimated_value
            if payload.estimated_value is not None
            else lead.estimated_value
        ),
        currency=payload.currency,
        probability=payload.probability,
        expected_close_date=(
            payload.expected_close_date
        ),
    )

    lead.status = "converted_to_opportunity"

    db.add(opportunity)
    db.commit()
    db.refresh(opportunity)

    return opportunity