def contact_payload():
    return {
        "first_name": "Sophie",
        "last_name": "Martin",
        "job_title": "Responsable RH",
        "email": " SOPHIE.MARTIN@ACME.CH ",
        "phone": "+41 79 555 12 34",
        "linkedin_url": (
            "linkedin.com/in/sophie-martin"
        ),
        "decision_role": "decision_maker",
        "organization_id": None,
        "source_type": "csv",
        "source_reference": (
            "pytest-import.csv"
        ),
        "notes": "Import test",
    }


def test_contact_ingestion_creates_contact(
    client,
):
    response = client.post(
        "/api/v1/core/ingestion/contacts",
        json=contact_payload(),
    )

    assert response.status_code == 201

    data = response.json()

    assert data["status"] == "created"
    assert data["entity_id"] is not None

    assert (
        data["candidate_entity_id"]
        is None
    )


def test_contact_ingestion_matches_exact(
    client,
):
    payload = contact_payload()

    first = client.post(
        "/api/v1/core/ingestion/contacts",
        json=payload,
    )

    second = client.post(
        "/api/v1/core/ingestion/contacts",
        json=payload,
    )

    assert first.status_code == 201
    assert second.status_code == 201

    data = second.json()

    assert (
        data["status"]
        == "matched_existing"
    )

    assert data["match_score"] == 100

    assert (
        data["match_reason"]
        == "same_email"
    )

    assert (
        data["entity_id"]
        == first.json()["entity_id"]
    )


def test_contact_ingestion_requires_review(
    client,
):
    first = client.post(
        "/api/v1/core/ingestion/contacts",
        json=contact_payload(),
    )

    assert first.status_code == 201

    possible_duplicate = {
        "first_name": "SOPHIE",
        "last_name": "MARTIN",
        "job_title": "HR Manager",
        "email": "other@test.ch",
        "phone": "+41 78 999 99 99",
        "linkedin_url": None,
        "decision_role": "unknown",
        "organization_id": None,
        "source_type": "scraping",
        "source_reference": "pytest-source",
        "notes": None,
    }

    second = client.post(
        "/api/v1/core/ingestion/contacts",
        json=possible_duplicate,
    )

    assert second.status_code == 201

    data = second.json()

    assert (
        data["status"]
        == "requires_review"
    )

    assert data["match_score"] == 80

    assert (
        data["match_reason"]
        == "same_normalized_name"
    )

    assert (
        data["candidate_entity_id"]
        == first.json()["entity_id"]
    )

    assert data["entity_id"] is None
