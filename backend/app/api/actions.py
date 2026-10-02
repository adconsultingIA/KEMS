from datetime import UTC, datetime

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
)
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import (
    get_current_auth_context,
)
from app.models.action import Action
from app.models.contact import Contact
from app.models.organization import Organization
from app.models.organizational_unit import (
    OrganizationalUnit,
)
from app.models.profile import Profile
from app.models.user_membership import (
    UserMembership,
)
from app.schemas.action import (
    ActionCreate,
    ActionResponse,
    ActionUpdate,
)
from app.schemas.auth import (
    AuthContextResponse,
)
from app.services.activity_service import (
    record_action_created_activity,
    record_action_lifecycle_activities,
)
from app.services.auth_service import (
    projection_from_unit,
)


router = APIRouter(
    prefix="/api/v1/core/actions",
    tags=["KEMS Core - Actions"],
)


def utcnow():
    return datetime.now(
        UTC
    ).replace(
        tzinfo=None
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
        and auth.projection == "direction"
    )


def get_action_or_404(
    db: Session,
    action_id: str,
) -> Action:
    action = db.get(
        Action,
        action_id,
    )

    if not action:
        raise HTTPException(
            status_code=404,
            detail="Action introuvable.",
        )

    return action


def ensure_action_visible(
    action: Action,
    auth: AuthContextResponse,
):
    if is_direction(auth):
        return

    if (
        action.context
        != auth.projection
    ):
        raise HTTPException(
            status_code=404,
            detail="Action introuvable.",
        )


def resolve_context_filter(
    auth: AuthContextResponse,
    requested_context: str | None,
) -> str | None:
    require_internal_context(auth)

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


def ensure_reference_exists(
    db: Session,
    model,
    value: str | None,
    label: str,
):
    if not value:
        return

    entity = db.get(
        model,
        value,
    )

    if not entity:
        raise HTTPException(
            status_code=404,
            detail=f"{label} introuvable.",
        )


def validate_references(
    db: Session,
    *,
    owner_profile_id: str | None = None,
    unit_id: str | None = None,
    contact_id: str | None = None,
    organization_id: str | None = None,
):
    ensure_reference_exists(
        db,
        Profile,
        owner_profile_id,
        "Collaborateur assigné",
    )

    ensure_reference_exists(
        db,
        OrganizationalUnit,
        unit_id,
        "Unité",
    )

    ensure_reference_exists(
        db,
        Contact,
        contact_id,
        "Contact",
    )

    ensure_reference_exists(
        db,
        Organization,
        organization_id,
        "Organisation",
    )


def profile_has_context(
    db: Session,
    profile_id: str,
    context: str,
) -> bool:
    memberships = db.scalars(
        select(UserMembership).where(
            UserMembership.user_id
            == profile_id,
            UserMembership.is_active
            .is_(True),
        )
    ).all()

    for membership in memberships:
        unit = db.get(
            OrganizationalUnit,
            membership.unit_id,
        )

        if (
            unit
            and unit.is_active
            and projection_from_unit(
                unit
            )
            == context
        ):
            return True

    return False


def profile_contexts(
    db: Session,
    profile_id: str,
) -> list[str]:
    memberships = db.scalars(
        select(UserMembership).where(
            UserMembership.user_id
            == profile_id,
            UserMembership.is_active
            .is_(True),
        )
    ).all()

    contexts: list[str] = []

    for membership in memberships:
        unit = db.get(
            OrganizationalUnit,
            membership.unit_id,
        )

        if (
            not unit
            or not unit.is_active
        ):
            continue

        context = projection_from_unit(
            unit
        )

        if (
            context
            and context
            not in contexts
        ):
            contexts.append(
                context
            )

    return contexts


