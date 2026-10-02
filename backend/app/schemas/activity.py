from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
)


class ActivityResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: str

    event_type: str
    title: str
    description: str | None

    context: str

    actor_type: str
    actor_profile_id: str | None
    actor_contact_id: str | None

    contact_id: str | None
    organization_id: str | None
    action_id: str | None

    source_type: str
    source_entity_type: str | None
    source_entity_id: str | None

    created_at: datetime
