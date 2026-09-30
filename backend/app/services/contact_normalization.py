import re
from urllib.parse import urlparse, urlunparse


def normalize_text(value: str | None) -> str | None:
    if value is None:
        return None

    cleaned = " ".join(value.strip().split())

    return cleaned or None


def normalize_email(value: str | None) -> str | None:
    value = normalize_text(value)

    if not value:
        return None

    return value.lower()


def normalize_phone(value: str | None) -> str | None:
    value = normalize_text(value)

    if not value:
        return None

    has_plus = value.startswith("+")

    digits = re.sub(r"\D", "", value)

    if not digits:
        return None

    if has_plus:
        return f"+{digits}"

    return digits


def normalize_url(value: str | None) -> str | None:
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