def validate_assignment_scope(
    db: Session,
    auth: AuthContextResponse,
    *,
    context: str,
    owner_profile_id: str | None,
    unit_id: str | None,
):
    direction_special_context = (
        is_direction(auth)
        and context
        in {
            "direction",
            "core",
        }
    )

    if (
        owner_profile_id
        and not direction_special_context
    ):
        if not profile_has_context(
            db,
            owner_profile_id,
            context,
        ):
            raise HTTPException(
                status_code=403,
                detail=(
                    "Le collaborateur assigné "
                    "n'appartient pas à ce "
                    "contexte métier."
                ),
            )

    if unit_id:
        unit = db.get(
            OrganizationalUnit,
            unit_id,
        )

        if (
            unit
            and not direction_special_context
            and projection_from_unit(
                unit
            )
            != context
        ):
            raise HTTPException(
                status_code=403,
                detail=(
                    "L'unité sélectionnée "
                    "n'appartient pas à ce "
                    "contexte métier."
                ),
            )


@router.post(
    "",
    response_model=ActionResponse,
    status_code=201,
)
def create_action(
    payload: ActionCreate,
    auth: AuthContextResponse = Depends(
        get_current_auth_context
    ),
    db: Session = Depends(get_db),
):
    require_internal_context(auth)

    target_context = resolve_context_filter(
        auth,
        payload.context,
    )

    assert target_context is not None

    validate_references(
        db,
        owner_profile_id=(
            payload.owner_profile_id
        ),
        unit_id=payload.unit_id,
        contact_id=payload.contact_id,
        organization_id=(
            payload.organization_id
        ),
    )

    validate_assignment_scope(
        db,
        auth,
        context=target_context,
        owner_profile_id=(
            payload.owner_profile_id
        ),
        unit_id=payload.unit_id,
    )

    title = payload.title.strip()

    if not title:
        raise HTTPException(
            status_code=422,
            detail=(
                "Le titre de l'action "
                "est obligatoire."
            ),
        )

    action = Action(
        title=title,
        description=(
            payload.description.strip()
            if payload.description
            else None
        ),
        status=payload.status,
        priority=payload.priority,
        context=target_context,
        owner_profile_id=(
            payload.owner_profile_id
        ),
        unit_id=payload.unit_id,
        contact_id=payload.contact_id,
        organization_id=(
            payload.organization_id
        ),
        source_type=(
            payload.source_type.strip()
            or "manual"
        ),
        source_entity_type=(
            payload.source_entity_type
        ),
        source_entity_id=(
            payload.source_entity_id
        ),
        created_by_profile_id=(
            auth.profile.id
        ),
        due_at=payload.due_at,
        completed_at=(
            utcnow()
            if payload.status == "done"
            else None
        ),
    )

    db.add(action)
    db.flush()

    record_action_created_activity(
        db,
        action=action,
        actor_type="internal",
        actor_profile_id=(
            auth.profile.id
        ),
    )

    db.commit()
    db.refresh(action)

    return action


