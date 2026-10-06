from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.lead import Lead
from app.schemas.lead import (
    LeadCoreConversionResponse,
    LeadCoreEntitySummary,
    LeadCoreConversionResponse,
    LeadCoreEntitySummary,
    LeadCreate,
    LeadDisqualify,
    LeadQualificationUpdate,
    LeadQualify,
    LeadResponse,
)
from app.services.lead_core_conversion_service import (
    convert_lead_to_core,
)
from app.services.lead_qualification_service import (
    apply_qualification_data,
    disqualify_lead,
    mark_lead_contacted,
    qualify_lead,
    reopen_lead,
    return_qualified_lead_to_qualification,
    start_lead_qualification,
)


router = APIRouter(
    prefix="/api/v1/leads",
    tags=["Leads"],
)


def get_lead_or_404(
    db: Session,
    lead_id: str,
):
    lead = db.get(
        Lead,
        lead_id,
    )

    if not lead:
        raise HTTPException(
            status_code=404,
            detail="Lead introuvable.",
        )

    return lead


@router.post(
    "",
    response_model=LeadResponse,
    status_code=201,
)
def create_lead(
    payload: LeadCreate,
    db: Session = Depends(
        get_db
    ),
):
    lead = Lead(
        lead_type=payload.lead_type,
        first_name=payload.first_name,
        last_name=payload.last_name,
        company_name=payload.company_name,
        email=payload.email,
        phone=payload.phone,
        city=payload.city,
        country=payload.country,
        organization_id=(
            payload.organization_id
        ),
        contact_id=(
            payload.contact_id
        ),
        owner_id=payload.owner_id,
        source=payload.source,
        source_detail=(
            payload.source_detail
        ),
        need_summary=(
            payload.need_summary
        ),
        estimated_value=(
            payload.estimated_value
        ),
        currency=payload.currency,
        urgency=payload.urgency,
        fit_score=payload.fit_score,
        intent_score=(
            payload.intent_score
        ),
        engagement_score=(
            payload.engagement_score
        ),
        potential_score=(
            payload.potential_score
        ),
        qualification_notes=(
            payload.qualification_notes
        ),
    )

    db.add(
        lead
    )

    db.commit()
    db.refresh(
        lead
    )

    return lead


@router.get(
    "",
    response_model=list[
        LeadResponse
    ],
)
def list_leads(
    db: Session = Depends(
        get_db
    ),
):
    statement = (
        select(
            Lead
        )
        .order_by(
            Lead.created_at.desc()
        )
    )

    return db.scalars(
        statement
    ).all()


@router.get(
    "/{lead_id}",
    response_model=LeadResponse,
)
def get_lead(
    lead_id: str,
    db: Session = Depends(
        get_db
    ),
):
    return get_lead_or_404(
        db,
        lead_id,
    )


@router.post(
    "/{lead_id}/contacted",
    response_model=LeadResponse,
)
def mark_contacted(
    lead_id: str,
    db: Session = Depends(
        get_db
    ),
):
    lead = get_lead_or_404(
        db,
        lead_id,
    )

    mark_lead_contacted(
        lead
    )

    db.commit()
    db.refresh(
        lead
    )

    return lead


@router.post(
    "/{lead_id}/qualification/start",
    response_model=LeadResponse,
)
def start_qualification(
    lead_id: str,
    db: Session = Depends(
        get_db
    ),
):
    lead = get_lead_or_404(
        db,
        lead_id,
    )

    start_lead_qualification(
        lead
    )

    db.commit()
    db.refresh(
        lead
    )

    return lead


@router.patch(
    "/{lead_id}/qualification",
    response_model=LeadResponse,
)
def update_qualification(
    lead_id: str,
    payload:
        LeadQualificationUpdate,
    db: Session = Depends(
        get_db
    ),
):
    lead = get_lead_or_404(
        db,
        lead_id,
    )

    data = payload.model_dump(
        exclude_unset=True
    )

    apply_qualification_data(
        lead,
        data,
    )

    db.commit()
    db.refresh(
        lead
    )

    return lead


@router.post(
    "/{lead_id}/qualify",
    response_model=LeadResponse,
)
def confirm_qualification(
    lead_id: str,
    payload: LeadQualify,
    db: Session = Depends(
        get_db
    ),
):
    lead = get_lead_or_404(
        db,
        lead_id,
    )

    data = payload.model_dump(
        exclude_unset=True
    )

    qualify_lead(
        lead,
        data,
    )

    db.commit()
    db.refresh(
        lead
    )

    return lead


@router.post(
    "/{lead_id}/disqualify",
    response_model=LeadResponse,
)
def confirm_disqualification(
    lead_id: str,
    payload: LeadDisqualify,
    db: Session = Depends(
        get_db
    ),
):
    lead = get_lead_or_404(
        db,
        lead_id,
    )

    disqualify_lead(
        lead,
        payload.reason,
    )

    db.commit()
    db.refresh(
        lead
    )

    return lead


@router.post(
    "/{lead_id}/reopen",
    response_model=LeadResponse,
)
def reopen_disqualified_lead(
    lead_id: str,
    db: Session = Depends(
        get_db
    ),
):
    lead = get_lead_or_404(
        db,
        lead_id,
    )

    reopen_lead(
        lead
    )

    db.commit()
    db.refresh(
        lead
    )

    return lead



@router.post(
    "/{lead_id}/return-to-qualification",
    response_model=LeadResponse,
)
def return_to_qualification(
    lead_id: str,
    db: Session = Depends(
        get_db
    ),
):
    lead = get_lead_or_404(
        db,
        lead_id,
    )

    try:
        return_qualified_lead_to_qualification(
            lead
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=409,
            detail=str(exc),
        ) from exc

    db.commit()
    db.refresh(
        lead
    )

    return lead


@router.post(
    "/{lead_id}/convert-to-core",
    response_model=(
        LeadCoreConversionResponse
    ),
)
def convert_to_core(
    lead_id: str,
    db: Session = Depends(
        get_db
    ),
):
    lead = get_lead_or_404(
        db,
        lead_id,
    )

    result = convert_lead_to_core(
        db,
        lead=lead,
    )

    db.commit()
    db.refresh(
        lead
    )

    contact = result[
        "contact"
    ]

    organization = result[
        "organization"
    ]

    return LeadCoreConversionResponse(
        lead=lead,
        contact=(
            LeadCoreEntitySummary(
                id=contact.id,
                entity_type="contact",
                label=(
                    f"{contact.first_name} "
                    f"{contact.last_name}"
                ).strip(),
            )
            if contact
            else None
        ),
        organization=(
            LeadCoreEntitySummary(
                id=organization.id,
                entity_type="organization",
                label=organization.name,
            )
            if organization
            else None
        ),
        contact_created=result[
            "contact_created"
        ],
        organization_created=result[
            "organization_created"
        ],
    )
