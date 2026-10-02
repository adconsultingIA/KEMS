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


def _profile_name(
    db: Session,
    profile_id: str | None,
) -> str | None:
    if not profile_id:
        return None

    from app.models.profile import Profile

    profile = db.get(
        Profile,
        profile_id,
    )

    if not profile:
        return None

    return profile.full_name


def record_action_event(
    db: Session,
    *,
    action,
    event_type: str,
    title: str,
    description: str | None,
    actor_profile_id: str | None,
) -> Activity:
    return record_activity(
        db,
        event_type=event_type,
        title=title,
        description=description,
        context=action.context,
        actor_type="internal",
        actor_profile_id=(
            actor_profile_id
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


def record_action_lifecycle_activities(
    db: Session,
    *,
    action,
    previous_owner_profile_id: str | None,
    previous_status: str,
    actor_profile_id: str,
) -> list[Activity]:
    activities: list[Activity] = []

    current_owner_profile_id = (
        action.owner_profile_id
    )

    current_status = (
        action.status
    )

    # --------------------------------------------------------
    # ASSIGNMENT
    # --------------------------------------------------------

    if (
        previous_owner_profile_id
        != current_owner_profile_id
    ):
        previous_name = _profile_name(
            db,
            previous_owner_profile_id,
        )

        current_name = _profile_name(
            db,
            current_owner_profile_id,
        )

        if (
            previous_owner_profile_id
            is None
            and current_owner_profile_id
            is not None
        ):
            activities.append(
                record_action_event(
                    db,
                    action=action,
                    event_type=(
                        "action.assigned"
                    ),
                    title=(
                        "Action assignée"
                    ),
                    description=(
                        f"Assignée à "
                        f"{current_name}."
                        if current_name
                        else (
                            "Action assignée "
                            "à un collaborateur."
                        )
                    ),
                    actor_profile_id=(
                        actor_profile_id
                    ),
                )
            )

        elif (
            previous_owner_profile_id
            is not None
            and current_owner_profile_id
            is not None
        ):
            if (
                previous_name
                and current_name
            ):
                description = (
                    f"Réassignée de "
                    f"{previous_name} "
                    f"à {current_name}."
                )
            elif current_name:
                description = (
                    f"Réassignée à "
                    f"{current_name}."
                )
            else:
                description = (
                    "Action réassignée "
                    "à un autre "
                    "collaborateur."
                )

            activities.append(
                record_action_event(
                    db,
                    action=action,
                    event_type=(
                        "action.reassigned"
                    ),
                    title=(
                        "Action réassignée"
                    ),
                    description=(
                        description
                    ),
                    actor_profile_id=(
                        actor_profile_id
                    ),
                )
            )

    # --------------------------------------------------------
    # STATUS
    # --------------------------------------------------------

    if (
        previous_status
        != current_status
    ):
        # Une action terminée ou annulée
        # qui revient dans un état actif
        # est considérée comme réouverte.
        if (
            previous_status
            in {
                "done",
                "cancelled",
            }
            and current_status
            in {
                "todo",
                "in_progress",
                "blocked",
            }
        ):
            activities.append(
                record_action_event(
                    db,
                    action=action,
                    event_type=(
                        "action.reopened"
                    ),
                    title=(
                        "Action réouverte"
                    ),
                    description=(
                        "L'action a été "
                        "réouverte."
                    ),
                    actor_profile_id=(
                        actor_profile_id
                    ),
                )
            )

        elif (
            current_status
            == "in_progress"
        ):
            activities.append(
                record_action_event(
                    db,
                    action=action,
                    event_type=(
                        "action.started"
                    ),
                    title=(
                        "Traitement démarré"
                    ),
                    description=(
                        "L'action est "
                        "maintenant en cours."
                    ),
                    actor_profile_id=(
                        actor_profile_id
                    ),
                )
            )

        elif (
            current_status
            == "blocked"
        ):
            activities.append(
                record_action_event(
                    db,
                    action=action,
                    event_type=(
                        "action.blocked"
                    ),
                    title=(
                        "Action bloquée"
                    ),
                    description=(
                        "L'action a été "
                        "marquée comme bloquée."
                    ),
                    actor_profile_id=(
                        actor_profile_id
                    ),
                )
            )

        elif (
            current_status
            == "done"
        ):
            activities.append(
                record_action_event(
                    db,
                    action=action,
                    event_type=(
                        "action.completed"
                    ),
                    title=(
                        "Action terminée"
                    ),
                    description=(
                        "L'action a été "
                        "terminée."
                    ),
                    actor_profile_id=(
                        actor_profile_id
                    ),
                )
            )

        elif (
            current_status
            == "cancelled"
        ):
            activities.append(
                record_action_event(
                    db,
                    action=action,
                    event_type=(
                        "action.cancelled"
                    ),
                    title=(
                        "Action annulée"
                    ),
                    description=(
                        "L'action a été "
                        "annulée."
                    ),
                    actor_profile_id=(
                        actor_profile_id
                    ),
                )
            )

    return activities
