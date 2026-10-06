from sqlalchemy import select

from app.models.audit_event import (
    AuditEvent,
)
from app.models.auth_account import (
    AuthAccount,
)
from app.models.organizational_unit import (
    OrganizationalUnit,
)
from app.models.profile import (
    Profile,
)
from app.models.role import (
    Role,
)
from app.models.user_membership import (
    UserMembership,
)
from app.services.auth_service import (
    hash_password,
)


PASSWORD = "KemsDemo2026!"


def create_internal_user(
    db_session,
    *,
    full_name: str,
    email: str,
    unit_name: str,
    unit_code: str,
    role_code: str,
):
    unit = OrganizationalUnit(
        name=unit_name,
        code=unit_code,
        unit_type="business_unit",
        is_active=True,
    )

    role = Role(
        code=role_code,
        name=role_code.title(),
        is_system=True,
    )

    profile = Profile(
        full_name=full_name,
        email=email,
        role=unit_code.lower(),
    )

    db_session.add_all(
        [
            unit,
            role,
            profile,
        ]
    )

    db_session.flush()

    membership = UserMembership(
        user_id=profile.id,
        unit_id=unit.id,
        role_id=role.id,
        is_primary=True,
        is_active=True,
    )

    account = AuthAccount(
        account_type="internal",
        profile_id=profile.id,
        email=email,
        password_hash=hash_password(
            PASSWORD
        ),
        is_active=True,
    )

    db_session.add_all(
        [
            membership,
            account,
        ]
    )

    db_session.commit()

    return {
        "unit": unit,
        "role": role,
        "profile": profile,
        "account": account,
    }


def login(
    client,
    email: str,
):
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email":
                email,
            "password":
                PASSWORD,
        },
    )

    assert (
        response.status_code
        == 200
    )

    token = (
        response.json()[
            "access_token"
        ]
    )

    return {
        "Authorization":
            f"Bearer {token}"
    }


def create_audit_event(
    db_session,
    *,
    actor,
    context: str,
    action_type: str,
    entity_id: str,
):
    event = AuditEvent(
        actor_type="internal",
        actor_account_id=(
            actor["account"].id
        ),
        actor_profile_id=(
            actor["profile"].id
        ),
        actor_role_id=(
            actor["role"].id
        ),
        actor_unit_id=(
            actor["unit"].id
        ),
        actor_name=(
            actor["profile"].full_name
        ),
        actor_role_name=(
            actor["role"].name
        ),
        actor_unit_name=(
            actor["unit"].name
        ),
        effective_context=context,
        action_type=action_type,
        entity_type="action",
        entity_id=entity_id,
        source_type="action_center",
        before_data={
            "status": "todo",
        },
        after_data={
            "status": "in_progress",
        },
    )

    db_session.add(
        event
    )

    db_session.commit()
    db_session.refresh(
        event
    )

    return event


def test_audit_requires_authentication(
    client,
):
    response = client.get(
        "/api/v1/core/audit-events"
    )

    assert (
        response.status_code
        == 401
    )


def test_business_user_cannot_read_audit(
    client,
    db_session,
):
    tech = create_internal_user(
        db_session,
        full_name="Parfait ADJANOR",
        email=(
            "tech.audit-api@kems.test"
        ),
        unit_name="Technologies",
        unit_code="TECHNOLOGIES",
        role_code="tech-audit-api",
    )

    headers = login(
        client,
        tech["profile"].email,
    )

    response = client.get(
        "/api/v1/core/audit-events",
        headers=headers,
    )

    assert (
        response.status_code
        == 403
    )


