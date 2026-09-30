from app.models.contact import Contact
from app.models.organization import Organization


def contact_duplicate_score(
    left: Contact,
    right: Contact,
) -> tuple[int, list[str]]:
    score = 0
    reasons = []

    if (
        left.email
        and right.email
        and left.email == right.email
    ):
        score = max(score, 100)
        reasons.append("same_email")

    if (
        left.phone
        and right.phone
        and left.phone == right.phone
    ):
        score = max(score, 100)
        reasons.append("same_phone")

    if (
        left.normalized_name
        and right.normalized_name
        and left.normalized_name
        == right.normalized_name
    ):
        if (
            left.organization_id
            and right.organization_id
            and left.organization_id
            == right.organization_id
        ):
            score = max(score, 90)
            reasons.append(
                "same_name_same_organization"
            )
        else:
            score = max(score, 80)
            reasons.append(
                "same_normalized_name"
            )

    return score, reasons


def organization_duplicate_score(
    left: Organization,
    right: Organization,
) -> tuple[int, list[str]]:
    score = 0
    reasons = []

    if (
        left.domain
        and right.domain
        and left.domain == right.domain
    ):
        score = max(score, 100)
        reasons.append("same_domain")

    if (
        left.email
        and right.email
        and left.email == right.email
    ):
        score = max(score, 100)
        reasons.append("same_email")

    if (
        left.normalized_name
        and right.normalized_name
        and left.normalized_name
        == right.normalized_name
    ):
        same_location = (
            left.country
            and right.country
            and left.country.lower()
            == right.country.lower()
            and left.city
            and right.city
            and left.city.lower()
            == right.city.lower()
        )

        if same_location:
            score = max(score, 90)
            reasons.append(
                "same_name_same_location"
            )
        else:
            score = max(score, 80)
            reasons.append(
                "same_normalized_name"
            )

    return score, reasons
