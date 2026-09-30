from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.organizational_unit import OrganizationalUnit
from app.models.profile import Profile
from app.models.role import Role
from app.models.team import Team
from app.models.user_membership import UserMembership
from app.schemas.core import (
    CoreOverviewMember,
    CoreOverviewOrganization,
    CoreOverviewResponse,
    CoreOverviewUnit,
    OrganizationalUnitCreate,
    OrganizationalUnitResponse,
    RoleCreate,
    RoleResponse,
    TeamCreate,
    TeamResponse,
    UserMembershipCreate,
    UserMembershipResponse,
)


router = APIRouter(
    prefix="/api/v1/core",
    tags=["KEMS Core"],
)


@router.get(
    "/overview",
    response_model=CoreOverviewResponse,
)
def get_core_overview(
    db: Session = Depends(get_db),
):
    root = db.scalar(
        select(OrganizationalUnit).where(
            OrganizationalUnit.code == "KEMS",
            OrganizationalUnit.is_active.is_(True),
        )
    )

    if not root:
        raise HTTPException(
            status_code=404,
            detail="Organisation racine KEMS introuvable.",
        )

    units = db.scalars(
        select(OrganizationalUnit)
        .where(
            OrganizationalUnit.parent_id == root.id,
            OrganizationalUnit.is_active.is_(True),
        )
        .order_by(
            OrganizationalUnit.name.asc()
        )
    ).all()

    active_memberships = db.scalars(
        select(UserMembership).where(
            UserMembership.is_active.is_(True)
        )
    ).all()

    profile_ids = {
        membership.user_id
        for membership in active_memberships
    }

    role_ids = {
        membership.role_id
        for membership in active_memberships
    }

    profiles = {}

    if profile_ids:
        profile_rows = db.scalars(
            select(Profile).where(
                Profile.id.in_(profile_ids),
                Profile.is_active.is_(True),
            )
        ).all()

        profiles = {
            profile.id: profile
            for profile in profile_rows
        }

    roles = {}

    if role_ids:
        role_rows = db.scalars(
            select(Role).where(
                Role.id.in_(role_ids)
            )
        ).all()

        roles = {
            role.id: role
            for role in role_rows
        }

    memberships_by_unit: dict[str, list[UserMembership]] = {}

    for membership in active_memberships:
        memberships_by_unit.setdefault(
            membership.unit_id,
            [],
        ).append(membership)

    overview_units = []

    for unit in units:
        members = []

        for membership in memberships_by_unit.get(
            unit.id,
            [],
        ):
            profile = profiles.get(
                membership.user_id
            )

            role = roles.get(
                membership.role_id
            )

            if not profile or not role:
                continue

            members.append(
                CoreOverviewMember(
                    id=profile.id,
                    full_name=profile.full_name,
                    email=profile.email,
                    role_code=role.code,
                    role_name=role.name,
                    is_primary=membership.is_primary,
                )
            )

        members.sort(
            key=lambda member: member.full_name.lower()
        )

        overview_units.append(
            CoreOverviewUnit(
                id=unit.id,
                name=unit.name,
                code=unit.code,
                unit_type=unit.unit_type,
                description=unit.description,
                members=members,
            )
        )

    return CoreOverviewResponse(
        organization=CoreOverviewOrganization(
            id=root.id,
            name=root.name,
            code=root.code,
        ),
        units=overview_units,
    )


@router.post(
    "/units",
    response_model=OrganizationalUnitResponse,
    status_code=201,
)
def create_unit(
    payload: OrganizationalUnitCreate,
    db: Session = Depends(get_db),
):
    existing = db.scalar(
        select(OrganizationalUnit).where(
            OrganizationalUnit.code == payload.code
        )
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Une unité avec ce code existe déjà.",
        )

    if payload.parent_id:
        parent = db.get(
            OrganizationalUnit,
            payload.parent_id,
        )

        if not parent:
            raise HTTPException(
                status_code=404,
                detail="Unité parente introuvable.",
            )

    unit = OrganizationalUnit(
        name=payload.name,
        code=payload.code,
        unit_type=payload.unit_type,
        parent_id=payload.parent_id,
        description=payload.description,
    )

    db.add(unit)
    db.commit()
    db.refresh(unit)

    return unit


