from sqlalchemy.orm import Session

from app.models.activity import Activity


def record_activity(
    db: Session,
    *,
    event_type: str,
    title: str,
    context: str,
    description: str | None = None,
    actor_type: str = "system",
    actor_profile_id: str | None = None,
    actor_contact_id: str | None = None,
    contact_id: str | None = None,
    organization_id: str | None = None,
    action_id: str | None = None,
    source_type: str = "core",
    source_entity_type: str | None = None,
    source_entity_id: str | None = None,
) -> Activity:
    activity = Activity(
        event_type=event_type,
        title=title.strip(),
        description=(
            description.strip()
            if description
            else None
        ),
        context=context,
        actor_type=actor_type,
        actor_profile_id=(
            actor_profile_id
        ),
        actor_contact_id=(
            actor_contact_id
        ),
        contact_id=contact_id,
        organization_id=(
            organization_id
        ),
        action_id=action_id,
        source_type=source_type,
        source_entity_type=(
            source_entity_type
        ),
        source_entity_id=(
            source_entity_id
        ),
    )

    db.add(activity)

    return activity


def record_action_created_activity(
    db: Session,
    *,
    action,
    actor_type: str,
    actor_profile_id: str | None = None,
    actor_contact_id: str | None = None,
) -> Activity:
    return record_activity(
        db,
        event_type="action.created",
        title=(
            f"Action créée : "
            f"{action.title}"
        ),
        description=(
            action.description
        ),
        context=action.context,
        actor_type=actor_type,
        actor_profile_id=(
            actor_profile_id
        ),
        actor_contact_id=(
            actor_contact_id
        ),
        contact_id=(
            action.contact_id
        ),
        organization_id=(
            action.organization_id
        ),
        action_id=action.id,
        source_type=(
            action.source_type
        ),
        source_entity_type="action",
        source_entity_id=(
            action.id
        ),
    )
