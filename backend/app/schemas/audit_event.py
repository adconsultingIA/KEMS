from datetime import datetime

from pydantic import BaseModel


class AuditEventResponse(BaseModel):
    id: str

    actor_type: str

    actor_account_id: str | None

    actor_profile_id: str | None
    actor_contact_id: str | None

    actor_role_id: str | None
    actor_unit_id: str | None

    actor_name: str | None
    actor_role_name: str | None
    actor_unit_name: str | None

    effective_context: str

    action_type: str
    description: str | None

    entity_type: str
    entity_id: str | None

    contact_id: str | None
    organization_id: str | None
    action_id: str | None

    source_type: str
    source_entity_type: str | None
    source_entity_id: str | None

    before_data: dict | None
    after_data: dict | None

    request_id: str | None
    ip_address: str | None
    user_agent: str | None

    created_at: datetime

    model_config = {
        "from_attributes": True
    }
