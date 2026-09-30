from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.contact import Contact
from app.models.organization import Organization
from app.schemas.contact import (
    ContactCreate,
    ContactResponse,
    ContactUpdate,
)
from app.services.identity_normalization import (
    build_contact_name_key,
)
from app.services.contact_normalization import (
    normalize_email,
    normalize_phone,
    normalize_text,
    normalize_url,
)


router = APIRouter(
    prefix="/api/v1/core/contacts",
    tags=["KEMS Core - Contacts"],
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
            detail="Contact introuvable.",
        )

    return contact


def ensure_organization_exists(
    db: Session,
    organization_id: str | None,
):
    if not organization_id:
        return

    organization = db.get(
        Organization,
        organization_id,
    )

    if not organization:
        raise HTTPException(
            status_code=404,
            detail="Organisation introuvable.",
        )


def ensure_no_duplicate(
    db: Session,
    email: str | None,
    phone: str | None,
    exclude_contact_id: str | None = None,
):
    conditions = []

    if email:
        conditions.append(
            Contact.email == email
        )

    if phone:
        conditions.append(
            Contact.phone == phone
        )

    if not conditions:
        return

    statement = select(Contact).where(
        Contact.is_active.is_(True),
        or_(*conditions),
    )

    if exclude_contact_id:
        statement = statement.where(
            Contact.id != exclude_contact_id
        )

    duplicate = db.scalar(statement)

    if duplicate:
        raise HTTPException(
            status_code=409,
            detail=(
                "Un contact actif avec le même "
                "email ou téléphone existe déjà."
            ),
        )


@router.post(
    "",
    response_model=ContactResponse,
    status_code=201,
)
def create_contact(
    payload: ContactCreate,
    db: Session = Depends(get_db),
):
    ensure_organization_exists(
        db,
        payload.organization_id,
    )

    email = normalize_email(
        payload.email
    )

    phone = normalize_phone(
        payload.phone
    )

    linkedin_url = normalize_url(
        payload.linkedin_url
    )

    ensure_no_duplicate(
        db,
        email,
        phone,
    )

    contact = Contact(
        organization_id=payload.organization_id,
        first_name=normalize_text(
            payload.first_name
        ),
        last_name=normalize_text(
            payload.last_name
        ),
        normalized_name=build_contact_name_key(
            normalize_text(payload.first_name),
            normalize_text(payload.last_name),
        ),
        job_title=normalize_text(
            payload.job_title
        ),
        email=email,
        phone=phone,
        linkedin_url=linkedin_url,
        decision_role=normalize_text(
            payload.decision_role
        ) or "unknown",
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

    db.add(contact)
    db.commit()
    db.refresh(contact)

    return contact


@router.get(
    "",
    response_model=list[ContactResponse],
)
def list_contacts(
    search: str | None = Query(
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
    statement = select(Contact)

    if active_only:
        statement = statement.where(
            Contact.is_active.is_(True)
        )

    if organization_id:
        statement = statement.where(
            Contact.organization_id
            == organization_id
        )

    if search:
        term = f"%{search.strip()}%"

        statement = statement.where(
            or_(
                Contact.first_name.ilike(term),
                Contact.last_name.ilike(term),
                Contact.email.ilike(term),
                Contact.phone.ilike(term),
                Contact.job_title.ilike(term),
            )
        )

    statement = statement.order_by(
        Contact.last_name.asc(),
        Contact.first_name.asc(),
    )

    return db.scalars(
        statement
    ).all()


@router.get(
    "/{contact_id}",
    response_model=ContactResponse,
)
def get_contact(
    contact_id: str,
    db: Session = Depends(get_db),
):
    return get_contact_or_404(
        db,
        contact_id,
    )


@router.patch(
    "/{contact_id}",
    response_model=ContactResponse,
)
def update_contact(
    contact_id: str,
    payload: ContactUpdate,
    db: Session = Depends(get_db),
):
    contact = get_contact_or_404(
        db,
        contact_id,
    )

    data = payload.model_dump(
        exclude_unset=True
    )

    if "organization_id" in data:
        ensure_organization_exists(
            db,
            data["organization_id"],
        )

    if "email" in data:
        data["email"] = normalize_email(
            data["email"]
        )

    if "phone" in data:
        data["phone"] = normalize_phone(
            data["phone"]
        )

    if "linkedin_url" in data:
        data["linkedin_url"] = normalize_url(
            data["linkedin_url"]
        )

    for field in (
        "first_name",
        "last_name",
        "job_title",
        "decision_role",
        "source_type",
        "source_reference",
        "notes",
    ):
        if field in data:
            data[field] = normalize_text(
                data[field]
            )

    if (
        "first_name" in data
        or "last_name" in data
    ):
        data["normalized_name"] = (
            build_contact_name_key(
                data.get(
                    "first_name",
                    contact.first_name,
                ),
                data.get(
                    "last_name",
                    contact.last_name,
                ),
            )
        )

    email = data.get(
        "email",
        contact.email,
    )

    phone = data.get(
        "phone",
        contact.phone,
    )

    ensure_no_duplicate(
        db,
        email,
        phone,
        exclude_contact_id=contact.id,
    )

    if data.get(
        "is_verified"
    ) is True:
        data["verification_status"] = "verified"
        contact.last_verified_at = datetime.now(
            timezone.utc
        )

    if data.get(
        "verification_status"
    ) == "verified":
        data["is_verified"] = True
        contact.last_verified_at = datetime.now(
            timezone.utc
        )

    for key, value in data.items():
        setattr(
            contact,
            key,
            value,
        )

    db.commit()
    db.refresh(contact)

    return contact
