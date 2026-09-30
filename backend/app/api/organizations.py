from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.organization import Organization
from app.schemas.organization import (
    OrganizationCreate,
    OrganizationResponse,
    OrganizationUpdate,
)
from app.services.contact_normalization import normalize_text
from app.services.identity_normalization import (
    build_organization_name_key,
)
from app.services.organization_normalization import (
    normalize_organization_payload,
)


router = APIRouter(
    prefix="/api/v1/core/organizations",
    tags=["KEMS Core - Organizations"],
)


def get_organization_or_404(
    db: Session,
    organization_id: str,
) -> Organization:
    organization = db.get(
        Organization,
        organization_id,
    )

    if not organization:
        raise HTTPException(
            status_code=404,
            detail="Organisation introuvable.",
        )

    return organization


def ensure_no_duplicate(
    db: Session,
    *,
    name: str | None,
    domain: str | None,
    email: str | None,
    exclude_organization_id: str | None = None,
):
    conditions = []

    if domain:
        conditions.append(
            Organization.domain == domain
        )

    if email:
        conditions.append(
            Organization.email == email
        )

    if name:
        conditions.append(
            Organization.name.ilike(name)
        )

    if not conditions:
        return

    statement = select(
        Organization
    ).where(
        Organization.is_active.is_(True),
        or_(*conditions),
    )

    if exclude_organization_id:
        statement = statement.where(
            Organization.id
            != exclude_organization_id
        )

    duplicate = db.scalar(statement)

    if duplicate:
        raise HTTPException(
            status_code=409,
            detail=(
                "Une organisation active avec "
                "le même nom, domaine ou email "
                "existe déjà."
            ),
        )


@router.post(
    "",
    response_model=OrganizationResponse,
    status_code=201,
)
def create_organization(
    payload: OrganizationCreate,
    db: Session = Depends(get_db),
):
    normalized = normalize_organization_payload(
        name=payload.name,
        legal_name=payload.legal_name,
        industry=payload.industry,
        website=payload.website,
        email=payload.email,
        phone=payload.phone,
        country=payload.country,
        city=payload.city,
        address=payload.address,
    )

    ensure_no_duplicate(
        db,
        name=normalized["name"],
        domain=normalized["domain"],
        email=normalized["email"],
    )

    organization = Organization(
        name=normalized["name"],
        normalized_name=build_organization_name_key(
            normalized["name"]
        ),
        legal_name=normalized["legal_name"],
        organization_type=normalize_text(
            payload.organization_type
        ) or "company",
        industry=normalized["industry"],
        website=normalized["website"],
        domain=normalized["domain"],
        email=normalized["email"],
        phone=normalized["phone"],
        country=normalized["country"],
        city=normalized["city"],
        address=normalized["address"],
        source_type=normalize_text(
            payload.source_type
        ) or "manual",
        source_reference=normalize_text(
            payload.source_reference
        ),
        verification_status="unverified",
        is_verified=False,
        is_active=True,
        notes=normalize_text(
            payload.notes
        ),
        collected_at=datetime.now(
            timezone.utc
        ),
    )

    db.add(organization)
    db.commit()
    db.refresh(organization)

    return organization


@router.get(
    "",
    response_model=list[OrganizationResponse],
)
def list_organizations(
    search: str | None = Query(
        default=None
    ),
    country: str | None = Query(
        default=None
    ),
    industry: str | None = Query(
        default=None
    ),
    active_only: bool = Query(
        default=True
    ),
    db: Session = Depends(get_db),
):
    statement = select(
        Organization
    )

    if active_only:
        statement = statement.where(
            Organization.is_active.is_(True)
        )

    if country:
        statement = statement.where(
            Organization.country.ilike(
                country
            )
        )

    if industry:
        statement = statement.where(
            Organization.industry.ilike(
                industry
            )
        )

    if search:
        term = f"%{search.strip()}%"

        statement = statement.where(
            or_(
                Organization.name.ilike(
                    term
                ),
                Organization.legal_name.ilike(
                    term
                ),
                Organization.domain.ilike(
                    term
                ),
                Organization.email.ilike(
                    term
                ),
                Organization.city.ilike(
                    term
                ),
            )
        )

    statement = statement.order_by(
        Organization.name.asc()
    )

    return db.scalars(
        statement
    ).all()


@router.get(
    "/{organization_id}",
    response_model=OrganizationResponse,
)
def get_organization(
    organization_id: str,
    db: Session = Depends(get_db),
):
    return get_organization_or_404(
        db,
        organization_id,
    )


@router.patch(
    "/{organization_id}",
    response_model=OrganizationResponse,
)
def update_organization(
    organization_id: str,
    payload: OrganizationUpdate,
    db: Session = Depends(get_db),
):
    organization = get_organization_or_404(
        db,
        organization_id,
    )

    data = payload.model_dump(
        exclude_unset=True
    )

    normalization_fields = {
        "name",
        "legal_name",
        "industry",
        "website",
        "email",
        "phone",
        "country",
        "city",
        "address",
    }

    if normalization_fields.intersection(
        data.keys()
    ):
        normalized = normalize_organization_payload(
            name=data.get(
                "name",
                organization.name,
            ),
            legal_name=data.get(
                "legal_name",
                organization.legal_name,
            ),
            industry=data.get(
                "industry",
                organization.industry,
            ),
            website=data.get(
                "website",
                organization.website,
            ),
            email=data.get(
                "email",
                organization.email,
            ),
            phone=data.get(
                "phone",
                organization.phone,
            ),
            country=data.get(
                "country",
                organization.country,
            ),
            city=data.get(
                "city",
                organization.city,
            ),
            address=data.get(
                "address",
                organization.address,
            ),
        )

        for key, value in normalized.items():
            data[key] = value

        data["normalized_name"] = (
            build_organization_name_key(
                normalized["name"]
            )
        )

    for field in (
        "organization_type",
        "source_type",
        "source_reference",
        "notes",
    ):
        if field in data:
            data[field] = normalize_text(
                data[field]
            )

    ensure_no_duplicate(
        db,
        name=data.get(
            "name",
            organization.name,
        ),
        domain=data.get(
            "domain",
            organization.domain,
        ),
        email=data.get(
            "email",
            organization.email,
        ),
        exclude_organization_id=organization.id,
    )

    if data.get(
        "is_verified"
    ) is True:
        data["verification_status"] = "verified"
        organization.last_verified_at = datetime.now(
            timezone.utc
        )

    if data.get(
        "verification_status"
    ) == "verified":
        data["is_verified"] = True
        organization.last_verified_at = datetime.now(
            timezone.utc
        )

    for key, value in data.items():
        setattr(
            organization,
            key,
            value,
        )

    db.commit()
    db.refresh(organization)

    return organization
