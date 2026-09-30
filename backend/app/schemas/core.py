from datetime import datetime

from pydantic import BaseModel, ConfigDict


class OrganizationalUnitCreate(BaseModel):
    name: str
    code: str
    unit_type: str = "unit"
    parent_id: str | None = None
    description: str | None = None


class OrganizationalUnitResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    code: str
    unit_type: str
    parent_id: str | None
    description: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class TeamCreate(BaseModel):
    unit_id: str
    name: str
    code: str
    description: str | None = None


class TeamResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    unit_id: str
    name: str
    code: str
    description: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class RoleCreate(BaseModel):
    code: str
    name: str
    description: str | None = None
    is_system: bool = False


class RoleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    code: str
    name: str
    description: str | None
    is_system: bool
    created_at: datetime


class UserMembershipCreate(BaseModel):
    user_id: str
    unit_id: str
    role_id: str
    team_id: str | None = None
    is_primary: bool = False


class UserMembershipResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    unit_id: str
    team_id: str | None
    role_id: str
    is_primary: bool
    is_active: bool
    created_at: datetime


class CoreOverviewOrganization(BaseModel):
    id: str
    name: str
    code: str


class CoreOverviewMember(BaseModel):
    id: str
    full_name: str
    email: str
    role_code: str
    role_name: str
    is_primary: bool


class CoreOverviewUnit(BaseModel):
    id: str
    name: str
    code: str
    unit_type: str
    description: str | None
    members: list[CoreOverviewMember]


class CoreOverviewResponse(BaseModel):
    organization: CoreOverviewOrganization
    units: list[CoreOverviewUnit]
