from datetime import datetime

from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthProfileResponse(BaseModel):
    id: str
    full_name: str
    email: str


class AuthContactResponse(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: str | None


class AuthRoleResponse(BaseModel):
    id: str
    code: str
    name: str


class AuthUnitResponse(BaseModel):
    id: str
    code: str
    name: str


class AuthMembershipResponse(BaseModel):
    id: str
    role: AuthRoleResponse
    unit: AuthUnitResponse
    is_primary: bool


class AuthContextResponse(BaseModel):
    account_id: str
    account_type: str
    email: str
    projection: str

    profile: AuthProfileResponse | None = None
    contact: AuthContactResponse | None = None

    role: AuthRoleResponse | None = None
    primary_unit: AuthUnitResponse | None = None

    memberships: list[AuthMembershipResponse] = []


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_at: datetime
    context: AuthContextResponse
