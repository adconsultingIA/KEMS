from sqlalchemy import select

from app.models.audit_event import (
    AuditEvent,
)
from app.models.auth_account import (
    AuthAccount,
)
from app.models.contact import Contact
from app.models.organization import Organization
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
            "email": email,
            "password": PASSWORD,
        },
    )

    assert response.status_code == 200

    token = response.json()[
        "access_token"
    ]

    return {
        "Authorization": (
            f"Bearer {token}"
        )
    }


def test_actions_require_authentication(
    client,
):
    response = client.get(
        "/api/v1/core/actions"
    )

    assert response.status_code == 401


def test_direction_can_see_all_contexts(
    client,
    db_session,
):
    direction = create_internal_user(
        db_session,
        full_name="Euloge Santos",
        email="direction.actions@kems.test",
        unit_name="Direction",
        unit_code="DIRECTION",
        role_code="direction-manager",
    )

    headers = login(
        client,
        direction["profile"].email,
    )

    for context in (
        "technologies",
        "assurance",
    ):
        response = client.post(
            "/api/v1/core/actions",
            headers=headers,
            json={
                "title": (
                    f"Action {context}"
                ),
                "context": context,
                "priority": "high",
            },
        )

        assert response.status_code == 201

        assert (
            response.json()[
                "created_by_profile_id"
            ]
            == direction["profile"].id
        )

    listed = client.get(
        "/api/v1/core/actions",
        headers=headers,
    )

    assert listed.status_code == 200
    assert len(listed.json()) == 2


def test_business_user_only_sees_own_context(
    client,
    db_session,
):
    direction = create_internal_user(
        db_session,
        full_name="Euloge Santos",
        email="direction.scope@kems.test",
        unit_name="Direction",
        unit_code="DIRECTION",
        role_code="direction-scope",
    )

    tech = create_internal_user(
        db_session,
        full_name="Parfait ADJANOR",
        email="tech.scope@kems.test",
        unit_name="Technologies",
        unit_code="TECHNOLOGIES",
        role_code="tech-scope",
    )

    direction_headers = login(
        client,
        direction["profile"].email,
    )

    client.post(
        "/api/v1/core/actions",
        headers=direction_headers,
        json={
            "title": "Action Technologies",
            "context": "technologies",
        },
    )

    client.post(
        "/api/v1/core/actions",
        headers=direction_headers,
        json={
            "title": "Action Assurance",
            "context": "assurance",
        },
    )

    tech_headers = login(
        client,
        tech["profile"].email,
    )

    response = client.get(
        "/api/v1/core/actions",
        headers=tech_headers,
    )

    assert response.status_code == 200

    payload = response.json()

    assert len(payload) == 1

    assert (
        payload[0]["context"]
        == "technologies"
    )

    forbidden = client.get(
        (
            "/api/v1/core/actions"
            "?context=assurance"
        ),
        headers=tech_headers,
    )

    assert forbidden.status_code == 403


def test_business_user_cannot_create_cross_context(
    client,
    db_session,
):
    tech = create_internal_user(
        db_session,
        full_name="Parfait ADJANOR",
        email="tech.create@kems.test",
        unit_name="Technologies",
        unit_code="TECHNOLOGIES",
        role_code="tech-create",
    )

    headers = login(
        client,
        tech["profile"].email,
    )

    allowed = client.post(
        "/api/v1/core/actions",
        headers=headers,
        json={
            "title": "Valider le livrable",
            "context": "technologies",
        },
    )

    assert allowed.status_code == 201

    forbidden = client.post(
        "/api/v1/core/actions",
        headers=headers,
        json={
            "title": (
                "Renouveler assurance"
            ),
            "context": "assurance",
        },
    )

    assert forbidden.status_code == 403


