import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Calculator,
  CheckCircle2,
  CircleCheck,
  Clock3,
  Copy,
  FileText,
  Handshake,
  LifeBuoy,
  Minus,
  Package,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
  ExternalLink,
  UserCheck,
  Workflow,
} from "lucide-react"

import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  StatusBadge,
} from "../../components/ui/StatusBadge"

import {
  useActions,
} from "../../hooks/useActions"

import {
  useAuth,
} from "../../hooks/useAuth"

import {
  useProjection,
} from "../../hooks/useProjection"

import {
  listActionAssigneesRequest,
} from "../../services/actionsApi"

import type {
  ActionAssignee,
  ActionPriority,
  ActionStatus,
} from "../../services/actionsApi"

import {
  useNavigate,
} from "react-router-dom"


function priorityIcon(
  priority: ActionPriority,
) {
  if (
    priority === "critical"
    || priority === "high"
  ) {
    return ArrowUp
  }

  if (
    priority === "low"
  ) {
    return ArrowDown
  }

  return Minus
}


function contextIcon(
  context: string,
) {
  const icons = {
    direction:
      Workflow,
    commercial:
      Handshake,
    assurance:
      ShieldCheck,
    investissement:
      TrendingUp,
    fiduciaire:
      Calculator,
    technologies:
      Sparkles,
    core:
      Workflow,
    client:
      UserRound,
  }

  return (
    icons[
      context as keyof typeof icons
    ]
    ?? Workflow
  )
}


function sourceIcon(
  sourceEntityType:
    string | null,
  sourceType:
    string,
) {
  const key =
    (
      sourceEntityType
      ?? sourceType
      ?? ""
    )
      .trim()
      .toLowerCase()

  if (
    key.includes("ticket")
  ) {
    return LifeBuoy
  }

  if (
    key.includes("quote")
    || key.includes("devis")
  ) {
    return FileText
  }

  if (
    key.includes("deliver")
    || key.includes("livrable")
  ) {
    return Package
  }

  if (
    key.includes("renew")
    || key.includes("renouvel")
  ) {
    return Activity
  }

  if (
    key.includes("opportun")
  ) {
    return TrendingUp
  }

  if (
    key.includes("duplicate")
    || key.includes("doublon")
  ) {
    return Copy
  }

  return Workflow
}


function priorityLabel(
  priority:
    ActionPriority,
) {
  const labels = {
    low: "Basse",
    medium: "Moyenne",
    high: "Haute",
    critical: "Critique",
  }

  return labels[
    priority
  ]
}


function priorityTone(
  priority:
    ActionPriority,
) {
  if (
    priority
      === "critical"
  ) {
    return "warning"
  }

  if (
    priority
      === "high"
  ) {
    return "warning"
  }

  return "info"
}


function statusLabel(
  status:
    ActionStatus,
) {
  const labels = {
    todo: "À faire",
    in_progress:
      "En cours",
    blocked: "Bloquée",
    done: "Terminée",
    cancelled:
      "Annulée",
  }

  return labels[
    status
  ]
}


function statusTone(
  status: ActionStatus,
) {
  const tones = {
    todo: "default",
    in_progress: "info",
    blocked: "warning",
    done: "success",
    cancelled: "default",
  } as const

  return tones[
    status
  ]
}


function contextLabel(
  context: string,
) {
  const labels:
    Record<
      string,
      string
    > = {
    direction:
      "Direction",
    commercial:
      "Commercial",
    assurance:
      "Assurance",
    investissement:
      "Investissement",
    fiduciaire:
      "Fiduciaire",
    technologies:
      "Technologies",
    core:
      "KEMS Core",
    client:
      "Client 360°",
  }

  return (
    labels[
      context
    ]
    ?? context
  )
}


function formatDueDate(
  value:
    string | null,
) {
  if (!value) {
    return "Non planifiée"
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value
  }

  return new Intl
    .DateTimeFormat(
      "fr-CH",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      },
    )
    .format(date)
}


