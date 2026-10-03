from datetime import datetime

from pydantic import BaseModel

from app.schemas.contact import (
    ContactResponse,
)
from app.schemas.contact_organization import (
    ContactOrganizationResponse,
)
from app.schemas.organization import (
    OrganizationResponse,
)


class Organization720ContactRelation(
    BaseModel
):
    contact: ContactResponse

    relationship: (
        ContactOrganizationResponse
        | None
    ) = None


class Organization720ContactSummary(
    BaseModel
):
    total_contacts: int

    active_relations: int
    historical_relations: int

    decision_makers: int

    has_multiple_active_contacts: bool


class Organization720DataQuality(
    BaseModel
):
    verification_status: str
    is_verified: bool

    has_legal_name: bool
    has_industry: bool
    has_website: bool
    has_email: bool
    has_phone: bool
    has_country: bool
    has_city: bool
    has_address: bool

    completeness_score: int

    missing_fields: list[str]


class Organization720Provenance(
    BaseModel
):
    source_type: str
    source_reference: str | None

    collected_at: datetime | None
    last_verified_at: datetime | None


class Organization720CommercialSummary(
    BaseModel
):
    accessible: bool

    leads: int
    qualified_leads: int

    opportunities: int
    active_opportunities: int

    pipeline_by_currency: dict[
        str,
        float,
    ]


class Organization720BusinessContextSummary(
    BaseModel
):
    context: str
    accessible: bool

    active_actions: int
    total_actions: int

    module_connected: bool


class Organization720BusinessSummary(
    BaseModel
):
    commercial: (
        Organization720CommercialSummary
    )

    assurance: (
        Organization720BusinessContextSummary
    )

    investissement: (
        Organization720BusinessContextSummary
    )

    fiduciaire: (
        Organization720BusinessContextSummary
    )

    technologies: (
        Organization720BusinessContextSummary
    )


class Organization720Projection(
    BaseModel
):
    organization: OrganizationResponse

    contacts: list[
        Organization720ContactRelation
    ]

    contact_summary: (
        Organization720ContactSummary
    )

    data_quality: (
        Organization720DataQuality
    )

    provenance: (
        Organization720Provenance
    )

    business_summary: (
        Organization720BusinessSummary
    )