def test_mine_filter_returns_assigned_actions(
    client,
    db_session,
):
    tech = create_internal_user(
        db_session,
        full_name="Parfait ADJANOR",
        email="tech.mine@kems.test",
        unit_name="Technologies",
        unit_code="TECHNOLOGIES",
        role_code="tech-mine",
    )

    headers = login(
        client,
        tech["profile"].email,
    )

    mine = client.post(
        "/api/v1/core/actions",
        headers=headers,
        json={
            "title": "Mon ticket",
            "context": "technologies",
            "owner_profile_id": (
                tech["profile"].id
            ),
            "unit_id": (
                tech["unit"].id
            ),
        },
    )

    assert mine.status_code == 201

    unassigned = client.post(
        "/api/v1/core/actions",
        headers=headers,
        json={
            "title": "Action équipe",
            "context": "technologies",
        },
    )

    assert unassigned.status_code == 201

    response = client.get(
        (
            "/api/v1/core/actions"
            "?mine=true"
        ),
        headers=headers,
    )

    assert response.status_code == 200
    assert len(response.json()) == 1

    assert (
        response.json()[0]["title"]
        == "Mon ticket"
    )


def test_complete_and_reopen_action(
    client,
    db_session,
):
    tech = create_internal_user(
        db_session,
        full_name="Parfait ADJANOR",
        email="tech.complete@kems.test",
        unit_name="Technologies",
        unit_code="TECHNOLOGIES",
        role_code="tech-complete",
    )

    headers = login(
        client,
        tech["profile"].email,
    )

    created = client.post(
        "/api/v1/core/actions",
        headers=headers,
        json={
            "title": (
                "Valider un livrable"
            ),
            "priority": "critical",
            "context": "technologies",
            "source_type": "project",
        },
    )

    assert created.status_code == 201

    action_id = (
        created.json()["id"]
    )

    completed = client.patch(
        (
            "/api/v1/core/actions/"
            f"{action_id}"
        ),
        headers=headers,
        json={
            "status": "done",
        },
    )

    assert completed.status_code == 200

    assert (
        completed.json()[
            "completed_at"
        ]
        is not None
    )

    reopened = client.patch(
        (
            "/api/v1/core/actions/"
            f"{action_id}"
        ),
        headers=headers,
        json={
            "status": "in_progress",
        },
    )

    assert reopened.status_code == 200

    assert (
        reopened.json()[
            "completed_at"
        ]
        is None
    )


def test_business_user_only_sees_eligible_assignees(
    client,
    db_session,
):
    tech = create_internal_user(
        db_session,
        full_name="Tech Assignee",
        email="tech.assignee@kems.test",
        unit_name="Technologies",
        unit_code="TECHNOLOGIES",
        role_code="tech-assignee",
    )

    create_internal_user(
        db_session,
        full_name="Assurance Assignee",
        email="assurance.assignee@kems.test",
        unit_name="Assurance",
        unit_code="ASSURANCE",
        role_code="assurance-assignee",
    )

    headers = login(
        client,
        tech["profile"].email,
    )

    response = client.get(
        "/api/v1/core/actions/assignees",
        headers=headers,
    )

    assert response.status_code == 200

    payload = response.json()

    assert len(payload) == 1

    assert (
        payload[0]["id"]
        == tech["profile"].id
    )

    assert (
        "technologies"
        in payload[0]["contexts"]
    )


def test_direction_cannot_assign_cross_business_profile(
    client,
    db_session,
):
    direction = create_internal_user(
        db_session,
        full_name="Direction Manager",
        email="direction.assignment@kems.test",
        unit_name="Direction",
        unit_code="DIRECTION",
        role_code="direction-assignment",
    )

    tech = create_internal_user(
        db_session,
        full_name="Tech User",
        email="tech.assignment@kems.test",
        unit_name="Technologies",
        unit_code="TECHNOLOGIES",
        role_code="tech-assignment",
    )

    assurance = create_internal_user(
        db_session,
        full_name="Assurance User",
        email="assurance.assignment@kems.test",
        unit_name="Assurance",
        unit_code="ASSURANCE",
        role_code="assurance-assignment",
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
                "Action Technologies",
            "context":
                "technologies",
            "owner_profile_id":
                tech["profile"].id,
        },
    )

    assert (
        created.status_code
        == 201
    )

    action_id = (
        created.json()["id"]
    )

    forbidden = client.patch(
        (
            "/api/v1/core/actions/"
            f"{action_id}"
        ),
        headers=headers,
        json={
            "owner_profile_id":
                assurance["profile"].id,
        },
    )

    assert (
        forbidden.status_code
        == 403
    )


