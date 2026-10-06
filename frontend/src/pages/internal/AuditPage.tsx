import {
  Activity,
  ArrowRightLeft,
  Braces,
  Building2,
  ChevronRight,
  Clock3,
  Database,
  FileClock,
  Filter,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react"

import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  useAuth,
} from "../../hooks/useAuth"

import {
  getAuditEventRequest,
  listAuditEventsRequest,
} from "../../services/auditApi"

import type {
  AuditEvent,
} from "../../services/auditApi"


const contexts = [
  {
    value: "",
    label: "Tous les contextes",
  },
  {
    value: "direction",
    label: "Direction",
  },
  {
    value: "commercial",
    label: "Commercial",
  },
  {
    value: "assurance",
    label: "Assurance",
  },
  {
    value: "investissement",
    label: "Investissement",
  },
  {
    value: "fiduciaire",
    label: "Fiduciaire",
  },
  {
    value: "technologies",
    label: "Technologies",
  },
  {
    value: "core",
    label: "KEMS Core",
  },
  {
    value: "client",
    label: "Client 360°",
  },
]


const actionTypes = [
  {
    value: "",
    label: "Tous les événements",
  },
  {
    value: "action.created",
    label: "Action créée",
  },
  {
    value: "action.assigned",
    label: "Action assignée",
  },
  {
    value: "action.reassigned",
    label: "Action réassignée",
  },
  {
    value: "action.unassigned",
    label: "Action désassignée",
  },
  {
    value: "action.started",
    label: "Action démarrée",
  },
  {
    value: "action.blocked",
    label: "Action bloquée",
  },
  {
    value: "action.completed",
    label: "Action terminée",
  },
  {
    value: "action.reopened",
    label: "Action réouverte",
  },
  {
    value: "action.cancelled",
    label: "Action annulée",
  },
  {
    value: "action.updated",
    label: "Action modifiée",
  },
  {
    value: "advice.requested",
    label: "Demande de conseil",
  },
]


const sources = [
  {
    value: "",
    label: "Toutes les sources",
  },
  {
    value: "action_center",
    label: "Action Center",
  },
  {
    value: "client_360",
    label: "Client 360°",
  },
  {
    value: "core",
    label: "KEMS Core",
  },
]


function contextLabel(
  value: string,
) {
  const labels:
    Record<string, string> = {
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
    labels[value]
    ?? value
  )
}


function actionLabel(
  value: string,
) {
  const option =
    actionTypes.find(
      (
        item,
      ) =>
        item.value
        === value,
    )

  return (
    option?.label
    ?? value
  )
}


function sourceLabel(
  value: string,
) {
  const labels:
    Record<string, string> = {
      action_center:
        "Action Center",
      client_360:
        "Client 360°",
      core:
        "KEMS Core",
    }

  return (
    labels[value]
    ?? value.replaceAll(
      "_",
      " ",
    )
  )
}


function actorTypeLabel(
  value: string,
) {
  if (
    value === "client"
  ) {
    return "Client"
  }

  if (
    value === "internal"
  ) {
    return "Interne"
  }

  return value
}


function formatDate(
  value: string,
) {
  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value
  }

  return (
    new Intl.DateTimeFormat(
      "fr-CH",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    ).format(date)
  )
}


function formatAuditValue(
  value: unknown,
) {
  if (
    value === null
    || value === undefined
  ) {
    return "—"
  }

  if (
    typeof value
    === "boolean"
  ) {
    return value
      ? "Oui"
      : "Non"
  }

  if (
    typeof value
    === "object"
  ) {
    return JSON.stringify(
      value,
      null,
      2,
    )
  }

  return String(
    value,
  )
}


function auditChangedKeys(
  event: AuditEvent,
) {
  const before =
    event.before_data
    ?? {}

  const after =
    event.after_data
    ?? {}

  return Array.from(
    new Set([
      ...Object.keys(
        before,
      ),
      ...Object.keys(
        after,
      ),
    ]),
  ).sort()
}


