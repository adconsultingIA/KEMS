import json
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.contact import Contact
from app.models.contact_merge import ContactMerge
from app.models.contact_organization import ContactOrganization
from app.models.lead import Lead
from app.models.opportunity import Opportunity


COPY_IF_MISSING_FIELDS = (
    "organization_id",
    "job_title",
    "email",
    "phone",
    "linkedin_url",
)


def build_contact_snapshot(
    contact: Contact,
) -> str:
    data = {
        "id": contact.id,
        "organization_id": contact.organization_id,
        "first_name": contact.first_name,
        "last_name": contact.last_name,
        "normalized_name": contact.normalized_name,
        "job_title": contact.job_title,
        "email": contact.email,
        "phone": contact.phone,
        "linkedin_url": contact.linkedin_url,
        "decision_role": contact.decision_role,
        "source_type": contact.source_type,
        "source_reference": contact.source_reference,
        "verification_status": contact.verification_status,
        "is_verified": contact.is_verified,
        "is_active": contact.is_active,
        "notes": contact.notes,
    }

    return json.dumps(
        data,
        ensure_ascii=False,
        default=str,
    )


def enrich_canonical_contact(
    canonical: Contact,
    duplicate: Contact,
) -> list[str]:
    copied_fields = []

    for field in COPY_IF_MISSING_FIELDS:
        canonical_value = getattr(
            canonical,
            field,
        )

        duplicate_value = getattr(
            duplicate,
            field,
        )

        if (
            canonical_value in (None, "")
            and duplicate_value not in (None, "")
        ):
            setattr(
                canonical,
                field,
                duplicate_value,
            )

            copied_fields.append(field)

    if (
        canonical.decision_role == "unknown"
        and duplicate.decision_role
        and duplicate.decision_role != "unknown"
    ):
        canonical.decision_role = (
            duplicate.decision_role
        )

        copied_fields.append(
            "decision_role"
        )

    if (
        not canonical.is_verified
        and duplicate.is_verified
    ):
        canonical.is_verified = True
        canonical.verification_status = (
            duplicate.verification_status
        )
        canonical.last_verified_at = (
            duplicate.last_verified_at
        )

        copied_fields.append(
            "verification"
        )

    return copied_fields


def clear_primary_links(
    db: Session,
    contact_id: str,
    exclude_link_id: str | None = None,
):
    statement = select(
        ContactOrganization
    ).where(
        ContactOrganization.contact_id == contact_id,
        ContactOrganization.is_active.is_(True),
        ContactOrganization.is_primary.is_(True),
    )

    if exclude_link_id:
        statement = statement.where(
            ContactOrganization.id
            != exclude_link_id
        )

    links = db.scalars(
        statement
    ).all()

    for link in links:
        link.is_primary = False


def transfer_contact_relationships(
    db: Session,
    canonical: Contact,
    duplicate: Contact,
) -> int:
    links = db.scalars(
        select(ContactOrganization).where(
            ContactOrganization.contact_id
            == duplicate.id
        )
    ).all()

    transferred = 0

    for link in links:
        existing = db.scalar(
            select(ContactOrganization).where(
                ContactOrganization.contact_id
                == canonical.id,
                ContactOrganization.organization_id
                == link.organization_id,
                ContactOrganization.is_active.is_(
                    True
                ),
            )
        )

        if (
            existing
            and link.is_active
        ):
            if (
                not existing.job_title
                and link.job_title
            ):
                existing.job_title = link.job_title

            if (
                not existing.relationship_role
                and link.relationship_role
            ):
                existing.relationship_role = (
                    link.relationship_role
                )

            if (
                existing.started_at is None
                and link.started_at is not None
            ):
                existing.started_at = (
                    link.started_at
                )

            if link.is_primary:
                clear_primary_links(
                    db,
                    canonical.id,
                    exclude_link_id=existing.id,
                )

                existing.is_primary = True

                canonical.organization_id = (
                    existing.organization_id
                )

            link.is_active = False
            link.is_primary = False

            if link.ended_at is None:
                link.ended_at = date.today()

        else:
            link.contact_id = canonical.id

            if (
                link.is_active
                and link.is_primary
            ):
                clear_primary_links(
                    db,
                    canonical.id,
                    exclude_link_id=link.id,
                )

                canonical.organization_id = (
                    link.organization_id
                )

        transferred += 1

    return transferred


def transfer_leads(
    db: Session,
    canonical: Contact,
    duplicate: Contact,
) -> int:
    leads = db.scalars(
        select(Lead).where(
            Lead.contact_id == duplicate.id
        )
    ).all()

    for lead in leads:
        lead.contact_id = canonical.id

    return len(leads)


def transfer_opportunities(
    db: Session,
    canonical: Contact,
    duplicate: Contact,
) -> int:
    opportunities = db.scalars(
        select(Opportunity).where(
            Opportunity.primary_contact_id
            == duplicate.id
        )
    ).all()

    for opportunity in opportunities:
        opportunity.primary_contact_id = (
            canonical.id
        )

    return len(opportunities)


def merge_contacts(
    db: Session,
    canonical: Contact,
    duplicate: Contact,
    reason: str | None,
) -> ContactMerge:
    snapshot = build_contact_snapshot(
        duplicate
    )

    copied_fields = enrich_canonical_contact(
        canonical,
        duplicate,
    )

    transferred_relationships = (
        transfer_contact_relationships(
            db,
            canonical,
            duplicate,
        )
    )

    transferred_leads = transfer_leads(
        db,
        canonical,
        duplicate,
    )

    transferred_opportunities = (
        transfer_opportunities(
            db,
            canonical,
            duplicate,
        )
    )

    duplicate.is_active = False
    duplicate.is_primary = False
    duplicate.merged_into_contact_id = (
        canonical.id
    )

    merge = ContactMerge(
        canonical_contact_id=canonical.id,
        duplicate_contact_id=duplicate.id,
        reason=reason,
        duplicate_snapshot=snapshot,
        copied_fields=json.dumps(
            copied_fields,
            ensure_ascii=False,
        ),
        transferred_relationships=(
            transferred_relationships
        ),
        transferred_leads=transferred_leads,
        transferred_opportunities=(
            transferred_opportunities
        ),
    )

    db.add(merge)
    db.flush()

    return merge
