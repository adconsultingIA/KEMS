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
from app.models.action import Action
from app.models.contact import Contact
from app.models.organization import Organization
from app.models.organizational_unit import OrganizationalUnit
from app.models.profile import Profile
from app.schemas.action import (
    ActionCreate,
    ActionResponse,
    ActionUpdate,
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
    created_by_profile_id: str | None = None,
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

    ensure_reference_exists(
        db,
        Profile,
        created_by_profile_id,
        "Créateur",
    )


@router.post(
    "",
    response_model=ActionResponse,
    status_code=201,
)
def create_action(
    payload: ActionCreate,
    db: Session = Depends(get_db),
):
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
        created_by_profile_id=(
            payload.created_by_profile_id
        ),
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
        context=payload.context,
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
            payload.created_by_profile_id
        ),
        due_at=payload.due_at,
        completed_at=(
            utcnow()
            if payload.status == "done"
            else None
        ),
    )

    db.add(action)
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
    search: str | None = Query(
        default=None
    ),
    db: Session = Depends(get_db),
):
    statement = select(
        Action
    )

    if status:
        statement = statement.where(
            Action.status == status
        )

    if priority:
        statement = statement.where(
            Action.priority == priority
        )

    if context:
        statement = statement.where(
            Action.context == context
        )

    if owner_profile_id:
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
    "/{action_id}",
    response_model=ActionResponse,
)
def get_action(
    action_id: str,
    db: Session = Depends(get_db),
):
    return get_action_or_404(
        db,
        action_id,
    )


@router.patch(
    "/{action_id}",
    response_model=ActionResponse,
)
def update_action(
    action_id: str,
    payload: ActionUpdate,
    db: Session = Depends(get_db),
):
    action = get_action_or_404(
        db,
        action_id,
    )

    data = payload.model_dump(
        exclude_unset=True
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

    db.commit()
    db.refresh(action)

    return action