function auditValueChanged(
  before: unknown,
  after: unknown,
) {
  return (
    JSON.stringify(
      before,
    )
    !== JSON.stringify(
      after,
    )
  )
}


function entityLabel(
  event: AuditEvent,
) {
  const type =
    event.entity_type
      .replaceAll(
        "_",
        " ",
      )

  if (
    event.entity_id
  ) {
    return `${type} · ${
      event.entity_id.slice(
        0,
        8,
      )
    }`
  }

  return type
}


export function AuditPage() {
  const {
    token,
  } = useAuth()

  const [
    events,
    setEvents,
  ] =
    useState<AuditEvent[]>(
      [],
    )

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    )

  const [
    search,
    setSearch,
  ] =
    useState("")

  const [
    context,
    setContext,
  ] =
    useState("")

  const [
    actionType,
    setActionType,
  ] =
    useState("")

  const [
    actorType,
    setActorType,
  ] =
    useState("")

  const [
    sourceType,
    setSourceType,
  ] =
    useState("")

  const [
    selectedEvent,
    setSelectedEvent,
  ] =
    useState<AuditEvent | null>(
      null,
    )

  const [
    detailLoading,
    setDetailLoading,
  ] =
    useState(false)

  const [
    detailError,
    setDetailError,
  ] =
    useState<string | null>(
      null,
    )


  useEffect(
    () => {
      if (!token) {
        return
      }

      let cancelled =
        false

      const timeout =
        window.setTimeout(
          () => {
            setLoading(
              true,
            )

            void listAuditEventsRequest(
              token,
              {
                effectiveContext:
                  context
                  || undefined,
                actionType:
                  actionType
                  || undefined,
                actorType:
                  actorType
                  || undefined,
                sourceType:
                  sourceType
                  || undefined,
                search:
                  search
                  || undefined,
                limit: 200,
              },
            )
              .then(
                (
                  result,
                ) => {
                  if (
                    cancelled
                  ) {
                    return
                  }

                  setEvents(
                    result,
                  )

                  setError(
                    null,
                  )
                },
              )
              .catch(
                (
                  caught,
                ) => {
                  if (
                    cancelled
                  ) {
                    return
                  }

                  setError(
                    caught
                    instanceof Error
                      ? caught.message
                      : (
                        "Impossible de charger "
                        + "le journal d'audit."
                      ),
                  )
                },
              )
              .finally(
                () => {
                  if (
                    !cancelled
                  ) {
                    setLoading(
                      false,
                    )
                  }
                },
              )
          },
          250,
        )

      return () => {
        cancelled = true

        window.clearTimeout(
          timeout,
        )
      }
    },
    [
      token,
      search,
      context,
      actionType,
      actorType,
      sourceType,
    ],
  )


  const actorCount =
    useMemo(
      () =>
        new Set(
          events.map(
            (
              event,
            ) =>
              event.actor_profile_id
              ?? event.actor_contact_id
              ?? event.actor_name
              ?? event.actor_type,
          ),
        ).size,
      [
        events,
      ],
    )


  const contextCount =
    useMemo(
      () =>
        new Set(
          events.map(
            (
              event,
            ) =>
              event.effective_context,
          ),
        ).size,
      [
        events,
      ],
    )


  const changeCount =
    useMemo(
      () =>
        events.filter(
          (
            event,
          ) =>
            event.before_data
            !== null
            || event.after_data
            !== null,
        ).length,
      [
        events,
      ],
    )


  function resetFilters() {
    setSearch("")
    setContext("")
    setActionType("")
    setActorType("")
    setSourceType("")
  }


  async function openAuditEvent(
    event: AuditEvent,
  ) {
    setSelectedEvent(
      event,
    )

    setDetailError(
      null,
    )

    if (!token) {
      return
    }

    setDetailLoading(
      true,
    )

    try {
      const detail =
        await getAuditEventRequest(
          token,
          event.id,
        )

      setSelectedEvent(
        detail,
      )
    } catch (
      caught
    ) {
      setDetailError(
        caught
        instanceof Error
          ? caught.message
          : (
            "Impossible de charger "
            + "le détail de l'événement."
          ),
      )
    } finally {
      setDetailLoading(
        false,
      )
    }
  }


  function closeAuditEvent() {
    setSelectedEvent(
      null,
    )

    setDetailError(
      null,
    )

    setDetailLoading(
      false,
    )
  }


  return (
    <div className="page-stack audit-page">
      <header className="audit-page-heading">
        <div>
          <span className="eyebrow">
            Direction 720°
          </span>

          <h1>
            Activité / Audit
          </h1>

          <p>
            Journal de gouvernance et de
            traçabilité des opérations KEMS.
          </p>
        </div>

        <div className="audit-governance-pill">
          <ShieldCheck
            size={17}
          />

          Lecture Direction
        </div>
      </header>


      <section className="audit-metric-grid">
        <article className="audit-metric-card">
          <div className="audit-metric-icon">
            <FileClock
              size={19}
            />
          </div>

          <div>
            <span>
              Événements
            </span>

            <strong>
              {
                loading
                  ? "—"
                  : events.length
              }
            </strong>

            <small>
              Résultats visibles
            </small>
          </div>
        </article>


        <article className="audit-metric-card">
          <div className="audit-metric-icon">
            <UserRound
              size={19}
            />
          </div>

          <div>
            <span>
              Acteurs
            </span>

            <strong>
              {
                loading
                  ? "—"
                  : actorCount
              }
            </strong>

            <small>
              Identités distinctes
            </small>
          </div>
        </article>


        <article className="audit-metric-card">
          <div className="audit-metric-icon">
            <Building2
              size={19}
            />
          </div>

          <div>
            <span>
              Contextes
            </span>

            <strong>
              {
                loading
                  ? "—"
                  : contextCount
              }
            </strong>

            <small>
              Périmètres observés
            </small>
          </div>
        </article>


        <article className="audit-metric-card">
          <div className="audit-metric-icon">
            <Activity
              size={19}
            />
          </div>

          <div>
            <span>
              Modifications
            </span>

            <strong>
              {
                loading
                  ? "—"
                  : changeCount
              }
            </strong>

            <small>
              Avec preuve avant / après
            </small>
          </div>
        </article>
      </section>


      <section className="panel audit-filter-panel">
        <div className="audit-filter-heading">
          <div>
            <Filter
              size={17}
            />

            <strong>
              Filtres de gouvernance
            </strong>
          </div>

          <button
            type="button"
            className="audit-reset-button"
            onClick={
              resetFilters
            }
          >
            Réinitialiser
          </button>
        </div>


        <div className="audit-filter-grid">
          <label className="audit-search-field">
            <span>
              Recherche
            </span>

            <div>
              <Search
                size={16}
              />

              <input
                value={search}
                onChange={(
                  event,
                ) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder={
                  "Acteur, événement, entité..."
                }
              />
            </div>
          </label>


          <label>
            <span>
              Contexte
            </span>

            <select
              value={context}
              onChange={(
                event,
              ) =>
                setContext(
                  event.target.value,
                )
              }
            >
              {
                contexts.map(
                  (
                    item,
                  ) => (
                    <option
                      key={
                        item.value
                      }
                      value={
                        item.value
                      }
                    >
                      {
                        item.label
                      }
                    </option>
                  ),
                )
              }
            </select>
          </label>


          <label>
            <span>
              Événement
            </span>

            <select
              value={
                actionType
              }
              onChange={(
                event,
              ) =>
                setActionType(
                  event.target.value,
                )
              }
            >
              {
                actionTypes.map(
                  (
                    item,
                  ) => (
                    <option
                      key={
                        item.value
                      }
                      value={
                        item.value
                      }
                    >
                      {
                        item.label
                      }
                    </option>
                  ),
                )
              }
            </select>
          </label>


          <label>
            <span>
              Acteur
            </span>

            <select
              value={
                actorType
              }
              onChange={(
                event,
              ) =>
                setActorType(
                  event.target.value,
                )
              }
            >
              <option value="">
                Tous les acteurs
              </option>

              <option value="internal">
                Interne
              </option>

              <option value="client">
                Client
              </option>
            </select>
          </label>


          <label>
            <span>
              Source
            </span>

            <select
              value={
                sourceType
              }
              onChange={(
                event,
              ) =>
                setSourceType(
                  event.target.value,
                )
              }
            >
              {
                sources.map(
                  (
                    item,
                  ) => (
                    <option
                      key={
                        item.value
                      }
                      value={
                        item.value
                      }
                    >
                      {
                        item.label
                      }
                    </option>
                  ),
                )
              }
            </select>
          </label>
        </div>
      </section>


      <section className="panel audit-journal">
        <div className="audit-journal-heading">
          <div>
            <span className="eyebrow">
              Gouvernance
            </span>

            <h2>
              Journal d'audit
            </h2>
          </div>

          <span className="audit-result-count">
            {
              loading
                ? "Chargement..."
                : `${
                    events.length
                  } événement${
                    events.length
                    > 1
                      ? "s"
                      : ""
                  }`
            }
          </span>
        </div>


        {
          error
            ? (
              <div className="audit-state error">
                <ShieldCheck
                  size={21}
                />

                <strong>
                  Journal indisponible
                </strong>

                <span>
                  {error}
                </span>
              </div>
            )
            : loading
              ? (
                <div className="audit-state">
                  <RefreshCw
                    size={20}
                    className="audit-loading-icon"
                  />

                  <strong>
                    Lecture du journal...
                  </strong>

                  <span>
                    Chargement des événements
                    de gouvernance.
                  </span>
                </div>
              )
              : events.length
                === 0
                ? (
                  <div className="audit-state">
                    <Database
                      size={21}
                    />

                    <strong>
                      Aucun événement
                    </strong>

                    <span>
                      Aucun événement ne
                      correspond aux filtres.
                    </span>
                  </div>
                )
                : (
                  <div className="audit-event-list">
                    {
                      events.map(
                        (
                          event,
                        ) => (
                          <article
                            key={
                              event.id
                            }
                            className={
                              `audit-event-row context-${event.effective_context}`
                            }
                            role="button"
                            tabIndex={0}
                            aria-label={
                              `Ouvrir l'événement ${
                                actionLabel(
                                  event.action_type,
                                )
                              }`
                            }
                            onClick={() =>
                              void openAuditEvent(
                                event,
                              )
                            }
                            onKeyDown={(
                              keyboardEvent,
                            ) => {
                              if (
                                keyboardEvent.key
                                === "Enter"
                                || keyboardEvent.key
                                === " "
                              ) {
                                keyboardEvent.preventDefault()

                                void openAuditEvent(
                                  event,
                                )
                              }
                            }}
                          >
                            <div className="audit-event-marker">
                              <span />
                            </div>

                            <div className="audit-event-actor">
                              <div className="audit-actor-avatar">
                                {
                                  event.actor_type
                                  === "client"
                                    ? (
                                      <UserRound
                                        size={16}
                                      />
                                    )
                                    : (
                                      <ShieldCheck
                                        size={16}
                                      />
                                    )
                                }
                              </div>

                              <div>
                                <strong>
                                  {
                                    event.actor_name
                                    ?? "Système KEMS"
                                  }
                                </strong>

                                <span>
                                  {
                                    event.actor_unit_name
                                    ?? actorTypeLabel(
                                      event.actor_type,
                                    )
                                  }
                                </span>
                              </div>
                            </div>


                            <div className="audit-event-operation">
                              <strong>
                                {
                                  actionLabel(
                                    event.action_type,
                                  )
                                }
                              </strong>

                              <span>
                                {
                                  entityLabel(
                                    event,
                                  )
                                }
                              </span>
                            </div>


                            <div className="audit-event-context">
                              <span
                                className={
                                  `audit-context-pill context-${event.effective_context}`
                                }
                              >
                                {
                                  contextLabel(
                                    event.effective_context,
                                  )
                                }
                              </span>

                              <small>
                                {
                                  sourceLabel(
                                    event.source_type,
                                  )
                                }
                              </small>
                            </div>


                            <div className="audit-event-date">
                              <Clock3
                                size={14}
                              />

                              <span>
                                {
                                  formatDate(
                                    event.created_at,
                                  )
                                }
                              </span>
                            </div>

                            <div className="audit-event-open">
                              <ChevronRight
                                size={16}
                              />
                            </div>
                          </article>
                        ),
                      )
                    }
                  </div>
                )
        }
      </section>


      {
        selectedEvent
          ? (
            <div
              className="audit-detail-overlay"
              role="presentation"
              onMouseDown={(
                event,
              ) => {
                if (
                  event.target
                  === event.currentTarget
                ) {
                  closeAuditEvent()
                }
              }}
            >
              <aside
                className="audit-detail-drawer"
                role="dialog"
                aria-modal="true"
                aria-label="Détail de l'événement d'audit"
              >
                <header className="audit-detail-header">
                  <div>
                    <span className="eyebrow">
                      Événement d'audit
                    </span>

                    <h2>
                      {
                        actionLabel(
                          selectedEvent.action_type,
                        )
                      }
                    </h2>

                    <p>
                      {
                        selectedEvent.id
                      }
                    </p>
                  </div>

                  <button
                    type="button"
                    className="audit-detail-close"
                    aria-label="Fermer le détail"
                    onClick={
                      closeAuditEvent
                    }
                  >
                    <X
                      size={18}
                    />
                  </button>
                </header>


                {
                  detailLoading
                    ? (
                      <div className="audit-detail-loading">
                        <RefreshCw
                          size={18}
                          className="audit-loading-icon"
                        />

                        Lecture de la preuve complète...
                      </div>
                    )
                    : null
                }


                {
                  detailError
                    ? (
                      <div className="audit-detail-error">
                        {
                          detailError
                        }
                      </div>
                    )
                    : null
                }


                <div className="audit-detail-scroll">
                  <section className="audit-detail-section">
                    <div className="audit-detail-section-title">
                      <UserRound
                        size={16}
                      />

                      <span>
                        Acteur
                      </span>
                    </div>

                    <div className="audit-detail-grid">
                      <div>
                        <span>
                          Identité
                        </span>

                        <strong>
                          {
                            selectedEvent.actor_name
                            ?? "Système KEMS"
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          Type
                        </span>

                        <strong>
                          {
                            actorTypeLabel(
                              selectedEvent.actor_type,
                            )
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          Rôle
                        </span>

                        <strong>
                          {
                            selectedEvent.actor_role_name
                            ?? "—"
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          Unité
                        </span>

                        <strong>
                          {
                            selectedEvent.actor_unit_name
                            ?? "—"
                          }
                        </strong>
                      </div>
                    </div>
                  </section>


                  <section className="audit-detail-section">
                    <div className="audit-detail-section-title">
                      <ShieldCheck
                        size={16}
                      />

                      <span>
                        Contexte & opération
                      </span>
                    </div>

                    <div className="audit-detail-grid">
                      <div>
                        <span>
                          Contexte effectif
                        </span>

                        <strong>
                          {
                            contextLabel(
                              selectedEvent.effective_context,
                            )
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          Action
                        </span>

                        <strong>
                          {
                            selectedEvent.action_type
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          Entité
                        </span>

                        <strong>
                          {
                            selectedEvent.entity_type
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          ID entité
                        </span>

                        <strong className="audit-mono">
                          {
                            selectedEvent.entity_id
                            ?? "—"
                          }
                        </strong>
                      </div>
                    </div>
                  </section>


                  <section className="audit-detail-section">
                    <div className="audit-detail-section-title">
                      <ArrowRightLeft
                        size={16}
                      />

                      <span>
                        Preuve avant / après
                      </span>
                    </div>

                    {
                      auditChangedKeys(
                        selectedEvent,
                      ).length
                        ? (
                          <div className="audit-diff-list">
                            {
                              auditChangedKeys(
                                selectedEvent,
                              ).map(
                                (
                                  key,
                                ) => {
                                  const before =
                                    selectedEvent
                                      .before_data?.[
                                        key
                                      ]

                                  const after =
                                    selectedEvent
                                      .after_data?.[
                                        key
                                      ]

                                  const changed =
                                    auditValueChanged(
                                      before,
                                      after,
                                    )

                                  return (
                                    <article
                                      key={
                                        key
                                      }
                                      className={
                                        `audit-diff-item ${
                                          changed
                                            ? "changed"
                                            : ""
                                        }`
                                      }
                                    >
                                      <div className="audit-diff-key">
                                        <Braces
                                          size={14}
                                        />

                                        <strong>
                                          {
                                            key
                                          }
                                        </strong>

                                        {
                                          changed
                                            ? (
                                              <span>
                                                Modifié
                                              </span>
                                            )
                                            : null
                                        }
                                      </div>

                                      <div className="audit-diff-values">
                                        <div className="audit-diff-before">
                                          <span>
                                            Avant
                                          </span>

                                          <pre>
                                            {
                                              formatAuditValue(
                                                before,
                                              )
                                            }
                                          </pre>
                                        </div>

                                        <div className="audit-diff-after">
                                          <span>
                                            Après
                                          </span>

                                          <pre>
                                            {
                                              formatAuditValue(
                                                after,
                                              )
                                            }
                                          </pre>
                                        </div>
                                      </div>
                                    </article>
                                  )
                                },
                              )
                            }
                          </div>
                        )
                        : (
                          <div className="audit-detail-empty">
                            Aucun état avant / après enregistré pour cet événement.
                          </div>
                        )
                    }
                  </section>


                  <section className="audit-detail-section">
                    <div className="audit-detail-section-title">
                      <Database
                        size={16}
                      />

                      <span>
                        Références
                      </span>
                    </div>

                    <div className="audit-detail-grid">
                      <div>
                        <span>
                          Contact
                        </span>

                        <strong className="audit-mono">
                          {
                            selectedEvent.contact_id
                            ?? "—"
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          Organisation
                        </span>

                        <strong className="audit-mono">
                          {
                            selectedEvent.organization_id
                            ?? "—"
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          Action
                        </span>

                        <strong className="audit-mono">
                          {
                            selectedEvent.action_id
                            ?? "—"
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          Source
                        </span>

                        <strong>
                          {
                            sourceLabel(
                              selectedEvent.source_type,
                            )
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          Type source
                        </span>

                        <strong>
                          {
                            selectedEvent.source_entity_type
                            ?? "—"
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          Référence source
                        </span>

                        <strong className="audit-mono">
                          {
                            selectedEvent.source_entity_id
                            ?? "—"
                          }
                        </strong>
                      </div>
                    </div>
                  </section>


                  <section className="audit-detail-section">
                    <div className="audit-detail-section-title">
                      <Clock3
                        size={16}
                      />

                      <span>
                        Preuve technique
                      </span>
                    </div>

                    <div className="audit-detail-grid">
                      <div>
                        <span>
                          Horodatage
                        </span>

                        <strong>
                          {
                            formatDate(
                              selectedEvent.created_at,
                            )
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          Request ID
                        </span>

                        <strong className="audit-mono">
                          {
                            selectedEvent.request_id
                            ?? "Non capturé"
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          Adresse IP
                        </span>

                        <strong>
                          {
                            selectedEvent.ip_address
                            ?? "Non capturée"
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          User-Agent
                        </span>

                        <strong className="audit-detail-user-agent">
                          {
                            selectedEvent.user_agent
                            ?? "Non capturé"
                          }
                        </strong>
                      </div>
                    </div>
                  </section>
                </div>
              </aside>
            </div>
          )
          : null
      }
    </div>
  )
}
