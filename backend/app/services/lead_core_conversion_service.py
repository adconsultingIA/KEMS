from datetime import (
    datetime,
    timezone,
)

from fastapi import HTTPException
from sqlalchemy import (
    or_,
    select,
)
from sqlalchemy.orm import Session

from app.models.contact import Contact
from app.models.lead import Lead
from app.models.organization import (
    Organization,
)
from app.services.contact_normalization import (
    normalize_email,
    normalize_phone,
    normalize_text,
)
from app.services.identity_normalization import (
    build_contact_name_key,
    build_organization_name_key,
)
from app.services.organization_normalization import (
    normalize_organization_payload,
)


def utcnow():
    return datetime.now(
        timezone.utc
    )


def ensure_lead_convertible(
    lead: Lead,
):
    if (
        lead.status
        != "qualified"
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                "Seul un lead qualifié "
                "peut être converti vers Core."
            ),
        )


def find_contact_match(
    db: Session,
    *,
    email: str | None,
    phone: str | None,
) -> Contact | None:
    conditions = []

    if email:
        conditions.append(
            Contact.email
            == email
        )

    if phone:
        conditions.append(
            Contact.phone
            == phone
        )

    if not conditions:
        return None

    return db.scalar(
        select(
            Contact
        ).where(
            Contact.is_active
            .is_(True),
            Contact.merged_into_contact_id
            .is_(None),
            or_(
                *conditions
            ),
        )
    )


def find_organization_match(
    db: Session,
    *,
    name: str | None,
    email: str | None,
) -> Organization | None:
    conditions = []

    normalized_name = (
        build_organization_name_key(
            name
        )
        if name
        else None
    )

    if normalized_name:
        conditions.append(
            Organization.normalized_name
            == normalized_name
        )

    if email:
        conditions.append(
            Organization.email
            == email
        )

    if not conditions:
        return None

    return db.scalar(
        select(
            Organization
        ).where(
            Organization.is_active
            .is_(True),
            or_(
                *conditions
            ),
        )
    )


def create_core_contact(
    db: Session,
    *,
    lead: Lead,
    organization_id: str | None,
) -> Contact:
    first_name = normalize_text(
        lead.first_name
    )

    last_name = normalize_text(
        lead.last_name
    )

    if (
        not first_name
        or not last_name
    ):
        raise HTTPException(
            status_code=422,
            detail=(
                "La conversion vers Contact Core "
                "nécessite un prénom et un nom."
            ),
        )

    email = normalize_email(
        lead.email
    )

    phone = normalize_phone(
        lead.phone
    )

    contact = Contact(
        organization_id=(
            organization_id
        ),
        first_name=first_name,
        last_name=last_name,
        normalized_name=(
            build_contact_name_key(
                first_name,
                last_name,
            )
        ),
        email=email,
        phone=phone,
        decision_role="unknown",
        source_type="growth_engine",
        source_reference=lead.id,
        verification_status=(
            "unverified"
        ),
        is_primary=False,
        is_verified=False,
        is_active=True,
        collected_at=utcnow(),
        notes=(
            "Créé depuis Growth Engine "
            f"à partir du lead {lead.id}."
        ),
    )

    db.add(
        contact
    )

    db.flush()

    return contact


def create_core_organization(
    db: Session,
    *,
    lead: Lead,
) -> Organization:
    company_name = normalize_text(
        lead.company_name
    )

    if not company_name:
        raise HTTPException(
            status_code=422,
            detail=(
                "La conversion d'un lead B2B "
                "nécessite un nom d'entreprise."
            ),
        )

    normalized = (
        normalize_organization_payload(
            name=company_name,
            legal_name=None,
            industry=None,
            website=None,
            email=lead.email,
            phone=lead.phone,
            country=lead.country,
            city=lead.city,
            address=None,
        )
    )

    organization = Organization(
        name=normalized["name"],
        normalized_name=(
            build_organization_name_key(
                normalized["name"]
            )
        ),
        legal_name=None,
        organization_type="company",
        industry=None,
        website=None,
        domain=normalized["domain"],
        email=normalized["email"],
        phone=normalized["phone"],
        country=normalized["country"],
        city=normalized["city"],
        address=None,
        source_type="growth_engine",
        source_reference=lead.id,
        verification_status=(
            "unverified"
        ),
        is_verified=False,
        is_active=True,
        collected_at=utcnow(),
        notes=(
            "Créée depuis Growth Engine "
            f"à partir du lead {lead.id}."
        ),
    )

    db.add(
        organization
    )

    db.flush()

    return organization


