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
from app.models.opportunity import (
    Opportunity,
)
from app.models.opportunity_handoff import (
    OpportunityHandoff,
)
from app.models.organizational_unit import (
    OrganizationalUnit,
)
from app.schemas.auth import (
    AuthContextResponse,
)
from app.schemas.opportunity_handoff import (
    HandoffTargetListResponse,
    HandoffTargetUnitResponse,
    OpportunityHandoffCreate,
    OpportunityHandoffDetailResponse,
    OpportunityHandoffStatusUpdate,
)
from app.services.handoff_event_service import (
    record_handoff_governance,
)

from app.services.opportunity_handoff_service import (
    update_handoff_status,
)


router = APIRouter(
    tags=[
        "Growth Engine - Handoffs"
    ],
)


EXCLUDED_TARGET_CODES = {
    "KEMS",
    "DIRECTION",
    "COMMERCIAL",
}


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


def membership_unit_codes(
    auth: AuthContextResponse,
) -> set[str]:
    return {
        membership.unit.code
        .strip()
        .upper()
        for membership
        in auth.memberships
    }


def membership_unit_ids(
    auth: AuthContextResponse,
) -> set[str]:
    return {
        membership.unit.id
        for membership
        in auth.memberships
    }


def has_commercial_scope(
    auth: AuthContextResponse,
) -> bool:
    return (
        auth.projection
        == "commercial"
        or "COMMERCIAL"
        in membership_unit_codes(
            auth
        )
    )


def can_orchestrate_handoffs(
    auth: AuthContextResponse,
) -> bool:
    return (
        is_direction(auth)
        or has_commercial_scope(
            auth
        )
    )


def can_read_handoff(
    auth: AuthContextResponse,
    handoff: OpportunityHandoff,
) -> bool:
    if (
        is_direction(auth)
        or has_commercial_scope(
            auth
        )
    ):
        return True

    return (
        handoff.target_unit_id
        in membership_unit_ids(
            auth
        )
    )


def can_process_handoff(
    auth: AuthContextResponse,
    handoff: OpportunityHandoff,
) -> bool:
    if is_direction(auth):
        return True

    # Commercial seul orchestre mais ne traite pas
    # à la place du métier.
    return (
        handoff.target_unit_id
        in membership_unit_ids(
            auth
        )
    )


def require_handoff_orchestration(
    auth: AuthContextResponse,
) -> None:
    require_internal_context(
        auth
    )

    if not can_orchestrate_handoffs(
        auth
    ):
        raise HTTPException(
            status_code=403,
            detail=(
                "La transmission des "
                "opportunités est réservée "
                "à la Direction et au "
                "Commercial."
            ),
        )


def require_handoff_read(
    auth: AuthContextResponse,
    handoff: OpportunityHandoff,
) -> None:
    require_internal_context(
        auth
    )

    if not can_read_handoff(
        auth,
        handoff,
    ):
        raise HTTPException(
            status_code=404,
            detail=(
                "Handoff métier "
                "introuvable."
            ),
        )


def require_handoff_processing(
    auth: AuthContextResponse,
    handoff: OpportunityHandoff,
) -> None:
    require_internal_context(
        auth
    )

    if not can_process_handoff(
        auth,
        handoff,
    ):
        raise HTTPException(
            status_code=403,
            detail=(
                "Ce handoff appartient "
                "à une autre unité métier."
            ),
        )


def normalize_unit_code(
    code: str,
) -> str:
    return (
        code.strip().upper()
    )


def is_handoff_target(
    unit: OrganizationalUnit,
) -> bool:
    return (
        unit.is_active
        and normalize_unit_code(
            unit.code
        )
        not in EXCLUDED_TARGET_CODES
    )


def get_opportunity_or_404(
    db: Session,
    opportunity_id: str,
) -> Opportunity:
    opportunity = db.get(
        Opportunity,
        opportunity_id,
    )

    if not opportunity:
        raise HTTPException(
            status_code=404,
            detail=(
                "Opportunité introuvable."
            ),
        )

    return opportunity


def get_handoff_or_404(
    db: Session,
    opportunity_id: str,
) -> OpportunityHandoff:
    handoff = db.scalar(
        select(
            OpportunityHandoff
        ).where(
            OpportunityHandoff
            .opportunity_id
            == opportunity_id
        )
    )

    if not handoff:
        raise HTTPException(
            status_code=404,
            detail=(
                "Aucun handoff métier "
                "pour cette opportunité."
            ),
        )

    return handoff


