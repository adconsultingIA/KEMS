from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import (
    get_current_auth_context,
)
from app.models.activity import Activity
from app.schemas.activity import (
    ActivityResponse,
)
from app.schemas.auth import (
    AuthContextResponse,
)


router = APIRouter(
    prefix="/api/v1/core/activities",
    tags=["KEMS Core - Activities"],
)


def require_internal_context(
    auth: AuthContextResponse,
):
    if (
        auth.account_type != "internal"
        or not auth.profile
    ):
        raise HTTPException(
            status_code=403,
            detail=(
                "Accès réservé aux "
                "collaborateurs KEMS."
            ),
        )


def is_direction(
    auth: AuthContextResponse,
) -> bool:
    return (
        auth.account_type == "internal"
        and auth.projection
        == "direction"
    )


def resolve_context_filter(
    auth: AuthContextResponse,
    requested_context: str | None,
) -> str | None:
    require_internal_context(
        auth
    )

    if is_direction(auth):
        return requested_context

    if (
        requested_context
        and requested_context
        != auth.projection
    ):
        raise HTTPException(
            status_code=403,
            detail=(
                "Ce contexte métier "
                "n'est pas autorisé."
            ),
        )

    return auth.projection


@router.get(
    "",
    response_model=list[
        ActivityResponse
    ],
)
def list_activities(
    context: str | None = Query(
        default=None
    ),
    event_type: str | None = Query(
        default=None
    ),
    contact_id: str | None = Query(
        default=None
    ),
    organization_id: str | None = Query(
        default=None
    ),
    action_id: str | None = Query(
        default=None
    ),
    limit: int = Query(
        default=100,
        ge=1,
        le=500,
    ),
    auth: AuthContextResponse = Depends(
        get_current_auth_context
    ),
    db: Session = Depends(get_db),
):
    scoped_context = (
        resolve_context_filter(
            auth,
            context,
        )
    )

    statement = select(
        Activity
    )

    if scoped_context:
        statement = statement.where(
            Activity.context
            == scoped_context
        )

    if event_type:
        statement = statement.where(
            Activity.event_type
            == event_type
        )

    if contact_id:
        statement = statement.where(
            Activity.contact_id
            == contact_id
        )

    if organization_id:
        statement = statement.where(
            Activity.organization_id
            == organization_id
        )

    if action_id:
        statement = statement.where(
            Activity.action_id
            == action_id
        )

    statement = (
        statement
        .order_by(
            Activity.created_at.desc(),
            Activity.id.desc(),
        )
        .limit(limit)
    )

    return db.scalars(
        statement
    ).all()


@router.get(
    "/{activity_id}",
    response_model=ActivityResponse,
)
def get_activity(
    activity_id: str,
    auth: AuthContextResponse = Depends(
        get_current_auth_context
    ),
    db: Session = Depends(get_db),
):
    require_internal_context(
        auth
    )

    activity = db.get(
        Activity,
        activity_id,
    )

    if not activity:
        raise HTTPException(
            status_code=404,
            detail=(
                "Activité introuvable."
            ),
        )

    if (
        not is_direction(auth)
        and activity.context
        != auth.projection
    ):
        raise HTTPException(
            status_code=404,
            detail=(
                "Activité introuvable."
            ),
        )

    return activity
