from pydantic import BaseModel

from app.schemas.contact import ContactResponse
from app.schemas.organization import OrganizationResponse


class Client720DataQuality(BaseModel):
    verification_status: str
    is_verified: bool

    has_email: bool
    has_phone: bool
    has_job_title: bool
    has_organization: bool

    completeness_score: int


class Client720Projection(BaseModel):
    contact: ContactResponse

    organization: (
        OrganizationResponse
        | None
    )

    data_quality: Client720DataQuality
