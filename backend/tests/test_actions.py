from app.models.contact import Contact
from app.models.organization import Organization
from app.models.organizational_unit import (
    OrganizationalUnit,
)
from app.models.profile import Profile


def create_action_foundation_data(
    db_session,
):
    profile = Profile(
        full_name="Parfait ADJANOR",
        email="parfait.actions@kems.test",
        role="technologies",
    )

    unit = OrganizationalUnit(
        name="Technologies",
        code="TECHNOLOGIES_ACTIONS",
        unit_type="business_unit",
    )

    organization = Organization(
        name="Acme SA",
        normalized_name="acme sa",
    )

    db_session.add_all(
        [
            profile,
            unit,
            organization,
        ]
    )

    db_session.flush()

    contact = Contact(
        first_name="Sophie",
        last_name="Martin",
        normalized_name="sophie martin",
        email="sophie@acme.test",
        organization_id=organization.id,
    )

    db_session.add(contact)
    db_session.commit()

    return {
        "profile": profile,
        "unit": unit,
        "organization": organization,
        "contact": contact,
    }


def test_create_and_filter_action(
    client,
    db_session,
):
    data = (
        create_action_foundation_data(
            db_session
        )
    )

    response = client.post(
        "/api/v1/core/actions",
        json={
            "title": (
                "Relancer le devis "
                "Technologies"
            ),
            "description": (
                "Relancer le client "
                "avant vendredi."
            ),
            "priority": "high",
            "context": "technologies",
            "owner_profile_id": (
                data["profile"].id
            ),
            "unit_id": (
                data["unit"].id
            ),
            "contact_id": (
                data["contact"].id
            ),
            "organization_id": (
                data["organization"].id
            ),
            "source_type": "quote",
            "source_entity_type": "quote",
            "source_entity_id": "quote-001",
            "created_by_profile_id": (
                data["profile"].id
            ),
        },
    )

    assert response.status_code == 201

    payload = response.json()

    assert (
        payload["status"]
        == "todo"
    )

    assert (
        payload["priority"]
        == "high"
    )

    assert (
        payload["context"]
        == "technologies"
    )

    assert (
        payload[
            "owner_profile_id"
        ]
        == data["profile"].id
    )

    filtered = client.get(
        (
            "/api/v1/core/actions"
            "?context=technologies"
            "&priority=high"
        )
    )

    assert filtered.status_code == 200
    assert len(
        filtered.json()
    ) == 1


def test_complete_and_reopen_action(
    client,
):
    created = client.post(
        "/api/v1/core/actions",
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
        json={
            "status": "done",
        },
    )

    assert completed.status_code == 200

    assert (
        completed.json()["status"]
        == "done"
    )

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
        json={
            "status": "in_progress",
        },
    )

    assert reopened.status_code == 200

    assert (
        reopened.json()["status"]
        == "in_progress"
    )

    assert (
        reopened.json()[
            "completed_at"
        ]
        is None
    )


def test_invalid_action_reference_is_rejected(
    client,
):
    response = client.post(
        "/api/v1/core/actions",
        json={
            "title": (
                "Action impossible"
            ),
            "context": "assurance",
            "owner_profile_id": (
                "profil-inexistant"
            ),
        },
    )

    assert response.status_code == 404

    assert (
        response.json()["detail"]
        == (
            "Collaborateur assigné "
            "introuvable."
        )
    )
