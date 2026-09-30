import json
from datetime import datetime, timezone

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.contact import Contact
from app.models.ingestion_record import IngestionRecord
from app.models.organization import Organization
from app.services.contact_normalization import (
    normalize_email,
    normalize_phone,
    normalize_text,
    normalize_url,
)
from app.services.identity_normalization import (
    build_contact_name_key,
    build_organization_name_key,
)
from app.services.organization_normalization import (
    normalize_organization_payload,
)


def json_dump(data: dict) -> str:
    return json.dumps(
        data,
        ensure_ascii=False,
        default=str,
    )


def create_ingestion_record(
    db: Session,
    *,
    entity_type: str,
    source_type: str,
    source_reference: str | None,
    status: str,
    raw_payload: dict,
    normalized_payload: dict | None = None,
    entity_id: str | None = None,
    candidate_entity_id: str | None = None,
    match_score: int | None = None,
    match_reason: str | None = None,
    error_message: str | None = None,
) -> IngestionRecord:
    record = IngestionRecord(
        entity_type=entity_type,
        source_type=source_type,
        source_reference=source_reference,
        status=status,
        entity_id=entity_id,
        candidate_entity_id=candidate_entity_id,
        match_score=match_score,
        match_reason=match_reason,
        raw_payload=json_dump(raw_payload),
        normalized_payload=(
            json_dump(normalized_payload)
            if normalized_payload is not None
            else None
        ),
        error_message=error_message,
    )

    db.add(record)
    db.flush()

    return record


def find_exact_contact(
    db: Session,
    *,
    email: str | None,
    phone: str | None,
) -> tuple[Contact | None, str | None]:
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
        return None, None

    contact = db.scalar(
        select(Contact).where(
            Contact.is_active.is_(True),
            or_(*conditions),
        )
    )

    if not contact:
        return None, None

    if email and contact.email == email:
        return contact, "same_email"

    if phone and contact.phone == phone:
        return contact, "same_phone"

    return contact, "exact_match"


def find_probable_contact(
    db: Session,
    *,
    normalized_name: str | None,
    organization_id: str | None,
) -> tuple[Contact | None, int | None, str | None]:
    if not normalized_name:
        return None, None, None

    candidates = db.scalars(
        select(Contact).where(
            Contact.is_active.is_(True),
            Contact.normalized_name
            == normalized_name,
        )
    ).all()

    if not candidates:
        return None, None, None

    if organization_id:
        for candidate in candidates:
            if (
                candidate.organization_id
                == organization_id
            ):
                return (
                    candidate,
                    90,
                    "same_name_same_organization",
                )

    return (
        candidates[0],
        80,
        "same_normalized_name",
    )