def handoff_to_response(
    db: Session,
    handoff: OpportunityHandoff,
):
    unit = db.get(
        OrganizationalUnit,
        handoff.target_unit_id,
    )

    if not unit:
        raise HTTPException(
            status_code=409,
            detail=(
                "L'unité cible du handoff "
                "n'existe plus."
            ),
        )

    return (
        OpportunityHandoffDetailResponse(
            id=handoff.id,
            opportunity_id=(
                handoff.opportunity_id
            ),
            target_unit_id=(
                handoff.target_unit_id
            ),
            status=handoff.status,
            handed_off_at=(
                handoff.handed_off_at
            ),
            handed_off_by_profile_id=(
                handoff
                .handed_off_by_profile_id
            ),
            accepted_at=(
                handoff.accepted_at
            ),
            accepted_by_profile_id=(
                handoff
                .accepted_by_profile_id
            ),
            started_at=(
                handoff.started_at
            ),
            completed_at=(
                handoff.completed_at
            ),
            notes=handoff.notes,
            created_at=(
                handoff.created_at
            ),
            updated_at=(
                handoff.updated_at
            ),
            target_unit=(
                HandoffTargetUnitResponse(
                    id=unit.id,
                    name=unit.name,
                    code=unit.code,
                    unit_type=(
                        unit.unit_type
                    ),
                )
            ),
        )
    )


@router.get(
    "/api/v1/handoff-targets",
    response_model=(
        HandoffTargetListResponse
    ),
)
def list_handoff_targets(
    auth: AuthContextResponse = Depends(
        get_current_auth_context
    ),
    db: Session = Depends(
        get_db
    ),
):
    require_handoff_orchestration(
        auth
    )

    units = db.scalars(
        select(
            OrganizationalUnit
        )
        .where(
            OrganizationalUnit
            .is_active
            .is_(True)
        )
        .order_by(
            OrganizationalUnit
            .name
            .asc()
        )
    ).all()

    items = [
        HandoffTargetUnitResponse(
            id=unit.id,
            name=unit.name,
            code=unit.code,
            unit_type=(
                unit.unit_type
            ),
        )
        for unit
        in units
        if is_handoff_target(
            unit
        )
    ]

    return (
        HandoffTargetListResponse(
            items=items,
        )
    )


@router.post(
    "/api/v1/opportunities/"
    "{opportunity_id}/handoff",
    response_model=(
        OpportunityHandoffDetailResponse
    ),
    status_code=201,
)
def create_opportunity_handoff(
    opportunity_id: str,
    payload:
        OpportunityHandoffCreate,
    auth: AuthContextResponse = Depends(
        get_current_auth_context
    ),
    db: Session = Depends(
        get_db
    ),
):
    require_internal_context(
        auth
    )

    opportunity = (
        get_opportunity_or_404(
            db,
            opportunity_id,
        )
    )

    if (
        opportunity.stage
        == "lost"
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                "Une opportunité perdue "
                "ne peut pas être transmise "
                "à un métier."
            ),
        )

    existing = db.scalar(
        select(
            OpportunityHandoff
        ).where(
            OpportunityHandoff
            .opportunity_id
            == opportunity.id
        )
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail=(
                "Cette opportunité a déjà "
                "été transmise à un métier."
            ),
        )

    target_unit = db.get(
        OrganizationalUnit,
        payload.target_unit_id,
    )

    if not target_unit:
        raise HTTPException(
            status_code=404,
            detail=(
                "Unité métier cible "
                "introuvable."
            ),
        )

    if not target_unit.is_active:
        raise HTTPException(
            status_code=409,
            detail=(
                "L'unité métier cible "
                "est inactive."
            ),
        )

    if not is_handoff_target(
        target_unit
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                "Cette unité ne peut pas "
                "recevoir d'opportunités "
                "du Growth Engine."
            ),
        )

    actor_profile_id = (
        auth.profile.id
        if auth.profile
        else None
    )

    handoff = (
        OpportunityHandoff(
            opportunity_id=(
                opportunity.id
            ),
            target_unit_id=(
                target_unit.id
            ),
            status="handed_off",
            handed_off_by_profile_id=(
                actor_profile_id
            ),
            notes=payload.notes,
        )
    )

    db.add(
        handoff
    )

    db.flush()

    record_handoff_governance(
        db,
        auth=auth,
        opportunity=opportunity,
        handoff=handoff,
        target_unit=target_unit,
        effective_context="commercial",
        previous_status=None,
    )

    db.commit()

    db.refresh(
        handoff
    )

    return handoff_to_response(
        db,
        handoff,
    )


