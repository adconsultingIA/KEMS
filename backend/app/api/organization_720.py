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
from app.models.action import Action
from app.models.contact import Contact
from app.models.lead import Lead
from app.models.opportunity import Opportunity
from app.models.contact_organization import (
    ContactOrganization,
)
from app.models.organization import (
    Organization,
)
from app.schemas.auth import (
    AuthContextResponse,
)
from app.schemas.organization_720 import (
    Organization720BusinessContextSummary,
    Organization720BusinessSummary,
    Organization720CommercialSummary,
    Organization720ContactRelation,
    Organization720ContactSummary,
    Organization720DataQuality,
    Organization720Projection,
    Organization720Provenance,
)


router = APIRouter(
    prefix="/api/v1/core/organizations",
    tags=[
        "KEMS Core - Organization 720"
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
                "La projection "
                "Organization 720° "
                "est réservée aux "
                "utilisateurs internes."
            ),
        )


def get_organization_or_404(
    db: Session,
    organization_id: str,
) -> Organization:
    organization = db.get(
        Organization,
        organization_id,
    )

    if (
        not organization
        or not organization.is_active
    ):
        raise HTTPException(
            status_code=404,
            detail=(
                "Organisation introuvable."
            ),
        )

    return organization


def list_organization_contacts(
    db: Session,
    organization: Organization,
) -> list[
    Organization720ContactRelation
]:
    links = db.scalars(
        select(
            ContactOrganization
        )
        .where(
            ContactOrganization.organization_id
            == organization.id
        )
        .order_by(
            ContactOrganization.is_active
            .desc(),
            ContactOrganization.is_primary
            .desc(),
            ContactOrganization.created_at
            .asc(),
        )
    ).all()

    relations: list[
        Organization720ContactRelation
    ] = []

    linked_contact_ids: set[str] = set()

    for link in links:
        contact = db.get(
            Contact,
            link.contact_id,
        )

        if not contact:
            continue

        linked_contact_ids.add(
            contact.id
        )

        relations.append(
            Organization720ContactRelation(
                contact=contact,
                relationship=link,
            )
        )

    # Compatibilité avec les anciennes
    # données qui utilisent encore
    # Contact.organization_id sans entrée
    # ContactOrganization.
    legacy_contacts = db.scalars(
        select(
            Contact
        )
        .where(
            Contact.organization_id
            == organization.id,
            Contact.is_active.is_(
                True
            ),
        )
        .order_by(
            Contact.last_name.asc(),
            Contact.first_name.asc(),
        )
    ).all()

    for contact in legacy_contacts:
        if (
            contact.id
            in linked_contact_ids
        ):
            continue

        relations.append(
            Organization720ContactRelation(
                contact=contact,
                relationship=None,
            )
        )

    return relations


def build_contact_summary(
    relations: list[
        Organization720ContactRelation
    ],
) -> Organization720ContactSummary:
    active_relations = 0
    historical_relations = 0
    decision_makers = 0

    for relation in relations:
        link = (
            relation.relationship
        )

        if link is None:
            if relation.contact.is_active:
                active_relations += 1
        elif link.is_active:
            active_relations += 1
        else:
            historical_relations += 1

        decision_role = (
            (
                link.relationship_role
                if link
                else None
            )
            or relation.contact
            .decision_role
        )

        if decision_role in {
            "decision_maker",
            "decider",
            "owner",
            "director",
        }:
            decision_makers += 1

    return (
        Organization720ContactSummary(
            total_contacts=len(
                relations
            ),
            active_relations=(
                active_relations
            ),
            historical_relations=(
                historical_relations
            ),
            decision_makers=(
                decision_makers
            ),
            has_multiple_active_contacts=(
                active_relations
                > 1
            ),
        )
    )


def build_data_quality(
    organization: Organization,
) -> Organization720DataQuality:
    fields = {
        "legal_name":
            bool(
                organization.legal_name
            ),
        "industry":
            bool(
                organization.industry
            ),
        "website":
            bool(
                organization.website
                or organization.domain
            ),
        "email":
            bool(
                organization.email
            ),
        "phone":
            bool(
                organization.phone
            ),
        "country":
            bool(
                organization.country
            ),
        "city":
            bool(
                organization.city
            ),
        "address":
            bool(
                organization.address
            ),
    }

    base_checks = [
        bool(
            organization.name
        ),
        bool(
            organization
            .organization_type
        ),
    ]

    checks = (
        base_checks
        + list(
            fields.values()
        )
    )

    completeness_score = round(
        sum(
            1
            for check in checks
            if check
        )
        / len(checks)
        * 100
    )

    missing_fields = [
        field
        for field, present
        in fields.items()
        if not present
    ]

    return (
        Organization720DataQuality(
            verification_status=(
                organization
                .verification_status
            ),
            is_verified=(
                organization
                .is_verified
            ),
            has_legal_name=(
                fields[
                    "legal_name"
                ]
            ),
            has_industry=(
                fields[
                    "industry"
                ]
            ),
            has_website=(
                fields[
                    "website"
                ]
            ),
            has_email=(
                fields[
                    "email"
                ]
            ),
            has_phone=(
                fields[
                    "phone"
                ]
            ),
            has_country=(
                fields[
                    "country"
                ]
            ),
            has_city=(
                fields[
                    "city"
                ]
            ),
            has_address=(
                fields[
                    "address"
                ]
            ),
            completeness_score=(
                completeness_score
            ),
            missing_fields=(
                missing_fields
            ),
        )
    )


