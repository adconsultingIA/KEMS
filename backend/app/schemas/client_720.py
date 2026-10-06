from datetime import datetime

from pydantic import BaseModel

from app.schemas.contact import ContactResponse
from app.schemas.contact_organization import ContactOrganizationResponse
from app.schemas.organization import OrganizationResponse


class Client720DataQuality(BaseModel):
    verification_status: str
    is_verified: bool

    has_email: bool
    has_phone: bool
    has_job_title: bool
    has_organization: bool

    completeness_score: int
    missing_fields: list[str]


class Client720Provenance(BaseModel):
    contact_source_type: str
    contact_source_reference: str | None

    contact_collected_at: datetime | None
    contact_last_verified_at: datetime | None

    organization_source_type: str | None
    organization_source_reference: str | None

    organization_collected_at: datetime | None
    organization_last_verified_at: datetime | None


class Client720Relation(BaseModel):
    relationship: ContactOrganizationResponse
    organization: OrganizationResponse


class Client720CommercialSummary(BaseModel):
    leads: int
    qualified_leads: int

    opportunities: int
    active_opportunities: int

    pipeline_by_currency: dict[str, float]


class Client720BusinessContextSummary(BaseModel):
    context: str

    active_actions: int
    total_actions: int

    module_connected: bool


class Client720BusinessSummary(BaseModel):
    commercial: Client720CommercialSummary

    assurance: Client720BusinessContextSummary
    investissement: Client720BusinessContextSummary
    fiduciaire: Client720BusinessContextSummary
    technologies: Client720BusinessContextSummary


class Client720AffiliationSummary(BaseModel):
    total_relations: int
    active_relations: int
    historical_relations: int

    primary_organization_id: str | None

    has_multiple_active_affiliations: bool


class Client720Projection(BaseModel):
    contact: ContactResponse

    organization: (
        OrganizationResponse
        | None
    )

    relations: list[Client720Relation]
    affiliation_summary: Client720AffiliationSummary

    business_summary: Client720BusinessSummary

    data_quality: Client720DataQuality
    provenance: Client720Provenance
