from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.lead import Lead
from app.schemas.lead import LeadCreate, LeadResponse


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