def build_provenance(
    organization: Organization,
) -> Organization720Provenance:
    return (
        Organization720Provenance(
            source_type=(
                organization
                .source_type
            ),
            source_reference=(
                organization
                .source_reference
            ),
            collected_at=(
                organization
                .collected_at
            ),
            last_verified_at=(
                organization
                .last_verified_at
            ),
        )
    )


def is_direction(
    auth: AuthContextResponse,
) -> bool:
    return (
        auth.account_type
        == "internal"
        and auth.projection
        == "direction"
    )


def can_access_business_context(
    auth: AuthContextResponse,
    context: str,
) -> bool:
    if is_direction(
        auth
    ):
        return True

    return (
        auth.projection
        == context
    )


def build_commercial_summary(
    db: Session,
    organization: Organization,
    accessible: bool,
) -> Organization720CommercialSummary:
    if not accessible:
        return (
            Organization720CommercialSummary(
                accessible=False,
                leads=0,
                qualified_leads=0,
                opportunities=0,
                active_opportunities=0,
                pipeline_by_currency={},
            )
        )

    leads = db.scalars(
        select(
            Lead
        )
        .where(
            Lead.organization_id
            == organization.id
        )
    ).all()

    opportunities = db.scalars(
        select(
            Opportunity
        )
        .where(
            Opportunity.organization_id
            == organization.id
        )
    ).all()

    active_opportunities = [
        opportunity
        for opportunity
        in opportunities
        if opportunity.stage
        not in {
            "won",
            "lost",
            "cancelled",
        }
    ]

    pipeline_by_currency: dict[
        str,
        float,
    ] = {}

    for opportunity in (
        active_opportunities
    ):
        if (
            opportunity.estimated_value
            is None
        ):
            continue

        currency = (
            opportunity.currency
            or "CHF"
        )

        pipeline_by_currency[
            currency
        ] = (
            pipeline_by_currency.get(
                currency,
                0.0,
            )
            + float(
                opportunity
                .estimated_value
            )
        )

    qualified_leads = sum(
        1
        for lead in leads
        if lead.status
        in {
            "qualified",
            "converted",
        }
    )

    return (
        Organization720CommercialSummary(
            accessible=True,
            leads=len(
                leads
            ),
            qualified_leads=(
                qualified_leads
            ),
            opportunities=len(
                opportunities
            ),
            active_opportunities=len(
                active_opportunities
            ),
            pipeline_by_currency=(
                pipeline_by_currency
            ),
        )
    )


def build_context_summary(
    db: Session,
    organization: Organization,
    context: str,
    accessible: bool,
) -> Organization720BusinessContextSummary:
    if not accessible:
        return (
            Organization720BusinessContextSummary(
                context=context,
                accessible=False,
                active_actions=0,
                total_actions=0,
                module_connected=False,
            )
        )

    actions = db.scalars(
        select(
            Action
        )
        .where(
            Action.organization_id
            == organization.id,
            Action.context
            == context,
        )
    ).all()

    active_actions = sum(
        1
        for action in actions
        if action.status
        in {
            "todo",
            "in_progress",
            "blocked",
        }
    )

    return (
        Organization720BusinessContextSummary(
            context=context,
            accessible=True,
            active_actions=(
                active_actions
            ),
            total_actions=len(
                actions
            ),
            module_connected=False,
        )
    )


def build_business_summary(
    db: Session,
    organization: Organization,
    auth: AuthContextResponse,
) -> Organization720BusinessSummary:
    return Organization720BusinessSummary(
        commercial=(
            build_commercial_summary(
                db,
                organization,
                can_access_business_context(
                    auth,
                    "commercial",
                ),
            )
        ),
        assurance=(
            build_context_summary(
                db,
                organization,
                "assurance",
                can_access_business_context(
                    auth,
                    "assurance",
                ),
            )
        ),
        investissement=(
            build_context_summary(
                db,
                organization,
                "investissement",
                can_access_business_context(
                    auth,
                    "investissement",
                ),
            )
        ),
        fiduciaire=(
            build_context_summary(
                db,
                organization,
                "fiduciaire",
                can_access_business_context(
                    auth,
                    "fiduciaire",
                ),
            )
        ),
        technologies=(
            build_context_summary(
                db,
                organization,
                "technologies",
                can_access_business_context(
                    auth,
                    "technologies",
                ),
            )
        ),
    )


@router.get(
    "/{organization_id}/720",
    response_model=(
        Organization720Projection
    ),
)
def get_organization_720_projection(
    organization_id: str,
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

    organization = (
        get_organization_or_404(
            db,
            organization_id,
        )
    )

    contacts = (
        list_organization_contacts(
            db,
            organization,
        )
    )

    return Organization720Projection(
        organization=organization,
        contacts=contacts,
        contact_summary=(
            build_contact_summary(
                contacts
            )
        ),
        data_quality=(
            build_data_quality(
                organization
            )
        ),
        provenance=(
            build_provenance(
                organization
            )
        ),
        business_summary=(
            build_business_summary(
                db,
                organization,
                auth,
            )
        ),
    )
