def test_create_organization_normalizes_data(
    client,
):
    response = client.post(
        "/api/v1/core/organizations",
        json={
            "name": "Example Consulting SA",
            "legal_name": (
                "Example Consulting SA"
            ),
            "organization_type": "company",
            "industry": "Consulting",
            "website": (
                "www.example-consulting.ch"
            ),
            "email": (
                " CONTACT@EXAMPLE-CONSULTING.CH "
            ),
            "phone": "+41 22 555 12 34",
            "country": "Suisse",
            "city": "Genève",
            "address": "Rue Exemple 10",
            "source_type": "manual",
            "source_reference": "pytest",
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert (
        data["website"]
        == "https://www.example-consulting.ch"
    )

    assert (
        data["domain"]
        == "example-consulting.ch"
    )

    assert (
        data["email"]
        == "contact@example-consulting.ch"
    )

    assert (
        data["phone"]
        == "+41225551234"
    )

    assert (
        data["is_active"]
        is True
    )


def test_duplicate_organization_is_rejected(
    client,
):
    payload = {
        "name": "Example Consulting SA",
        "website": (
            "https://example-consulting.ch"
        ),
        "source_type": "manual",
    }

    first = client.post(
        "/api/v1/core/organizations",
        json=payload,
    )

    second = client.post(
        "/api/v1/core/organizations",
        json=payload,
    )

    assert first.status_code == 201
    assert second.status_code == 409
