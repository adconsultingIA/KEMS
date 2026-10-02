from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import (
    get_current_auth_context,
    require_bearer_token,
)
from app.models.auth_account import AuthAccount
from app.schemas.auth import (
    AuthContextResponse,
    LoginRequest,
    LoginResponse,
)
from app.services.auth_service import (
    build_auth_context,
    create_session,
    get_session_account,
    normalize_email,
    utcnow,
    verify_password,
)


router = APIRouter(
    prefix="/api/v1/auth",
    tags=["Authentication"],
)



@router.post(
    "/login",
    response_model=LoginResponse,
)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db),
):
    email = normalize_email(
        payload.email
    )

    account = db.scalar(
        select(AuthAccount).where(
            AuthAccount.email == email,
            AuthAccount.is_active
            .is_(True),
        )
    )

    if (
        not account
        or not verify_password(
            payload.password,
            account.password_hash,
        )
    ):
        raise HTTPException(
            status_code=401,
            detail=(
                "Email ou mot de passe "
                "incorrect."
            ),
        )

    account.last_login_at = utcnow()

    raw_token, auth_session = (
        create_session(
            db,
            account,
        )
    )

    db.refresh(account)

    return LoginResponse(
        access_token=raw_token,
        expires_at=(
            auth_session.expires_at
        ),
        context=build_auth_context(
            db,
            account,
        ),
    )


@router.get(
    "/me",
    response_model=AuthContextResponse,
)
def me(
    context: AuthContextResponse = Depends(
        get_current_auth_context
    ),
):
    return context


@router.post(
    "/logout",
    status_code=204,
)
def logout(
    raw_token: str = Depends(
        require_bearer_token
    ),
    db: Session = Depends(get_db),
):
    auth_session, _ = (
        get_session_account(
            db,
            raw_token,
        )
    )

    db.delete(auth_session)
    db.commit()

    return None