export function ActionCenterPage() {
  const {
    actions,
    loading,
    error,
    refreshActions,
    updateAction,
  } = useActions()

  const {
    auth,
    token,
  } = useAuth()

  const navigate =
    useNavigate()

  const {
    activeContext,
  } = useProjection()

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<
      "all"
      | "open"
      | ActionStatus
    >(
      "all",
    )

  const [
    priorityFilter,
    setPriorityFilter,
  ] =
    useState<
      "all"
      | ActionPriority
    >(
      "all",
    )

  const [
    mineOnly,
    setMineOnly,
  ] =
    useState(false)

  const [
    assignees,
    setAssignees,
  ] =
    useState<
      ActionAssignee[]
    >([])

  const [
    updatingActionId,
    setUpdatingActionId,
  ] =
    useState<
      string | null
    >(null)


  useEffect(
    () => {
      if (
        !token
        || auth?.account_type
          !== "internal"
      ) {
        return
      }

      let cancelled = false

      void listActionAssigneesRequest(
        token,
      )
        .then(
          (
            result,
          ) => {
            if (!cancelled) {
              setAssignees(
                result,
              )
            }
          },
        )
        .catch(
          () => {
            if (!cancelled) {
              setAssignees([])
            }
          },
        )

      return () => {
        cancelled = true
      }
    },
    [
      auth?.account_type,
      token,
    ],
  )


  async function patchAction(
    actionId: string,
    payload: Parameters<
      typeof updateAction
    >[1],
  ) {
    try {
      setUpdatingActionId(
        actionId,
      )

      await updateAction(
        actionId,
        payload,
      )
    } finally {
      setUpdatingActionId(
        null,
      )
    }
  }


  const visibleActions =
    useMemo(
      () => {
        return actions
          .filter(
            (
              action,
            ) => {
              if (
                statusFilter
                  === "all"
              ) {
                return true
              }

              if (
                statusFilter
                  === "open"
              ) {
                return ![
                  "done",
                  "cancelled",
                ].includes(
                  action.status,
                )
              }

              return (
                action.status
                === statusFilter
              )
            },
          )
          .filter(
            (
              action,
            ) =>
              priorityFilter
                === "all"
              || action.priority
                === priorityFilter,
          )
          .filter(
            (
              action,
            ) =>
              !mineOnly
              || action
                .owner_profile_id
                === auth?.profile?.id,
          )
      },
      [
        actions,
        auth?.profile?.id,
        mineOnly,
        priorityFilter,
        statusFilter,
      ],
    )


  const openActions =
    actions.filter(
      (
        action,
      ) =>
        ![
          "done",
          "cancelled",
        ].includes(
          action.status,
        ),
    )

  const criticalActions =
    openActions.filter(
      (
        action,
      ) =>
        action.priority
          === "critical",
    )

  const highActions =
    openActions.filter(
      (
        action,
      ) =>
        action.priority
          === "high",
    )

  const mineActions =
    openActions.filter(
      (
        action,
      ) =>
        action.owner_profile_id
          === auth?.profile?.id,
    )


  return (
    <div className="page-stack">

      <div className="page-header with-actions">

        <div>
          <span className="eyebrow">
            Cockpit opérationnel
          </span>

          <h1>
            Action Center
          </h1>

          <p>
            {activeContext
              === "direction"
              ? (
                "Vue transverse de toutes "
                + "les actions KEMS."
              )
              : (
                "Projection opérationnelle "
                + `du contexte ${
                  contextLabel(
                    activeContext,
                  )
                }.`
              )}
          </p>
        </div>

        <button
          type="button"
          className="button secondary"
          onClick={() =>
            void refreshActions()
          }
          disabled={
            loading
          }
        >
          <RefreshCw
            size={17}
          />

          Actualiser
        </button>
      </div>


      <div className="action-center-summary">

        <div>
          <span>
            À traiter
          </span>

          <strong>
            {
              openActions
                .length
            }
          </strong>
        </div>

        <div>
          <span>
            Critiques
          </span>

          <strong>
            {
              criticalActions
                .length
            }
          </strong>
        </div>

        <div>
          <span>
            Haute priorité
          </span>

          <strong>
            {
              highActions
                .length
            }
          </strong>
        </div>

        <div>
          <span>
            Mes actions
          </span>

          <strong>
            {
              mineActions
                .length
            }
          </strong>
        </div>

      </div>


      <section className="panel action-filter-panel">

        <div className="action-filter-row">

          <div className="action-filter-group">

            <span>
              Statut
            </span>

            <select
              value={
                statusFilter
              }
              onChange={
                (
                  event,
                ) =>
                  setStatusFilter(
                    event.target
                      .value as
                      | "all"
                      | "open"
                      | ActionStatus,
                  )
              }
            >
              <option value="all">
                Toutes
              </option>

              <option value="open">
                Ouvertes
              </option>

              <option value="todo">
                À faire
              </option>

              <option value="in_progress">
                En cours
              </option>

              <option value="blocked">
                Bloquées
              </option>

              <option value="done">
                Terminées
              </option>

              <option value="cancelled">
                Annulées
              </option>
            </select>

          </div>


          <div className="action-filter-group">

            <span>
              Priorité
            </span>

            <select
              value={
                priorityFilter
              }
              onChange={
                (
                  event,
                ) =>
                  setPriorityFilter(
                    event.target
                      .value as
                      | "all"
                      | ActionPriority,
                  )
              }
            >
              <option value="all">
                Toutes
              </option>

              <option value="critical">
                Critique
              </option>

              <option value="high">
                Haute
              </option>

              <option value="medium">
                Moyenne
              </option>

              <option value="low">
                Basse
              </option>
            </select>

          </div>


          <label className="action-mine-filter">

            <input
              type="checkbox"
              checked={
                mineOnly
              }
              onChange={
                (
                  event,
                ) =>
                  setMineOnly(
                    event.target
                      .checked,
                  )
              }
            />

            <span>
              Mes actions uniquement
            </span>

          </label>

        </div>

      </section>


      {error ? (
        <section className="panel action-error-panel">

          <AlertTriangle
            size={22}
          />

          <div>
            <strong>
              Impossible de charger
              l'Action Center
            </strong>

            <p>
              {error}
            </p>
          </div>

        </section>
      ) : null}


      {loading ? (
        <section className="panel empty-panel">

          <RefreshCw
            size={30}
          />

          <strong>
            Chargement des actions...
          </strong>

        </section>
      ) : visibleActions.length ? (

        <section className="action-board">

          {visibleActions.map(
            (
              action,
            ) => {
              const PriorityIcon =
                priorityIcon(
                  action.priority,
                )

              const ContextIcon =
                contextIcon(
                  action.context,
                )

              const SourceIcon =
                sourceIcon(
                  action.source_entity_type,
                  action.source_type,
                )

              return (
              <article
                className={
                  `action-card action-context-${action.context}`
                }
                key={
                  action.id
                }
              >

                <div className="action-card-top">

                  <div
                    className="action-icon large action-source-icon"
                    title={
                      action.source_entity_type
                      ?? action.source_type
                    }
                  >
                    <SourceIcon
                      size={19}
                    />
                  </div>

                  <div className="badge-row">

                    <StatusBadge
                      tone={
                        priorityTone(
                          action.priority,
                        )
                      }
                    >
                      <span className="action-badge-content">
                        <PriorityIcon
                          size={11}
                        />

                        {
                          priorityLabel(
                            action.priority,
                          )
                        }
                      </span>
                    </StatusBadge>

                    <StatusBadge
                      tone={
                        statusTone(
                          action.status,
                        )
                      }
                    >
                      {
                        statusLabel(
                          action.status,
                        )
                      }
                    </StatusBadge>

                  </div>

                </div>


                <div className="action-business-line">
                  <span
                    className={
                      `action-context-pill action-context-pill-${action.context}`
                    }
                  >
                    <ContextIcon
                      size={12}
                    />

                    {
                      contextLabel(
                        action.context,
                      )
                    }
                  </span>
                </div>


                <h3>
                  {action.title}
                </h3>


                {action.description ? (
                  <div className="action-description">
                    {
                      action.description
                    }
                  </div>
                ) : null}


                <div className="action-details">

                  <div>
                    <span>
                      Contexte
                    </span>

                    <strong>
                      {
                        contextLabel(
                          action.context,
                        )
                      }
                    </strong>
                  </div>


                  <div>
                    <span>
                      Échéance
                    </span>

                    <strong>
                      {
                        formatDueDate(
                          action.due_at,
                        )
                      }
                    </strong>
                  </div>


                  <div>
                    <span>
                      Source
                    </span>

                    <strong>
                      {
                        action.source_type
                      }
                    </strong>
                  </div>


                  <div>
                    <span>
                      Assignation
                    </span>

                    <strong>
                      {
                        action
                          .owner_profile_id
                          === auth
                            ?.profile
                            ?.id
                          ? "Moi"
                          : action
                              .owner_profile_id
                            ? "Collaborateur"
                            : "Non assignée"
                      }
                    </strong>
                  </div>

                </div>


                {
                  action.source_entity_id
                  || action.contact_id
                    ? (
                      <div className="action-linked-resources">

                        {action.source_entity_id ? (
                          <div className="action-reference">
                            <span>
                              Référence
                            </span>

                            <strong>
                              {
                                action.source_entity_id
                              }
                            </strong>
                          </div>
                        ) : null}

                        {action.contact_id ? (
                          <button
                            type="button"
                            className="action-client-link"
                            onClick={() =>
                              navigate(
                                `/hub/contacts/${action.contact_id}`,
                              )
                            }
                          >
                            <UserRound
                              size={14}
                            />

                            Voir le Client 720°

                            <ExternalLink
                              size={13}
                            />
                          </button>
                        ) : null}

                      </div>
                    )
                    : null
                }


                <div className="action-operational-controls">

                  <label>
                    <span>
                      Assignation
                    </span>

                    <select
                      value={
                        action.owner_profile_id
                        ?? ""
                      }
                      disabled={
                        updatingActionId
                          === action.id
                        || [
                          "done",
                          "cancelled",
                        ].includes(
                          action.status,
                        )
                      }
                      onChange={
                        (
                          event,
                        ) =>
                          void patchAction(
                            action.id,
                            {
                              owner_profile_id:
                                event.target.value
                                || null,
                            },
                          )
                      }
                    >
                      <option value="">
                        Non assignée
                      </option>

                      {
                        assignees
                          .filter(
                            (
                              assignee,
                            ) =>
                              assignee.contexts
                                .includes(
                                  action.context,
                                )
                              || (
                                action.context
                                  === "core"
                                && assignee.contexts
                                  .includes(
                                    "direction",
                                  )
                              ),
                          )
                          .map(
                            (
                              assignee,
                            ) => (
                              <option
                                key={
                                  assignee.id
                                }
                                value={
                                  assignee.id
                                }
                              >
                                {
                                  assignee.full_name
                                }
                              </option>
                            ),
                          )
                      }
                    </select>
                  </label>


                  <label>
                    <span>
                      Statut
                    </span>

                    <select
                      value={
                        action.status
                      }
                      disabled={
                        updatingActionId
                          === action.id
                      }
                      onChange={
                        (
                          event,
                        ) =>
                          void patchAction(
                            action.id,
                            {
                              status:
                                event.target
                                  .value as
                                  ActionStatus,
                            },
                          )
                      }
                    >
                      <option value="todo">
                        À faire
                      </option>

                      <option value="in_progress">
                        En cours
                      </option>

                      <option value="blocked">
                        Bloquée
                      </option>

                      <option value="done">
                        Terminée
                      </option>

                      <option value="cancelled">
                        Annulée
                      </option>
                    </select>
                  </label>

                </div>


                <div className="action-card-footer">

                  <button
                    type="button"
                    className="button ghost"
                    disabled
                    title="Disponible dans un prochain jalon"
                  >
                    <Clock3
                      size={16}
                    />

                    Reporter
                  </button>


                  {![
                    "done",
                    "cancelled",
                  ].includes(
                    action.status,
                  ) ? (
                    <button
                      type="button"
                      className="button primary"
                      disabled={
                        updatingActionId
                          === action.id
                      }
                      onClick={() =>
                        void patchAction(
                          action.id,
                          {
                            owner_profile_id:
                              auth?.profile?.id
                              ?? action.owner_profile_id,
                            status:
                              "in_progress",
                          },
                        )
                      }
                    >
                      <UserCheck
                        size={16}
                      />

                      Prendre en charge
                    </button>
                  ) : null}

                </div>

              </article>
              )
            },
          )}

        </section>

      ) : (

        <section className="panel empty-panel">

          <CheckCircle2
            size={34}
          />

          <strong>
            Aucune action
            dans cette vue
          </strong>

          <p>
            Modifie les filtres
            ou change de contexte.
          </p>

        </section>
      )}

    </div>
  )
}
