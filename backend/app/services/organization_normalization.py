from urllib.parse import urlparse, urlunparse

from app.services.contact_normalization import (
    normalize_email,
    normalize_phone,
    normalize_text,
)


def normalize_website(
    value: str | None,
) -> str | None:
    value = normalize_text(value)

    if not value:
        return None

    if not value.startswith(
        ("http://", "https://")
    ):
        value = f"https://{value}"

    parsed = urlparse(value)

    scheme = parsed.scheme.lower() or "https"
    netloc = parsed.netloc.lower()

    path = parsed.path.rstrip("/")

    return urlunparse(
        (
            scheme,
            netloc,
            path,
            "",
            "",
            "",
        )
    )


def extract_domain(
    website: str | None,
    email: str | None = None,
) -> str | None:
    if website:
        parsed = urlparse(website)

        domain = parsed.netloc.lower()

        if domain.startswith("www."):
            domain = domain[4:]

        return domain or None

    if email and "@" in email:
        return email.split("@", 1)[1].lower()

    return None


def normalize_organization_payload(
    *,
    name: str | None = None,
    legal_name: str | None = None,
    industry: str | None = None,
    website: str | None = None,
    email: str | None = None,
    phone: str | None = None,
    country: str | None = None,
    city: str | None = None,
    address: str | None = None,
):
    normalized_website = normalize_website(
        website
    )

    normalized_email = normalize_email(
        email
    )

    normalized_phone = normalize_phone(
        phone
    )

    return {
        "name": normalize_text(name),
        "legal_name": normalize_text(
            legal_name
        ),
        "industry": normalize_text(
            industry
        ),
        "website": normalized_website,
        "domain": extract_domain(
            normalized_website,
            normalized_email,
        ),
        "email": normalized_email,
        "phone": normalized_phone,
        "country": normalize_text(
            country
        ),
        "city": normalize_text(
            city
        ),
        "address": normalize_text(
            address
        ),
    }
