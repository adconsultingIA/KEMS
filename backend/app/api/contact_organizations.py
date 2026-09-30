from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.contact import Contact
from app.models.contact_organization import ContactOrganization
from app.models.organization import Organization
from app.schemas.contact_organization import (
    ContactOrganizationCreate,
    ContactOrganizationEnd,
    ContactOrganizationResponse,
    ContactOrganizationUpdate,
)
from app.services.contact_normalization import normalize_text


router = APIRouter(
    prefix="/api/v1/core/contact-organizations",
    tags=["KEMS Core - Contact Organizations"],
)


def get_link_or_404(
    db: Session,
    link_id: str,
) -> ContactOrganization:
    link = db.get(
        ContactOrganization,
        link_id,
    )

    if not link:
        raise HTTPException(
            status_code=404,
            detail="Relation contact-organisation introuvable.",
        )

    return link


def ensure_contact_exists(
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
            detail="Contact introuvable.",
        )

    return contact


def ensure_organization_exists(
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


def clear_other_primary_links(
    db: Session,
    contact_id: str,
    exclude_link_id: str | None = None,
):
    statement = select(
        ContactOrganization
    ).where(
        ContactOrganization.contact_id == contact_id,
        ContactOrganization.is_primary.is_(True),
        ContactOrganization.is_active.is_(True),
    )

    if exclude_link_id:
        statement = statement.where(
            ContactOrganization.id != exclude_link_id
        )

    links = db.scalars(
        statement
    ).all()

    for link in links:
        link.is_primary = False


def sync_legacy_primary_organization(
    db: Session,
    contact: Contact,
):
    primary = db.scalar(
        select(ContactOrganization).where(
            ContactOrganization.contact_id == contact.id,
            ContactOrganization.is_primary.is_(True),
            ContactOrganization.is_active.is_(True),
        )
    )

    contact.organization_id = (
        primary.organization_id
        if primary
        else None
    )


@router.post(
    "",
    response_model=ContactOrganizationResponse,
    status_code=201,
)
def create_contact_organization(
    payload: ContactOrganizationCreate,
    db: Session = Depends(get_db),
):
    contact = ensure_contact_exists(
        db,
        payload.contact_id,
    )

    ensure_organization_exists(
        db,
        payload.organization_id,
    )

    existing = db.scalar(
        select(ContactOrganization).where(
            ContactOrganization.contact_id == payload.contact_id,
            ContactOrganization.organization_id
            == payload.organization_id,
            ContactOrganization.is_active.is_(True),
        )
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail=(
                "Une relation active existe déjà "
                "entre ce contact et cette organisation."
            ),
        )

    if payload.is_primary:
        clear_other_primary_links(
            db,
            payload.contact_id,
        )

    link = ContactOrganization(
        contact_id=payload.contact_id,
        organization_id=payload.organization_id,
        relationship_type=normalize_text(
            payload.relationship_type
        ) or "employee",
        job_title=normalize_text(
            payload.job_title
        ),
        relationship_role=normalize_text(
            payload.relationship_role
        ),
        is_primary=payload.is_primary,
        is_active=True,
        started_at=payload.started_at,
    )

    db.add(link)
    db.flush()

    if payload.is_primary:
        contact.organization_id = payload.organization_id

    db.commit()
    db.refresh(link)

    return link


@router.get(
    "",
    response_model=list[ContactOrganizationResponse],
)
def list_contact_organizations(
    contact_id: str | None = Query(
        default=None
    ),
    organization_id: str | None = Query(
        default=None
    ),
    active_only: bool = Query(
        default=True
    ),
    db: Session = Depends(get_db),
):
    statement = select(
        ContactOrganization
    )

    if contact_id:
        statement = statement.where(
            ContactOrganization.contact_id
            == contact_id
        )

    if organization_id:
        statement = statement.where(
            ContactOrganization.organization_id
            == organization_id
        )

    if active_only:
        statement = statement.where(
            ContactOrganization.is_active.is_(True)
        )

    statement = statement.order_by(
        ContactOrganization.is_primary.desc(),
        ContactOrganization.created_at.desc(),
    )

    return db.scalars(
        statement
    ).all()


@router.get(
    "/{link_id}",
    response_model=ContactOrganizationResponse,
)
def get_contact_organization(
    link_id: str,
    db: Session = Depends(get_db),
):
    return get_link_or_404(
        db,
        link_id,
    )


@router.patch(
    "/{link_id}",
    response_model=ContactOrganizationResponse,
)
def update_contact_organization(
    link_id: str,
    payload: ContactOrganizationUpdate,
    db: Session = Depends(get_db),
):
    link = get_link_or_404(
        db,
        link_id,
    )

    contact = ensure_contact_exists(
        db,
        link.contact_id,
    )

    data = payload.model_dump(
        exclude_unset=True
    )

    for field in (
        "relationship_type",
        "job_title",
        "relationship_role",
    ):
        if field in data:
            data[field] = normalize_text(
                data[field]
            )

    if data.get("is_primary") is True:
        clear_other_primary_links(
            db,
            link.contact_id,
            exclude_link_id=link.id,
        )

    if data.get("is_active") is False:
        data["is_primary"] = False

        if data.get("ended_at") is None:
            data["ended_at"] = date.today()

    for key, value in data.items():
        setattr(
            link,
            key,
            value,
        )

    db.flush()

    sync_legacy_primary_organization(
        db,
        contact,
    )

    db.commit()
    db.refresh(link)

    return link


@router.post(
    "/{link_id}/end",
    response_model=ContactOrganizationResponse,
)
def end_contact_organization(
    link_id: str,
    payload: ContactOrganizationEnd,
    db: Session = Depends(get_db),
):
    link = get_link_or_404(
        db,
        link_id,
    )

    contact = ensure_contact_exists(
        db,
        link.contact_id,
    )

    if not link.is_active:
        raise HTTPException(
            status_code=400,
            detail="Cette relation est déjà terminée.",
        )

    link.is_active = False
    link.is_primary = False
    link.ended_at = (
        payload.ended_at
        or date.today()
    )

    db.flush()

    sync_legacy_primary_organization(
        db,
        contact,
    )

    db.commit()
    db.refresh(link)

    return link
