from fastapi import Depends, HTTPException
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.auth import AuthContextResponse
from app.services.auth_service import (
    build_auth_context,
    get_session_account,
)


bearer_scheme = HTTPBearer(
    auto_error=False
)


def require_bearer_token(
    credentials: (
        HTTPAuthorizationCredentials
        | None
    ) = Depends(bearer_scheme),
) -> str:
    if (
        not credentials
        or credentials.scheme.lower()
        != "bearer"
    ):
        raise HTTPException(
            status_code=401,
            detail="Authentification requise.",
        )

    return credentials.credentials


def get_current_auth_context(
    raw_token: str = Depends(
        require_bearer_token
    ),
    db: Session = Depends(get_db),
) -> AuthContextResponse:
    _, account = get_session_account(
        db,
        raw_token,
    )

    return build_auth_context(
        db,
        account,
    )
