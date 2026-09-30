def test_contact_organization_relationship(
    client,
):
    organization_response = client.post(
        "/api/v1/core/organizations",
        json={
            "name": "Acme SA",
            "website": "acme.ch",
            "source_type": "manual",
        },
    )

    assert (
        organization_response.status_code
        == 201
    )

    organization = (
        organization_response.json()
    )

    contact_response = client.post(
        "/api/v1/core/contacts",
        json={
            "first_name": "Alice",
            "last_name": "Durand",
            "email": "alice@acme.ch",
            "source_type": "manual",
        },
    )

    assert (
        contact_response.status_code
        == 201
    )

    contact = contact_response.json()

    link_response = client.post(
        (
            "/api/v1/core/"
            "contact-organizations"
        ),
        json={
            "contact_id": contact["id"],
            "organization_id": (
                organization["id"]
            ),
            "relationship_type": (
                "employee"
            ),
            "job_title": "CEO",
            "relationship_role": (
                "decision_maker"
            ),
            "is_primary": True,
            "started_at": "2026-01-01",
        },
    )

    assert (
        link_response.status_code
        == 201
    )

    link = link_response.json()

    assert link["is_primary"] is True
    assert link["is_active"] is True

    refreshed_contact = client.get(
        (
            "/api/v1/core/contacts/"
            f"{contact['id']}"
        )
    )

    assert (
        refreshed_contact.status_code
        == 200
    )

    assert (
        refreshed_contact.json()[
            "organization_id"
        ]
        == organization["id"]
    )