def ingest_contact(
    db: Session,
    payload,
) -> IngestionRecord:
    raw = payload.model_dump()

    first_name = normalize_text(
        payload.first_name
    )

    last_name = normalize_text(
        payload.last_name
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

    normalized_name = build_contact_name_key(
        first_name,
        last_name,
    )

    source_type = (
        normalize_text(
            payload.source_type
        )
        or "unknown"
    )

    source_reference = normalize_text(
        payload.source_reference
    )

    normalized = {
        "first_name": first_name,
        "last_name": last_name,
        "normalized_name": normalized_name,
        "job_title": normalize_text(
            payload.job_title
        ),
        "email": email,
        "phone": phone,
        "linkedin_url": linkedin_url,
        "decision_role": (
            normalize_text(
                payload.decision_role
            )
            or "unknown"
        ),
        "organization_id": (
            payload.organization_id
        ),
        "source_type": source_type,
        "source_reference": source_reference,
        "notes": normalize_text(
            payload.notes
        ),
    }

    exact, reason = find_exact_contact(
        db,
        email=email,
        phone=phone,
    )

    if exact:
        return create_ingestion_record(
            db,
            entity_type="contact",
            source_type=source_type,
            source_reference=source_reference,
            status="matched_existing",
            raw_payload=raw,
            normalized_payload=normalized,
            entity_id=exact.id,
            match_score=100,
            match_reason=reason,
        )

    probable, score, reason = (
        find_probable_contact(
            db,
            normalized_name=normalized_name,
            organization_id=(
                payload.organization_id
            ),
        )
    )

    if probable:
        return create_ingestion_record(
            db,
            entity_type="contact",
            source_type=source_type,
            source_reference=source_reference,
            status="requires_review",
            raw_payload=raw,
            normalized_payload=normalized,
            candidate_entity_id=probable.id,
            match_score=score,
            match_reason=reason,
        )

    if payload.organization_id:
        organization = db.get(
            Organization,
            payload.organization_id,
        )

        if not organization:
            return create_ingestion_record(
                db,
                entity_type="contact",
                source_type=source_type,
                source_reference=source_reference,
                status="rejected",
                raw_payload=raw,
                normalized_payload=normalized,
                error_message=(
                    "Organisation associée "
                    "introuvable."
                ),
            )

    contact = Contact(
        organization_id=(
            payload.organization_id
        ),
        first_name=first_name,
        last_name=last_name,
        normalized_name=normalized_name,
        job_title=normalized[
            "job_title"
        ],
        email=email,
        phone=phone,
        linkedin_url=linkedin_url,
        decision_role=normalized[
            "decision_role"
        ],
        source_type=source_type,
        source_reference=source_reference,
        verification_status="unverified",
        is_verified=False,
        is_active=True,
        notes=normalized["notes"],
        collected_at=datetime.now(
            timezone.utc
        ),
    )

    db.add(contact)
    db.flush()

    return create_ingestion_record(
        db,
        entity_type="contact",
        source_type=source_type,
        source_reference=source_reference,
        status="created",
        raw_payload=raw,
        normalized_payload=normalized,
        entity_id=contact.id,
    )


def find_exact_organization(
    db: Session,
    *,
    domain: str | None,
    email: str | None,
) -> tuple[
    Organization | None,
    str | None,
]:
    conditions = []

    if domain:
        conditions.append(
            Organization.domain == domain
        )

    if email:
        conditions.append(
            Organization.email == email
        )

    if not conditions:
        return None, None

    organization = db.scalar(
        select(Organization).where(
            Organization.is_active.is_(True),
            or_(*conditions),
        )
    )

    if not organization:
        return None, None

    if (
        domain
        and organization.domain == domain
    ):
        return organization, "same_domain"

    if (
        email
        and organization.email == email
    ):
        return organization, "same_email"

    return organization, "exact_match"


def find_probable_organization(
    db: Session,
    *,
    normalized_name: str | None,
    country: str | None,
    city: str | None,
) -> tuple[
    Organization | None,
    int | None,
    str | None,
]:
    if not normalized_name:
        return None, None, None

    candidates = db.scalars(
        select(Organization).where(
            Organization.is_active.is_(True),
            Organization.normalized_name
            == normalized_name,
        )
    ).all()

    if not candidates:
        return None, None, None

    for candidate in candidates:
        if (
            country
            and city
            and candidate.country
            and candidate.city
            and candidate.country.lower()
            == country.lower()
            and candidate.city.lower()
            == city.lower()
        ):
            return (
                candidate,
                90,
                "same_name_same_location",
            )

    return (
        candidates[0],
        80,
        "same_normalized_name",
    )


def ingest_organization(
    db: Session,
    payload,
) -> IngestionRecord:
    raw = payload.model_dump()

    normalized = (
        normalize_organization_payload(
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
    )

    normalized["normalized_name"] = (
        build_organization_name_key(
            normalized["name"]
        )
    )

    source_type = (
        normalize_text(
            payload.source_type
        )
        or "unknown"
    )

    source_reference = normalize_text(
        payload.source_reference
    )

    normalized[
        "organization_type"
    ] = (
        normalize_text(
            payload.organization_type
        )
        or "company"
    )

    normalized[
        "source_type"
    ] = source_type

    normalized[
        "source_reference"
    ] = source_reference

    normalized[
        "notes"
    ] = normalize_text(
        payload.notes
    )

    exact, reason = (
        find_exact_organization(
            db,
            domain=normalized[
                "domain"
            ],
            email=normalized[
                "email"
            ],
        )
    )

    if exact:
        return create_ingestion_record(
            db,
            entity_type="organization",
            source_type=source_type,
            source_reference=source_reference,
            status="matched_existing",
            raw_payload=raw,
            normalized_payload=normalized,
            entity_id=exact.id,
            match_score=100,
            match_reason=reason,
        )

    probable, score, reason = (
        find_probable_organization(
            db,
            normalized_name=normalized[
                "normalized_name"
            ],
            country=normalized[
                "country"
            ],
            city=normalized[
                "city"
            ],
        )
    )

    if probable:
        return create_ingestion_record(
            db,
            entity_type="organization",
            source_type=source_type,
            source_reference=source_reference,
            status="requires_review",
            raw_payload=raw,
            normalized_payload=normalized,
            candidate_entity_id=(
                probable.id
            ),
            match_score=score,
            match_reason=reason,
        )

    organization = Organization(
        name=normalized["name"],
        normalized_name=normalized[
            "normalized_name"
        ],
        legal_name=normalized[
            "legal_name"
        ],
        organization_type=normalized[
            "organization_type"
        ],
        industry=normalized[
            "industry"
        ],
        website=normalized[
            "website"
        ],
        domain=normalized[
            "domain"
        ],
        email=normalized[
            "email"
        ],
        phone=normalized[
            "phone"
        ],
        country=normalized[
            "country"
        ],
        city=normalized[
            "city"
        ],
        address=normalized[
            "address"
        ],
        source_type=source_type,
        source_reference=source_reference,
        verification_status="unverified",
        is_verified=False,
        is_active=True,
        notes=normalized["notes"],
        collected_at=datetime.now(
            timezone.utc
        ),
    )

    db.add(organization)
    db.flush()

    return create_ingestion_record(
        db,
        entity_type="organization",
        source_type=source_type,
        source_reference=source_reference,
        status="created",
        raw_payload=raw,
        normalized_payload=normalized,
        entity_id=organization.id,
    )