@router.get(
    "",
    response_model=list[ActionResponse],
)
def list_actions(
    status: str | None = Query(
        default=None
    ),
    priority: str | None = Query(
        default=None
    ),
    context: str | None = Query(
        default=None
    ),
    owner_profile_id: str | None = Query(
        default=None
    ),
    unit_id: str | None = Query(
        default=None
    ),
    contact_id: str | None = Query(
        default=None
    ),
    organization_id: str | None = Query(
        default=None
    ),
    source_type: str | None = Query(
        default=None
    ),
    mine: bool = Query(
        default=False
    ),
    search: str | None = Query(
        default=None
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
        Action
    )

    if scoped_context:
        statement = statement.where(
            Action.context
            == scoped_context
        )

    if status:
        statement = statement.where(
            Action.status == status
        )

    if priority:
        statement = statement.where(
            Action.priority == priority
        )

    if mine:
        statement = statement.where(
            Action.owner_profile_id
            == auth.profile.id
        )

    elif owner_profile_id:
        statement = statement.where(
            Action.owner_profile_id
            == owner_profile_id
        )

    if unit_id:
        statement = statement.where(
            Action.unit_id == unit_id
        )

    if contact_id:
        statement = statement.where(
            Action.contact_id
            == contact_id
        )

    if organization_id:
        statement = statement.where(
            Action.organization_id
            == organization_id
        )

    if source_type:
        statement = statement.where(
            Action.source_type
            == source_type
        )

    if search:
        term = (
            f"%{search.strip()}%"
        )

        statement = statement.where(
            or_(
                Action.title.ilike(term),
                Action.description.ilike(
                    term
                ),
                Action.source_entity_type.ilike(
                    term
                ),
            )
        )

    statement = statement.order_by(
        Action.created_at.desc()
    )

    return db.scalars(
        statement
    ).all()


@router.get(
    "/assignees",
)
def list_action_assignees(
    auth: AuthContextResponse = Depends(
        get_current_auth_context
    ),
    db: Session = Depends(get_db),
):
    require_internal_context(auth)

    profiles = db.scalars(
        select(Profile).where(
            Profile.is_active
            .is_(True)
        ).order_by(
            Profile.full_name
        )
    ).all()

    result = []

    for profile in profiles:
        contexts = profile_contexts(
            db,
            profile.id,
        )

        if (
            not is_direction(auth)
            and auth.projection
            not in contexts
        ):
            continue

        result.append(
            {
                "id":
                    profile.id,
                "full_name":
                    profile.full_name,
                "email":
                    profile.email,
                "contexts":
                    contexts,
            }
        )

    return result


@router.get(
    "/{action_id}",
    response_model=ActionResponse,
)
def get_action(
    action_id: str,
    auth: AuthContextResponse = Depends(
        get_current_auth_context
    ),
    db: Session = Depends(get_db),
):
    require_internal_context(auth)

    action = get_action_or_404(
        db,
        action_id,
    )

    ensure_action_visible(
        action,
        auth,
    )

    return action


@router.patch(
    "/{action_id}",
    response_model=ActionResponse,
)
def update_action(
    action_id: str,
    payload: ActionUpdate,
    auth: AuthContextResponse = Depends(
        get_current_auth_context
    ),
    db: Session = Depends(get_db),
):
    require_internal_context(auth)

    action = get_action_or_404(
        db,
        action_id,
    )

    ensure_action_visible(
        action,
        auth,
    )

    data = payload.model_dump(
        exclude_unset=True
    )

    previous_owner_profile_id = (
        action.owner_profile_id
    )

    previous_status = (
        action.status
    )

    target_context = data.get(
        "context",
        action.context,
    )

    if not is_direction(auth):
        if (
            target_context
            != auth.projection
        ):
            raise HTTPException(
                status_code=403,
                detail=(
                    "Ce contexte métier "
                    "n'est pas autorisé."
                ),
            )

    validate_references(
        db,
        owner_profile_id=data.get(
            "owner_profile_id"
        ),
        unit_id=data.get(
            "unit_id"
        ),
        contact_id=data.get(
            "contact_id"
        ),
        organization_id=data.get(
            "organization_id"
        ),
    )

    validate_assignment_scope(
        db,
        auth,
        context=target_context,
        owner_profile_id=data.get(
            "owner_profile_id",
            action.owner_profile_id,
        ),
        unit_id=data.get(
            "unit_id",
            action.unit_id,
        ),
    )

    if "title" in data:
        title = (
            data["title"] or ""
        ).strip()

        if not title:
            raise HTTPException(
                status_code=422,
                detail=(
                    "Le titre de l'action "
                    "est obligatoire."
                ),
            )

        data["title"] = title

    if (
        "description" in data
        and data["description"]
    ):
        data["description"] = (
            data["description"].strip()
        )

    if (
        "source_type" in data
        and data["source_type"]
    ):
        data["source_type"] = (
            data["source_type"].strip()
        )

    if "status" in data:
        if (
            data["status"] == "done"
            and action.status != "done"
        ):
            action.completed_at = (
                utcnow()
            )

        elif (
            data["status"] != "done"
            and action.status == "done"
        ):
            action.completed_at = None

    for key, value in data.items():
        setattr(
            action,
            key,
            value,
        )

    db.flush()

    record_action_lifecycle_activities(
        db,
        action=action,
        previous_owner_profile_id=(
            previous_owner_profile_id
        ),
        previous_status=(
            previous_status
        ),
        actor_profile_id=(
            auth.profile.id
        ),
    )

    db.commit()
    db.refresh(action)

    return action
