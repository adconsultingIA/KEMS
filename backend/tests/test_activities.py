from app.models.activity import (
    Activity,
)
from app.models.auth_account import (
    AuthAccount,
)
from app.models.organizational_unit import (
    OrganizationalUnit,
)
from app.models.profile import Profile
from app.models.role import Role
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
    )

    account = AuthAccount(
        account_type="internal",
        profile_id=profile.id,
        email=email,
        password_hash=hash_password(
            PASSWORD
        ),
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
        "profile": profile,
    }


def login(
    client,
    email: str,
):
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": email,
            "password": PASSWORD,
        },
    )

    assert (
        response.status_code
        == 200
    )

    return {
        "Authorization": (
            "Bearer "
            + response.json()[
                "access_token"
            ]
        )
    }


def test_action_creation_records_activity(
    client,
    db_session,
):
    tech = create_internal_user(
        db_session,
        full_name="Tech Activity",
        email="tech.activity@kems.test",
        unit_name="Technologies",
        unit_code="TECHNOLOGIES",
        role_code="tech-activity",
    )

    headers = login(
        client,
        tech["profile"].email,
    )

    created = client.post(
        "/api/v1/core/actions",
        headers=headers,
        json={
            "title":
                "Préparer livraison",
            "context":
                "technologies",
            "priority":
                "high",
        },
    )

    assert (
        created.status_code
        == 201
    )

    action = created.json()

    activity = db_session.query(
        Activity
    ).one()

    assert (
        activity.event_type
        == "action.created"
    )

    assert (
        activity.context
        == "technologies"
    )

    assert (
        activity.action_id
        == action["id"]
    )

    assert (
        activity.actor_profile_id
        == tech["profile"].id
    )

    assert (
        activity.actor_type
        == "internal"
    )


def test_business_activity_projection_is_scoped(
    client,
    db_session,
):
    direction = create_internal_user(
        db_session,
        full_name="Direction Activity",
        email="direction.activity@kems.test",
        unit_name="Direction",
        unit_code="DIRECTION",
        role_code="direction-activity",
    )

    tech = create_internal_user(
        db_session,
        full_name="Tech Timeline",
        email="tech.timeline@kems.test",
        unit_name="Technologies",
        unit_code="TECHNOLOGIES",
        role_code="tech-timeline",
    )

    direction_headers = login(
        client,
        direction["profile"].email,
    )

    for context in (
        "technologies",
        "assurance",
    ):
        response = client.post(
            "/api/v1/core/actions",
            headers=direction_headers,
            json={
                "title":
                    f"Action {context}",
                "context":
                    context,
            },
        )

        assert (
            response.status_code
            == 201
        )

    tech_headers = login(
        client,
        tech["profile"].email,
    )

    response = client.get(
        "/api/v1/core/activities",
        headers=tech_headers,
    )

    assert (
        response.status_code
        == 200
    )

    payload = response.json()

    assert len(payload) == 1

    assert (
        payload[0]["context"]
        == "technologies"
    )

    forbidden = client.get(
        (
            "/api/v1/core/activities"
            "?context=assurance"
        ),
        headers=tech_headers,
    )

    assert (
        forbidden.status_code
        == 403
    )


def test_direction_can_filter_activity_by_action(
    client,
    db_session,
):
    direction = create_internal_user(
        db_session,
        full_name="Direction Filter",
        email="direction.filter@kems.test",
        unit_name="Direction",
        unit_code="DIRECTION",
        role_code="direction-filter",
    )

    headers = login(
        client,
        direction["profile"].email,
    )

    created = client.post(
        "/api/v1/core/actions",
        headers=headers,
        json={
            "title":
                "Action filtrée",
            "context":
                "assurance",
        },
    )

    assert (
        created.status_code
        == 201
    )

    action_id = (
        created.json()["id"]
    )

    response = client.get(
        (
            "/api/v1/core/activities"
            f"?action_id={action_id}"
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
        payload[0]["action_id"]
        == action_id
    )

    assert (
        payload[0]["event_type"]
        == "action.created"
    )