@router.get(
    "/units",
    response_model=list[OrganizationalUnitResponse],
)
def list_units(
    db: Session = Depends(get_db),
):
    statement = select(
        OrganizationalUnit
    ).order_by(
        OrganizationalUnit.name.asc()
    )

    return db.scalars(statement).all()


@router.post(
    "/teams",
    response_model=TeamResponse,
    status_code=201,
)
def create_team(
    payload: TeamCreate,
    db: Session = Depends(get_db),
):
    unit = db.get(
        OrganizationalUnit,
        payload.unit_id,
    )

    if not unit:
        raise HTTPException(
            status_code=404,
            detail="Unité organisationnelle introuvable.",
        )

    existing = db.scalar(
        select(Team).where(
            Team.code == payload.code
        )
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Une équipe avec ce code existe déjà.",
        )

    team = Team(
        unit_id=payload.unit_id,
        name=payload.name,
        code=payload.code,
        description=payload.description,
    )

    db.add(team)
    db.commit()
    db.refresh(team)

    return team


@router.get(
    "/teams",
    response_model=list[TeamResponse],
)
def list_teams(
    db: Session = Depends(get_db),
):
    statement = select(
        Team
    ).order_by(
        Team.name.asc()
    )

    return db.scalars(statement).all()


@router.post(
    "/roles",
    response_model=RoleResponse,
    status_code=201,
)
def create_role(
    payload: RoleCreate,
    db: Session = Depends(get_db),
):
    existing = db.scalar(
        select(Role).where(
            Role.code == payload.code
        )
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Un rôle avec ce code existe déjà.",
        )

    role = Role(
        code=payload.code,
        name=payload.name,
        description=payload.description,
        is_system=payload.is_system,
    )

    db.add(role)
    db.commit()
    db.refresh(role)

    return role


@router.get(
    "/roles",
    response_model=list[RoleResponse],
)
def list_roles(
    db: Session = Depends(get_db),
):
    statement = select(
        Role
    ).order_by(
        Role.name.asc()
    )

    return db.scalars(statement).all()


@router.post(
    "/memberships",
    response_model=UserMembershipResponse,
    status_code=201,
)
def create_membership(
    payload: UserMembershipCreate,
    db: Session = Depends(get_db),
):
    user = db.get(
        Profile,
        payload.user_id,
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Utilisateur introuvable.",
        )

    unit = db.get(
        OrganizationalUnit,
        payload.unit_id,
    )

    if not unit:
        raise HTTPException(
            status_code=404,
            detail="Unité organisationnelle introuvable.",
        )

    role = db.get(
        Role,
        payload.role_id,
    )

    if not role:
        raise HTTPException(
            status_code=404,
            detail="Rôle introuvable.",
        )

    if payload.team_id:
        team = db.get(
            Team,
            payload.team_id,
        )

        if not team:
            raise HTTPException(
                status_code=404,
                detail="Équipe introuvable.",
            )

        if team.unit_id != payload.unit_id:
            raise HTTPException(
                status_code=400,
                detail=(
                    "L'équipe n'appartient pas "
                    "à l'unité indiquée."
                ),
            )

    existing = db.scalar(
        select(UserMembership).where(
            UserMembership.user_id == payload.user_id,
            UserMembership.unit_id == payload.unit_id,
            UserMembership.role_id == payload.role_id,
            UserMembership.team_id == payload.team_id,
            UserMembership.is_active.is_(True),
        )
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Cette appartenance existe déjà.",
        )

    membership = UserMembership(
        user_id=payload.user_id,
        unit_id=payload.unit_id,
        team_id=payload.team_id,
        role_id=payload.role_id,
        is_primary=payload.is_primary,
    )

    db.add(membership)
    db.commit()
    db.refresh(membership)

    return membership


@router.get(
    "/memberships",
    response_model=list[UserMembershipResponse],
)
def list_memberships(
    db: Session = Depends(get_db),
):
    statement = select(
        UserMembership
    ).order_by(
        UserMembership.created_at.asc()
    )

    return db.scalars(statement).all()
