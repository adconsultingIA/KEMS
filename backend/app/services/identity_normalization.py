import re
import unicodedata


def strip_accents(value: str) -> str:
    normalized = unicodedata.normalize(
        "NFKD",
        value,
    )

    return "".join(
        char
        for char in normalized
        if not unicodedata.combining(char)
    )


def normalize_identity_key(
    value: str | None,
) -> str | None:
    if not value:
        return None

    value = value.strip().lower()
    value = strip_accents(value)

    value = re.sub(
        r"[^a-z0-9]+",
        " ",
        value,
    )

    value = " ".join(
        value.split()
    )

    return value or None


def build_contact_name_key(
    first_name: str | None,
    last_name: str | None,
) -> str | None:
    parts = [
        value
        for value in (
            first_name,
            last_name,
        )
        if value
    ]

    if not parts:
        return None

    return normalize_identity_key(
        " ".join(parts)
    )


def build_organization_name_key(
    name: str | None,
) -> str | None:
    return normalize_identity_key(
        name
    )