def test_direction_can_list_audit_events(
    client,
    db_session,
):
    direction = create_internal_user(
        db_session,
        full_name="Euloge Santos",
        email=(
            "direction.audit-api@kems.test"
        ),
        unit_name="Direction",
        unit_code="DIRECTION",
        role_code=(
            "direction-audit-api"
        ),
    )

    create_audit_event(
        db_session,
        actor=direction,
        context="assurance",
        action_type=(
            "action.started"
        ),
        entity_id="action-assurance",
    )

    create_audit_event(
        db_session,
        actor=direction,
        context="technologies",
        action_type=(
            "action.completed"
        ),
        entity_id="action-tech",
    )

    headers = login(
        client,
        direction["profile"].email,
    )

    response = client.get(
        "/api/v1/core/audit-events",
        headers=headers,
    )

    assert (
        response.status_code
        == 200
    )

    payload = response.json()

    assert len(payload) == 2

    contexts = {
        item["effective_context"]
        for item in payload
    }

    assert contexts == {
        "assurance",
        "technologies",
    }


def test_direction_can_filter_audit_events(
    client,
    db_session,
):
    direction = create_internal_user(
        db_session,
        full_name="Direction Filter",
        email=(
            "direction.audit-filter@kems.test"
        ),
        unit_name="Direction",
        unit_code="DIRECTION",
        role_code=(
            "direction-audit-filter"
        ),
    )

    create_audit_event(
        db_session,
        actor=direction,
        context="assurance",
        action_type=(
            "action.started"
        ),
        entity_id="action-a",
    )

    create_audit_event(
        db_session,
        actor=direction,
        context="technologies",
        action_type=(
            "action.completed"
        ),
        entity_id="action-b",
    )

    headers = login(
        client,
        direction["profile"].email,
    )

    response = client.get(
        (
            "/api/v1/core/audit-events"
            "?effective_context=assurance"
        ),
        headers=headers,
    )

    assert (
        response.status_code
        == 200
    )

    payload = response.json()

    assert len(payload) == 1

    assert (
        payload[0][
            "effective_context"
        ]
        == "assurance"
    )

    assert (
        payload[0][
            "entity_id"
        ]
        == "action-a"
    )


def test_direction_can_get_audit_event_detail(
    client,
    db_session,
):
    direction = create_internal_user(
        db_session,
        full_name="Direction Detail",
        email=(
            "direction.audit-detail@kems.test"
        ),
        unit_name="Direction",
        unit_code="DIRECTION",
        role_code=(
            "direction-audit-detail"
        ),
    )

    event = create_audit_event(
        db_session,
        actor=direction,
        context="assurance",
        action_type=(
            "action.started"
        ),
        entity_id="action-detail",
    )

    headers = login(
        client,
        direction["profile"].email,
    )

    response = client.get(
        (
            "/api/v1/core/audit-events/"
            f"{event.id}"
        ),
        headers=headers,
    )

    assert (
        response.status_code
        == 200
    )

    payload = response.json()

    assert (
        payload["id"]
        == event.id
    )

    assert (
        payload["actor_name"]
        == "Direction Detail"
    )

    assert (
        payload["before_data"][
            "status"
        ]
        == "todo"
    )

    assert (
        payload["after_data"][
            "status"
        ]
        == "in_progress"
    )


def test_unknown_audit_event_returns_404(
    client,
    db_session,
):
    direction = create_internal_user(
        db_session,
        full_name="Direction Missing",
        email=(
            "direction.audit-missing@kems.test"
        ),
        unit_name="Direction",
        unit_code="DIRECTION",
        role_code=(
            "direction-audit-missing"
        ),
    )

    headers = login(
        client,
        direction["profile"].email,
    )

    response = client.get(
        (
            "/api/v1/core/audit-events/"
            "does-not-exist"
        ),
        headers=headers,
    )

    assert (
        response.status_code
        == 404
    )


def test_audit_api_is_read_only(
    client,
    db_session,
):
    direction = create_internal_user(
        db_session,
        full_name="Direction Read Only",
        email=(
            "direction.audit-readonly@kems.test"
        ),
        unit_name="Direction",
        unit_code="DIRECTION",
        role_code=(
            "direction-audit-readonly"
        ),
    )

    headers = login(
        client,
        direction["profile"].email,
    )

    response = client.post(
        "/api/v1/core/audit-events",
        headers=headers,
        json={},
    )

    assert (
        response.status_code
        == 405
    )

    existing = db_session.scalars(
        select(
            AuditEvent
        )
    ).all()

    assert existing == []