@router.get(
    "/api/v1/opportunities/"
    "{opportunity_id}/handoff",
    response_model=(
        OpportunityHandoffDetailResponse
    ),
)
def get_opportunity_handoff(
    opportunity_id: str,
    auth: AuthContextResponse = Depends(
        get_current_auth_context
    ),
    db: Session = Depends(
        get_db
    ),
):
    require_internal_context(
        auth
    )

    handoff = (
        get_handoff_or_404(
            db,
            opportunity_id,
        )
    )

    require_handoff_read(
        auth,
        handoff,
    )

    return handoff_to_response(
        db,
        handoff,
    )


@router.get(
    "/api/v1/handoffs",
    response_model=list[
        OpportunityHandoffDetailResponse
    ],
)
def list_handoffs(
    target_unit_id:
        str | None = Query(
            default=None
        ),
    status:
        str | None = Query(
            default=None
        ),
    auth: AuthContextResponse = Depends(
        get_current_auth_context
    ),
    db: Session = Depends(
        get_db
    ),
):
    require_internal_context(
        auth
    )

    allowed_unit_ids = (
        membership_unit_ids(
            auth
        )
    )

    statement = (
        select(
            OpportunityHandoff
        )
        .order_by(
            OpportunityHandoff
            .handed_off_at
            .desc()
        )
    )

    if (
        not is_direction(auth)
        and not has_commercial_scope(
            auth
        )
    ):
        if not allowed_unit_ids:
            return []

        statement = (
            statement.where(
                OpportunityHandoff
                .target_unit_id
                .in_(
                    allowed_unit_ids
                )
            )
        )

    if target_unit_id:
        if (
            not is_direction(auth)
            and not has_commercial_scope(
                auth
            )
            and target_unit_id
            not in allowed_unit_ids
        ):
            raise HTTPException(
                status_code=403,
                detail=(
                    "Cette unité métier "
                    "n'est pas autorisée."
                ),
            )

        statement = (
            statement.where(
                OpportunityHandoff
                .target_unit_id
                == target_unit_id
            )
        )

    if status:
        statement = (
            statement.where(
                OpportunityHandoff
                .status
                == status.strip().lower()
            )
        )

    handoffs = db.scalars(
        statement
    ).all()

    return [
        handoff_to_response(
            db,
            handoff,
        )
        for handoff
        in handoffs
    ]


@router.post(
    "/api/v1/opportunities/"
    "{opportunity_id}/handoff/status",
    response_model=(
        OpportunityHandoffDetailResponse
    ),
)
def change_handoff_status(
    opportunity_id: str,
    payload:
        OpportunityHandoffStatusUpdate,
    auth: AuthContextResponse = Depends(
        get_current_auth_context
    ),
    db: Session = Depends(
        get_db
    ),
):
    require_internal_context(
        auth
    )

    handoff = (
        get_handoff_or_404(
            db,
            opportunity_id,
        )
    )

    require_handoff_processing(
        auth,
        handoff,
    )

    opportunity = (
        get_opportunity_or_404(
            db,
            opportunity_id,
        )
    )

    target_unit = db.get(
        OrganizationalUnit,
        handoff.target_unit_id,
    )

    if not target_unit:
        raise HTTPException(
            status_code=409,
            detail=(
                "L'unité cible du handoff "
                "n'existe plus."
            ),
        )

    actor_profile_id = (
        auth.profile.id
        if auth.profile
        else None
    )

    previous_status = (
        handoff.status
    )

    update_handoff_status(
        handoff,
        new_status=(
            payload.status
        ),
        actor_profile_id=(
            actor_profile_id
        ),
    )

    if (
        previous_status
        != handoff.status
    ):
        db.flush()

        record_handoff_governance(
            db,
            auth=auth,
            opportunity=opportunity,
            handoff=handoff,
            target_unit=target_unit,
            effective_context=(
                target_unit.code
                .strip()
                .lower()
            ),
            previous_status=(
                previous_status
            ),
        )

    db.commit()

    db.refresh(
        handoff
    )

    return handoff_to_response(
        db,
        handoff,
    )