def convert_lead_to_core(
    db: Session,
    *,
    lead: Lead,
) -> dict:
    ensure_lead_convertible(
        lead
    )

    contact = None
    organization = None

    contact_created = False
    organization_created = False

    # --------------------------------------------------------
    # Existing links are respected first.
    # --------------------------------------------------------

    if lead.contact_id:
        contact = db.get(
            Contact,
            lead.contact_id,
        )

        if not contact:
            raise HTTPException(
                status_code=409,
                detail=(
                    "Le contact Core lié au lead "
                    "n'existe plus."
                ),
            )

    if lead.organization_id:
        organization = db.get(
            Organization,
            lead.organization_id,
        )

        if not organization:
            raise HTTPException(
                status_code=409,
                detail=(
                    "L'organisation Core liée "
                    "au lead n'existe plus."
                ),
            )

    # --------------------------------------------------------
    # B2B: organization is the primary Core entity.
    # --------------------------------------------------------

    if (
        lead.lead_type
        == "b2b"
        and organization is None
    ):
        company_name = normalize_text(
            lead.company_name
        )

        if not company_name:
            raise HTTPException(
                status_code=422,
                detail=(
                    "Un lead B2B doit avoir "
                    "un nom d'entreprise avant "
                    "conversion vers Core."
                ),
            )

        organization_email = (
            normalize_email(
                lead.email
            )
        )

        organization = (
            find_organization_match(
                db,
                name=company_name,
                email=organization_email,
            )
        )

        if organization is None:
            organization = (
                create_core_organization(
                    db,
                    lead=lead,
                )
            )

            organization_created = True

        lead.organization_id = (
            organization.id
        )

    # --------------------------------------------------------
    # Contact match.
    #
    # B2C always requires a Contact.
    # B2B creates/links a Contact only when a person's
    # first_name + last_name are actually known.
    # --------------------------------------------------------

    should_have_contact = (
        lead.lead_type
        == "b2c"
        or (
            bool(
                normalize_text(
                    lead.first_name
                )
            )
            and bool(
                normalize_text(
                    lead.last_name
                )
            )
        )
    )

    if (
        should_have_contact
        and contact is None
    ):
        email = normalize_email(
            lead.email
        )

        phone = normalize_phone(
            lead.phone
        )

        contact = (
            find_contact_match(
                db,
                email=email,
                phone=phone,
            )
        )

        if contact is None:
            contact = (
                create_core_contact(
                    db,
                    lead=lead,
                    organization_id=(
                        organization.id
                        if organization
                        else None
                    ),
                )
            )

            contact_created = True

        lead.contact_id = (
            contact.id
        )

    # --------------------------------------------------------
    # B2C conversion must end with a Core Contact.
    # --------------------------------------------------------

    if (
        lead.lead_type
        == "b2c"
        and contact is None
    ):
        raise HTTPException(
            status_code=422,
            detail=(
                "La conversion B2C doit "
                "aboutir à un Contact Core."
            ),
        )

    # --------------------------------------------------------
    # B2B conversion must end with an Organization.
    # --------------------------------------------------------

    if (
        lead.lead_type
        == "b2b"
        and organization is None
    ):
        raise HTTPException(
            status_code=422,
            detail=(
                "La conversion B2B doit "
                "aboutir à une Organisation Core."
            ),
        )

    lead.core_converted_at = (
        lead.core_converted_at
        or utcnow()
    )

    db.flush()

    return {
        "lead": lead,
        "contact": contact,
        "organization":
            organization,
        "contact_created":
            contact_created,
        "organization_created":
            organization_created,
    }
