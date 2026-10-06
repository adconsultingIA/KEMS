from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
)
from sqlalchemy import (
    or_,
    select,
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.lead import Lead
from app.models.opportunity import (
    Opportunity,
)
from app.schemas.opportunity import (
    OpportunityCreate,
    OpportunityResponse,
    OpportunityStageUpdate,
    OpportunityUpdate,
)
from app.services.opportunity_pipeline_service import (
    update_opportunity_stage,
)


router = APIRouter(
    prefix="/api/v1/opportunities",
    tags=["Opportunities"],
)


def get_opportunity_or_404(
    db: Session,
    opportunity_id: str,
):
    opportunity = db.get(
        Opportunity,
        opportunity_id,
    )

    if not opportunity:
        raise HTTPException(
            status_code=404,
            detail=(
                "Opportunité introuvable."
            ),
        )

    return opportunity


@router.post(
    "",
    response_model=OpportunityResponse,
    status_code=201,
)
def create_opportunity(
    payload: OpportunityCreate,
    db: Session = Depends(
        get_db
    ),
):
    lead = db.get(
        Lead,
        payload.lead_id,
    )

    if not lead:
        raise HTTPException(
            status_code=404,
            detail=(
                "Lead introuvable."
            ),
        )

    if (
        lead.status
        != "qualified"
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                "Le lead doit être "
                "qualifié avant de devenir "
                "une opportunité."
            ),
        )

    if (
        not lead.contact_id
        and not lead.organization_id
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                "Le lead doit être converti "
                "vers KEMS Core avant "
                "création de l'opportunité."
            ),
        )

    existing_opportunity = (
        db.scalar(
            select(
                Opportunity
            ).where(
                Opportunity.lead_id
                == lead.id
            )
        )
    )

    if existing_opportunity:
        raise HTTPException(
            status_code=409,
            detail=(
                "Une opportunité existe "
                "déjà pour ce lead."
            ),
        )

    opportunity = Opportunity(
        lead_id=lead.id,
        organization_id=(
            lead.organization_id
        ),
        primary_contact_id=(
            lead.contact_id
        ),
        owner_id=lead.owner_id,
        name=payload.name,
        description=(
            payload.description
        ),
        stage="qualified",
        estimated_value=(
            payload.estimated_value
            if (
                payload.estimated_value
                is not None
            )
            else lead.estimated_value
        ),
        currency=(
            payload.currency
            or lead.currency
        ),
        probability=(
            payload.probability
        ),
        expected_close_date=(
            payload.expected_close_date
        ),
    )

    lead.status = (
        "converted_to_opportunity"
    )

    db.add(
        opportunity
    )

    db.commit()
    db.refresh(
        opportunity
    )

    return opportunity


@router.get(
    "",
    response_model=list[
        OpportunityResponse
    ],
)
def list_opportunities(
    stage: str | None = Query(
        default=None
    ),
    owner_id: str | None = Query(
        default=None
    ),
    organization_id: str | None = Query(
        default=None
    ),
    contact_id: str | None = Query(
        default=None
    ),
    search: str | None = Query(
        default=None
    ),
    db: Session = Depends(
        get_db
    ),
):
    statement = select(
        Opportunity
    )

    if stage:
        statement = (
            statement.where(
                Opportunity.stage
                == stage
            )
        )

    if owner_id:
        statement = (
            statement.where(
                Opportunity.owner_id
                == owner_id
            )
        )

    if organization_id:
        statement = (
            statement.where(
                Opportunity.organization_id
                == organization_id
            )
        )

    if contact_id:
        statement = (
            statement.where(
                Opportunity.primary_contact_id
                == contact_id
            )
        )

    if (
        search
        and search.strip()
    ):
        term = (
            f"%{search.strip()}%"
        )

        statement = (
            statement.where(
                or_(
                    Opportunity.name
                    .ilike(term),
                    Opportunity.description
                    .ilike(term),
                )
            )
        )

    statement = (
        statement
        .order_by(
            Opportunity.created_at.desc()
        )
    )

    return db.scalars(
        statement
    ).all()


@router.get(
    "/{opportunity_id}",
    response_model=OpportunityResponse,
)
def get_opportunity(
    opportunity_id: str,
    db: Session = Depends(
        get_db
    ),
):
    return get_opportunity_or_404(
        db,
        opportunity_id,
    )


@router.patch(
    "/{opportunity_id}",
    response_model=OpportunityResponse,
)
def update_opportunity(
    opportunity_id: str,
    payload: OpportunityUpdate,
    db: Session = Depends(
        get_db
    ),
):
    opportunity = (
        get_opportunity_or_404(
            db,
            opportunity_id,
        )
    )

    if (
        opportunity.stage
        in {
            "won",
            "lost",
        }
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                "Une opportunité clôturée "
                "ne peut plus être modifiée."
            ),
        )

    data = payload.model_dump(
        exclude_unset=True
    )

    for key, value in (
        data.items()
    ):
        setattr(
            opportunity,
            key,
            value,
        )

    db.commit()
    db.refresh(
        opportunity
    )

    return opportunity


@router.post(
    "/{opportunity_id}/stage",
    response_model=OpportunityResponse,
)
def change_opportunity_stage(
    opportunity_id: str,
    payload:
        OpportunityStageUpdate,
    db: Session = Depends(
        get_db
    ),
):
    opportunity = (
        get_opportunity_or_404(
            db,
            opportunity_id,
        )
    )

    update_opportunity_stage(
        opportunity,
        new_stage=(
            payload.stage
        ),
        lost_reason=(
            payload.lost_reason
        ),
    )

    db.commit()
    db.refresh(
        opportunity
    )

    return opportunity
