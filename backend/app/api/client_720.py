from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import (
    get_current_auth_context,
)
from app.models.contact import Contact
from app.models.contact_organization import (
    ContactOrganization,
)
from app.models.organization import Organization
from app.schemas.auth import AuthContextResponse
from app.schemas.client_720 import (
    Client720DataQuality,
    Client720Projection,
)


router = APIRouter(
    prefix="/api/v1/core/contacts",
    tags=[
        "KEMS Core - Client 720"
    ],
)


def require_internal_user(
    auth: AuthContextResponse,
):
    if (
        auth.account_type
        != "internal"
    ):
        raise HTTPException(
            status_code=403,
            detail=(
                "La projection Client 720° "
                "est réservée aux "
                "utilisateurs internes."
            ),
        )


def get_contact_or_404(
    db: Session,
    contact_id: str,
) -> Contact:
    contact = db.get(
        Contact,
        contact_id,
    )

    if not contact:
        raise HTTPException(
            status_code=404,
            detail=(
                "Contact introuvable."
            ),
        )

    if not contact.is_active:
        raise HTTPException(
            status_code=404,
            detail=(
                "Contact introuvable."
            ),
        )

    return contact


def resolve_primary_organization(
    db: Session,
    contact: Contact,
) -> Organization | None:
    relationship = db.scalar(
        select(
            ContactOrganization
        )
        .where(
            ContactOrganization.contact_id
            == contact.id,
            ContactOrganization.is_active
            .is_(True),
        )
        .order_by(
            ContactOrganization.is_primary
            .desc(),
            ContactOrganization.created_at
            .asc(),
        )
    )

    if relationship:
        organization = db.get(
            Organization,
            relationship.organization_id,
        )

        if (
            organization
            and organization.is_active
        ):
            return organization

    if contact.organization_id:
        organization = db.get(
            Organization,
            contact.organization_id,
        )

        if (
            organization
            and organization.is_active
        ):
            return organization

    return None


def build_data_quality(
    contact: Contact,
    organization: (
        Organization
        | None
    ),
) -> Client720DataQuality:
    checks = [
        bool(contact.first_name),
        bool(contact.last_name),
        bool(contact.email),
        bool(contact.phone),
        bool(contact.job_title),
        organization is not None,
    ]

    completeness_score = round(
        sum(
            1
            for check in checks
            if check
        )
        / len(checks)
        * 100
    )

    return Client720DataQuality(
        verification_status=(
            contact.verification_status
        ),
        is_verified=(
            contact.is_verified
        ),
        has_email=bool(
            contact.email
        ),
        has_phone=bool(
            contact.phone
        ),
        has_job_title=bool(
            contact.job_title
        ),
        has_organization=(
            organization
            is not None
        ),
        completeness_score=(
            completeness_score
        ),
    )


@router.get(
    "/{contact_id}/720",
    response_model=Client720Projection,
)
def get_client_720_projection(
    contact_id: str,
    auth: AuthContextResponse = Depends(
        get_current_auth_context
    ),
    db: Session = Depends(
        get_db
    ),
):
    require_internal_user(
        auth
    )

    contact = get_contact_or_404(
        db,
        contact_id,
    )

    organization = (
        resolve_primary_organization(
            db,
            contact,
        )
    )

    return Client720Projection(
        contact=contact,
        organization=organization,
        data_quality=(
            build_data_quality(
                contact,
                organization,
            )
        ),
    )
