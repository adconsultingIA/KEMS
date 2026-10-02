from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


ActionStatus = Literal[
    "todo",
    "in_progress",
    "blocked",
    "done",
    "cancelled",
]

ActionPriority = Literal[
    "low",
    "medium",
    "high",
    "critical",
]

ActionContext = Literal[
    "direction",
    "commercial",
    "assurance",
    "investissement",
    "fiduciaire",
    "technologies",
    "core",
    "client",
]


class ActionCreate(BaseModel):
    title: str
    description: str | None = None

    status: ActionStatus = "todo"
    priority: ActionPriority = "medium"
    context: ActionContext = "core"

    owner_profile_id: str | None = None
    unit_id: str | None = None

    contact_id: str | None = None
    organization_id: str | None = None

    source_type: str = "manual"
    source_entity_type: str | None = None
    source_entity_id: str | None = None

    due_at: datetime | None = None


class ActionUpdate(BaseModel):
    title: str | None = None
    description: str | None = None

    status: ActionStatus | None = None
    priority: ActionPriority | None = None
    context: ActionContext | None = None

    owner_profile_id: str | None = None
    unit_id: str | None = None

    contact_id: str | None = None
    organization_id: str | None = None

    source_type: str | None = None
    source_entity_type: str | None = None
    source_entity_id: str | None = None

    due_at: datetime | None = None


class ActionResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: str

    title: str
    description: str | None

    status: str
    priority: str
    context: str

    owner_profile_id: str | None
    unit_id: str | None

    contact_id: str | None
    organization_id: str | None

    source_type: str
    source_entity_type: str | None
    source_entity_id: str | None

    created_by_profile_id: str | None

    due_at: datetime | None
    completed_at: datetime | None

    created_at: datetime
    updated_at: datetime


class ClientAdviceRequestCreate(BaseModel):
    domain: str
    subject: str
    description: str
    urgency: Literal[
        "low",
        "normal",
        "urgent",
    ] = "normal"


class ClientAdviceRequestResponse(BaseModel):
    reference: str
    action: ActionResponse
