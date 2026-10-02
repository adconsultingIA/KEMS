import uuid

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import (
    get_current_auth_context,
)
from app.models.action import Action
from app.models.contact import Contact
from app.models.organizational_unit import (
    OrganizationalUnit,
)
from app.schemas.action import (
    ClientAdviceRequestCreate,
    ClientAdviceRequestResponse,
)
from app.schemas.auth import (
    AuthContextResponse,
)
from app.services.activity_service import (
    record_action_created_activity,
)


router = APIRouter(
    prefix="/api/v1/client/actions",
    tags=["Client 360 - Actions"],
)


DOMAIN_CONTEXTS = {
    "assurance": "assurance",
    "investissement": "investissement",
    "fiduciaire": "fiduciaire",
    "technologies": "technologies",
    "consulting": "commercial",
    "commercial": "commercial",
    "immobilier": "commercial",
    "autre": "direction",
}


DOMAIN_UNIT_CODES = {
    "assurance": "ASSURANCE",
    "investissement": "INVESTISSEMENT",
    "fiduciaire": "FIDUCIAIRE",
    "technologies": "TECHNOLOGIES",
    "commercial": "COMMERCIAL",
    "direction": "DIRECTION",
}


def normalize_domain(
    value: str,
) -> str:
    return (
        value.strip()
        .lower()
        .replace("é", "e")
        .replace("è", "e")
        .replace("ê", "e")
        .replace("à", "a")
    )


def priority_from_urgency(
    urgency: str,
) -> str:
    if urgency == "urgent":
        return "high"

    if urgency == "low":
        return "low"

    return "medium"


def find_unit_for_context(
    db: Session,
    context: str,
) -> OrganizationalUnit | None:
    code = DOMAIN_UNIT_CODES.get(
        context
    )

    if not code:
        return None

    return db.scalar(
        select(
            OrganizationalUnit
        ).where(
            func.lower(
                OrganizationalUnit.code
            )
            == code.lower(),
            OrganizationalUnit.is_active
            .is_(True),
        )
    )


@router.post(
    "/advice-request",
    response_model=(
        ClientAdviceRequestResponse
    ),
    status_code=201,
)
def create_client_advice_request(
    payload:
        ClientAdviceRequestCreate,
    auth: AuthContextResponse = Depends(
        get_current_auth_context
    ),
    db: Session = Depends(get_db),
):
    if (
        auth.account_type != "client"
        or not auth.contact
    ):
        raise HTTPException(
            status_code=403,
            detail=(
                "Accès réservé aux "
                "clients KEMS."
            ),
        )

    contact = db.get(
        Contact,
        auth.contact.id,
    )

    if (
        not contact
        or not contact.is_active
        or contact.merged_into_contact_id
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                "Contact client "
                "indisponible."
            ),
        )

    domain_key = normalize_domain(
        payload.domain
    )

    context = DOMAIN_CONTEXTS.get(
        domain_key,
        "direction",
    )

    unit = find_unit_for_context(
        db,
        context,
    )

    subject = (
        payload.subject
        .strip()
    )

    description = (
        payload.description
        .strip()
    )

    if not subject:
        raise HTTPException(
            status_code=422,
            detail=(
                "Le sujet est obligatoire."
            ),
        )

    if not description:
        raise HTTPException(
            status_code=422,
            detail=(
                "La description "
                "est obligatoire."
            ),
        )

    reference = (
        "KEMS-REQ-"
        + uuid.uuid4()
        .hex[:8]
        .upper()
    )

    action = Action(
        title=subject,
        description=description,
        status="todo",
        priority=priority_from_urgency(
            payload.urgency
        ),
        context=context,
        owner_profile_id=None,
        unit_id=(
            unit.id
            if unit
            else None
        ),
        contact_id=contact.id,
        organization_id=(
            contact.organization_id
        ),
        source_type="client_360",
        source_entity_type=(
            "advice_request"
        ),
        source_entity_id=reference,
        created_by_profile_id=None,
    )

    db.add(action)
    db.flush()

    record_action_created_activity(
        db,
        action=action,
        actor_type="client",
        actor_contact_id=(
            contact.id
        ),
    )

    db.commit()
    db.refresh(action)

    return (
        ClientAdviceRequestResponse(
            reference=reference,
            action=action,
        )
    )