def test_action_creation_is_audited(
    client,
    db_session,
):
    direction = create_internal_user(
        db_session,
        full_name="Euloge Santos",
        email="direction.audit-create@kems.test",
        unit_name="Direction",
        unit_code="DIRECTION",
        role_code="direction-audit-create",
    )

    headers = login(
        client,
        direction["profile"].email,
    )

    response = client.post(
        "/api/v1/core/actions",
        headers=headers,
        json={
            "title":
                "Préparer dossier Assurance",
            "context":
                "assurance",
            "priority":
                "high",
        },
    )

    assert (
        response.status_code
        == 201
    )

    action_id = (
        response.json()["id"]
    )

    event = db_session.scalar(
        select(
            AuditEvent
        ).where(
            AuditEvent.entity_id
            == action_id,
            AuditEvent.action_type
            == "action.created",
        )
    )

    assert event is not None

    assert (
        event.actor_name
        == "Euloge Santos"
    )

    assert (
        event.actor_unit_name
        == "Direction"
    )

    assert (
        event.effective_context
        == "assurance"
    )

    assert (
        event.after_data[
            "priority"
        ]
        == "high"
    )


def test_action_status_and_assignment_are_audited(
    client,
    db_session,
):
    direction = create_internal_user(
        db_session,
        full_name="Direction Audit",
        email="direction.audit-update@kems.test",
        unit_name="Direction",
        unit_code="DIRECTION",
        role_code="direction-audit-update",
    )

    tech = create_internal_user(
        db_session,
        full_name="Tech Audit",
        email="tech.audit-update@kems.test",
        unit_name="Technologies",
        unit_code="TECHNOLOGIES",
        role_code="tech-audit-update",
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
                "Traiter incident",
            "context":
                "technologies",
        },
    )

    assert (
        created.status_code
        == 201
    )

    action_id = (
        created.json()["id"]
    )

    assigned = client.patch(
        (
            "/api/v1/core/actions/"
            f"{action_id}"
        ),
        headers=headers,
        json={
            "owner_profile_id":
                tech["profile"].id,
        },
    )

    assert (
        assigned.status_code
        == 200
    )

    started = client.patch(
        (
            "/api/v1/core/actions/"
            f"{action_id}"
        ),
        headers=headers,
        json={
            "status":
                "in_progress",
        },
    )

    assert (
        started.status_code
        == 200
    )

    completed = client.patch(
        (
            "/api/v1/core/actions/"
            f"{action_id}"
        ),
        headers=headers,
        json={
            "status":
                "done",
        },
    )

    assert (
        completed.status_code
        == 200
    )

    events = db_session.scalars(
        select(
            AuditEvent
        ).where(
            AuditEvent.entity_id
            == action_id
        ).order_by(
            AuditEvent.created_at.asc()
        )
    ).all()

    event_types = [
        event.action_type
        for event in events
    ]

    assert (
        "action.created"
        in event_types
    )

    assert (
        "action.assigned"
        in event_types
    )

    assert (
        "action.started"
        in event_types
    )

    assert (
        "action.completed"
        in event_types
    )

    assignment_event = next(
        event
        for event in events
        if event.action_type
        == "action.assigned"
    )

    assert (
        assignment_event
        .before_data[
            "owner_profile_id"
        ]
        is None
    )

    assert (
        assignment_event
        .after_data[
            "owner_profile_id"
        ]
        == tech["profile"].id
    )

    completion_event = next(
        event
        for event in events
        if event.action_type
        == "action.completed"
    )

    assert (
        completion_event
        .before_data["status"]
        == "in_progress"
    )

    assert (
        completion_event
        .after_data["status"]
        == "done"
    )

    # Critical governance rule:
    # actor remains Direction while the effective
    # business context remains Technologies.
    assert (
        completion_event
        .actor_unit_name
        == "Direction"
    )

    assert (
        completion_event
        .effective_context
        == "technologies"
    )
