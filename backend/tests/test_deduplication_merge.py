def create_contact(
    client,
    *,
    first_name,
    last_name,
    email,
    phone,
):
    response = client.post(
        "/api/v1/core/contacts",
        json={
            "first_name": first_name,
            "last_name": last_name,
            "email": email,
            "phone": phone,
            "source_type": "manual",
            "source_reference": "pytest",
        },
    )

    assert response.status_code == 201

    return response.json()


def test_duplicate_detection_and_merge(
    client,
):
    canonical = create_contact(
        client,
        first_name="Jean",
        last_name="Dupont",
        email="jean@example.com",
        phone="+41 79 111 11 11",
    )

    duplicate = create_contact(
        client,
        first_name="JEAN",
        last_name="DUPONT",
        email="other@example.com",
        phone="+41 79 222 22 22",
    )

    candidates = client.get(
        "/api/v1/core/deduplication/contacts"
    )

    assert candidates.status_code == 200

    candidate_data = candidates.json()

    assert candidate_data["total"] == 1

    candidate = (
        candidate_data["candidates"][0]
    )

    assert candidate["score"] == 80

    assert (
        candidate["confidence"]
        == "possible"
    )

    merge = client.post(
        (
            "/api/v1/core/"
            "deduplication/contacts/merge"
        ),
        json={
            "canonical_contact_id": (
                canonical["id"]
            ),
            "duplicate_contact_id": (
                duplicate["id"]
            ),
            "confirmed": True,
            "reason": (
                "Pytest controlled merge."
            ),
        },
    )

    assert merge.status_code == 201

    merge_data = merge.json()

    assert (
        merge_data[
            "canonical_contact_id"
        ]
        == canonical["id"]
    )

    assert (
        merge_data[
            "duplicate_contact_id"
        ]
        == duplicate["id"]
    )

    after_merge = client.get(
        "/api/v1/core/deduplication/contacts"
    )

    assert after_merge.status_code == 200
    assert (
        after_merge.json()["total"]
        == 0
    )

    active_contacts = client.get(
        "/api/v1/core/contacts"
    )

    assert active_contacts.status_code == 200

    ids = {
        contact["id"]
        for contact in active_contacts.json()
    }

    assert canonical["id"] in ids
    assert duplicate["id"] not in ids

    all_contacts = client.get(
        "/api/v1/core/contacts",
        params={
            "active_only": False,
        },
    )

    assert all_contacts.status_code == 200

    duplicate_after_merge = next(
        contact
        for contact in all_contacts.json()
        if contact["id"]
        == duplicate["id"]
    )

    assert (
        duplicate_after_merge[
            "is_active"
        ]
        is False
    )

    assert (
        duplicate_after_merge[
            "merged_into_contact_id"
        ]
        == canonical["id"]
    )

    history = client.get(
        (
            "/api/v1/core/"
            "deduplication/contact-merges"
        )
    )

    assert history.status_code == 200
    assert len(history.json()) == 1
