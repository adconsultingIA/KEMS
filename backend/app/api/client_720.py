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
    Client720AffiliationSummary,
    Client720DataQuality,
    Client720Projection,
    Client720Provenance,
    Client720Relation,
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


def list_contact_relations(
    db: Session,
    contact: Contact,
) -> list[Client720Relation]:
    links = db.scalars(
        select(
            ContactOrganization
        )
        .where(
            ContactOrganization.contact_id
            == contact.id
        )
        .order_by(
            ContactOrganization.is_primary
            .desc(),
            ContactOrganization.is_active
            .desc(),
            ContactOrganization.created_at
            .desc(),
        )
    ).all()

    relations: list[
        Client720Relation
    ] = []

    for link in links:
        organization = db.get(
            Organization,
            link.organization_id,
        )

        if not organization:
            continue

        relations.append(
            Client720Relation(
                relationship=link,
                organization=organization,
            )
        )

    return relations


def build_affiliation_summary(
    relations: list[
        Client720Relation
    ],
) -> Client720AffiliationSummary:
    active_relations = [
        relation
        for relation in relations
        if relation.relationship.is_active
    ]

    historical_relations = [
        relation
        for relation in relations
        if not relation.relationship.is_active
    ]

    primary = next(
        (
            relation
            for relation in relations
            if (
                relation.relationship.is_primary
                and relation.relationship.is_active
            )
        ),
        None,
    )

    return Client720AffiliationSummary(
        total_relations=len(
            relations
        ),
        active_relations=len(
            active_relations
        ),
        historical_relations=len(
            historical_relations
        ),
        primary_organization_id=(
            primary.organization.id
            if primary
            else None
        ),
        has_multiple_active_affiliations=(
            len(active_relations)
            > 1
        ),
    )


def build_data_quality(
    contact: Contact,
    organization: (
        Organization
        | None
    ),
) -> Client720DataQuality:
    fields = {
        "email":
            bool(contact.email),
        "phone":
            bool(contact.phone),
        "job_title":
            bool(contact.job_title),
        "organization":
            organization is not None,
    }

    identity_checks = [
        bool(contact.first_name),
        bool(contact.last_name),
    ]

    checks = (
        identity_checks
        + list(
            fields.values()
        )
    )

    missing_fields = [
        field
        for field, present
        in fields.items()
        if not present
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
        missing_fields=(
            missing_fields
        ),
    )


def build_provenance(
    contact: Contact,
    organization: (
        Organization
        | None
    ),
) -> Client720Provenance:
    return Client720Provenance(
        contact_source_type=(
            contact.source_type
        ),
        contact_source_reference=(
            contact.source_reference
        ),
        contact_collected_at=(
            contact.collected_at
        ),
        contact_last_verified_at=(
            contact.last_verified_at
        ),
        organization_source_type=(
            organization.source_type
            if organization
            else None
        ),
        organization_source_reference=(
            organization.source_reference
            if organization
            else None
        ),
        organization_collected_at=(
            organization.collected_at
            if organization
            else None
        ),
        organization_last_verified_at=(
            organization.last_verified_at
            if organization
            else None
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

    relations = list_contact_relations(
        db,
        contact,
    )

    return Client720Projection(
        contact=contact,
        organization=organization,
        relations=relations,
        affiliation_summary=(
            build_affiliation_summary(
                relations
            )
        ),
        data_quality=(
            build_data_quality(
                contact,
                organization,
            )
        ),
        provenance=(
            build_provenance(
                contact,
                organization,
            )
        ),
    )
