from sqlalchemy import select

from app.models.audit_event import (
    AuditEvent,
)
from app.models.auth_account import (
    AuthAccount,
)
from app.models.contact import Contact
from app.models.organizational_unit import (
    OrganizationalUnit,
)
from app.services.auth_service import (
    hash_password,
)


PASSWORD = "KemsDemo2026!"


def create_client(
    db_session,
):
    contact = Contact(
        first_name="Jean",
        last_name="Dupont",
        normalized_name="jean dupont",
        email="client.actions@kems.test",
        is_active=True,
    )

    assurance = OrganizationalUnit(
        name="Assurance",
        code="ASSURANCE",
        unit_type="business_unit",
        is_active=True,
    )

    db_session.add_all(
        [
            contact,
            assurance,
        ]
    )

    db_session.flush()

    account = AuthAccount(
        account_type="client",
        contact_id=contact.id,
        email="client.actions@kems.test",
        password_hash=hash_password(
            PASSWORD
        ),
        is_active=True,
    )

    db_session.add(account)
    db_session.commit()

    return {
        "contact": contact,
        "assurance": assurance,
    }


def login_client(
    client,
):
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email":
                "client.actions@kems.test",
            "password": PASSWORD,
        },
    )

    assert response.status_code == 200

    token = response.json()[
        "access_token"
    ]

    return {
        "Authorization":
            f"Bearer {token}"
    }


def test_client_advice_request_creates_action(
    client,
    db_session,
):
    data = create_client(
        db_session
    )

    headers = login_client(
        client
    )

    response = client.post(
        (
            "/api/v1/client/actions/"
            "advice-request"
        ),
        headers=headers,
        json={
            "domain": "Assurance",
            "subject":
                "Revoir ma couverture",
            "description":
                "Je souhaite revoir "
                "ma couverture actuelle.",
            "urgency": "urgent",
        },
    )

    assert response.status_code == 201

    payload = response.json()

    assert payload[
        "reference"
    ].startswith(
        "KEMS-REQ-"
    )

    action = payload["action"]

    assert (
        action["context"]
        == "assurance"
    )

    assert (
        action["priority"]
        == "high"
    )

    assert (
        action["contact_id"]
        == data["contact"].id
    )

    assert (
        action["unit_id"]
        == data["assurance"].id
    )

    assert (
        action["source_type"]
        == "client_360"
    )

    assert (
        action[
            "source_entity_type"
        ]
        == "advice_request"
    )


def test_internal_user_cannot_use_client_endpoint(
    client,
):
    response = client.post(
        (
            "/api/v1/client/actions/"
            "advice-request"
        ),
        json={
            "domain": "Assurance",
            "subject": "Test",
            "description": "Test",
            "urgency": "normal",
        },
    )

    assert response.status_code == 401


def test_client_advice_request_is_audited(
    client,
    db_session,
):
    data = create_client(
        db_session
    )

    headers = login_client(
        client
    )

    response = client.post(
        (
            "/api/v1/client/actions/"
            "advice-request"
        ),
        headers=headers,
        json={
            "domain":
                "Assurance",
            "subject":
                "Besoin de conseil",
            "description":
                "Je souhaite parler "
                "à mon conseiller.",
            "urgency":
                "normal",
        },
    )

    assert (
        response.status_code
        == 201
    )

    payload = response.json()

    event = db_session.scalar(
        select(
            AuditEvent
        ).where(
            AuditEvent.entity_id
            == payload["action"]["id"],
            AuditEvent.action_type
            == "advice.requested",
        )
    )

    assert event is not None

    assert (
        event.actor_type
        == "client"
    )

    assert (
        event.actor_name
        == "Jean Dupont"
    )

    assert (
        event.actor_contact_id
        == data["contact"].id
    )

    assert (
        event.effective_context
        == "assurance"
    )

    assert (
        event.source_type
        == "client_360"
    )

    assert (
        event.after_data[
            "reference"
        ]
        == payload["reference"]
    )
