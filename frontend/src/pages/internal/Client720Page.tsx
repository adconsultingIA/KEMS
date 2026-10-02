import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CircleCheck,
  Clock3,
  FileText,
  History,
  LockKeyhole,
  Play,
  RefreshCcw,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  UserCheck,
  UserRound,
  UserRoundCheck,
  XCircle,
  TrendingUp,
} from "lucide-react"

import {
  useEffect,
  useState,
} from "react"

import {
  Link,
  useParams,
} from "react-router-dom"
import { MetricCard } from "../../components/ui/MetricCard"
import { StatusBadge } from "../../components/ui/StatusBadge"
import { useAuth } from "../../hooks/useAuth"
import {
  listActivitiesRequest,
} from "../../services/activitiesApi"
import {
  getClient720Request,
} from "../../services/client720Api"
import type {
  Client720Projection,
} from "../../services/client720Api"
import type {
  ApiActivity,
} from "../../services/activitiesApi"

function formatSourceLabel(
  value: string,
) {
  const labels:
    Record<string, string> = {
      manual:
        "Saisie manuelle",
      legacy_import:
        "Import historique",
      client_360:
        "Client 360°",
      csv:
        "Import CSV",
      scraping:
        "Acquisition externe",
    }

  return (
    labels[value]
    ?? value
      .replaceAll(
        "_",
        " ",
      )
  )
}


function formatDecisionRole(
  value: string,
) {
  const labels:
    Record<string, string> = {
      decision_maker:
        "Décideur",
      decider:
        "Décideur",
      influencer:
        "Influenceur",
      user:
        "Utilisateur",
      unknown:
        "Rôle à qualifier",
    }

  return (
    labels[value]
    ?? value
  )
}


function contactInitials(
  firstName: string,
  lastName: string,
) {
  return (
    `${firstName.charAt(0)}${lastName.charAt(0)}`
      .toUpperCase()
  )
}


function locationLabel(
  projection: Client720Projection,
) {
  const values = [
    projection.organization?.city,
    projection.organization?.country,
  ].filter(Boolean)

  return (
    values.length
      ? values.join(", ")
      : "Localisation non renseignée"
  )
}


function relationshipTypeLabel(
  value: string,
) {
  const labels:
    Record<string, string> = {
      employee:
        "Collaborateur",
      owner:
        "Propriétaire",
      founder:
        "Fondateur",
      director:
        "Direction",
      advisor:
        "Conseiller",
      partner:
        "Partenaire",
      client:
        "Client",
    }

  return (
    labels[value]
    ?? value.replaceAll(
      "_",
      " ",
    )
  )
}


function relationshipRoleLabel(
  value: string | null,
) {
  if (!value) {
    return "Rôle non renseigné"
  }

  const labels:
    Record<string, string> = {
      decision_maker:
        "Décideur",
      employee:
        "Collaborateur",
      influencer:
        "Influenceur",
      owner:
        "Propriétaire",
    }

  return (
    labels[value]
    ?? value.replaceAll(
      "_",
      " ",
    )
  )
}


function activityIcon(
  eventType: string,
) {
  const icons = {
    "action.created":
      FileText,
    "action.assigned":
      UserCheck,
    "action.reassigned":
      UserRoundCheck,
    "action.started":
      Play,
    "action.blocked":
      LockKeyhole,
    "action.completed":
      CircleCheck,
    "action.reopened":
      RefreshCcw,
    "action.cancelled":
      XCircle,
  }

  return (
    icons[
      eventType as keyof typeof icons
    ]
    ?? Clock3
  )
}


function actorLabel(
  activity: ApiActivity,
) {
  if (
    activity.actor_type
      === "client"
  ) {
    return "Client"
  }

  if (
    activity.actor_type
      === "internal"
  ) {
    return "Équipe KEMS"
  }

  return "Système KEMS"
}


function activityLabel(
  eventType: string,
) {
  const labels:
    Record<
      string,
      string
    > = {
    "action.created":
      "Action créée",
    "action.assigned":
      "Action assignée",
    "action.reassigned":
      "Action réassignée",
    "action.started":
      "Traitement démarré",
    "action.blocked":
      "Action bloquée",
    "action.completed":
      "Action terminée",
    "action.reopened":
      "Action réouverte",
    "action.cancelled":
      "Action annulée",
  }

  return (
    labels[eventType]
    ?? eventType
  )
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
    labels[context]
    ?? context
  )
}


function formatActivityDate(
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

  const now =
    new Date()

  const startOfToday =
    new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    )

  const startOfDate =
    new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    )

  const diffDays =
    Math.round(
      (
        startOfToday.getTime()
        - startOfDate.getTime()
      )
      / 86_400_000,
    )

  const time =
    new Intl.DateTimeFormat(
      "fr-CH",
      {
        hour: "2-digit",
        minute: "2-digit",
      },
    ).format(date)

  if (diffDays === 0) {
    return `Aujourd'hui · ${time}`
  }

  if (diffDays === 1) {
    return `Hier · ${time}`
  }

  const day =
    new Intl.DateTimeFormat(
      "fr-CH",
      {
        day: "2-digit",
        month: "short",
      },
    ).format(date)

  return `${day} · ${time}`
}


const historyContextOptions = [
  {
    value: "all",
    label: "Tous les métiers",
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
    value: "direction",
    label: "Direction",
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


const historyEventOptions = [
  {
    value: "all",
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
    value: "action.started",
    label: "Traitement démarré",
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
]


export function Client720Page() {
  const {
    contactId,
  } = useParams()

  const {
    token,
  } = useAuth()

  const [
    client720,
    setClient720,
  ] =
    useState<
      Client720Projection
      | null
    >(null)

  const [
    client720Loading,
    setClient720Loading,
  ] =
    useState(false)

  const [
    client720Error,
    setClient720Error,
  ] =
    useState<string | null>(
      null,
    )

  const [
    activities,
    setActivities,
  ] =
    useState<
      ApiActivity[]
    >([])

  const [
    activitiesLoading,
    setActivitiesLoading,
  ] =
    useState(false)

  const [
    activitiesError,
    setActivitiesError,
  ] =
    useState<string | null>(
      null,
    )

  const [
    showAllActivities,
    setShowAllActivities,
  ] =
    useState(false)

  const [
    activeSection,
    setActiveSection,
  ] =
    useState<
      "overview"
      | "relations"
      | "history"
    >("overview")

  const [
    historyContext,
    setHistoryContext,
  ] =
    useState("all")

  const [
    historyEventType,
    setHistoryEventType,
  ] =
    useState("all")

  const visibleActivities =
    showAllActivities
      ? activities
      : activities.slice(
          0,
          6,
        )

  const historyActivities =
    activities.filter(
      (
        activity,
      ) =>
        (
          historyContext
            === "all"
          || activity.context
            === historyContext
        )
        && (
          historyEventType
            === "all"
          || activity.event_type
            === historyEventType
        ),
    )


  useEffect(
    () => {
      if (
        !token
        || !contactId
      ) {
        return
      }

      let cancelled = false

      void Promise.resolve()
        .then(
          () => {
            if (!cancelled) {
              setClient720Loading(
                true,
              )
            }

            return getClient720Request(
              token,
              contactId,
            )
          },
        )
        .then(
          (
            result,
          ) => {
            if (cancelled) {
              return
            }

            setClient720(
              result,
            )

            setClient720Error(
              null,
            )
          },
        )
        .catch(
          (
            caught,
          ) => {
            if (cancelled) {
              return
            }

            setClient720Error(
              caught instanceof Error
                ? caught.message
                : (
                  "Impossible de charger "
                  + "le Client 720°."
                ),
            )
          },
        )
        .finally(
          () => {
            if (!cancelled) {
              setClient720Loading(
                false,
              )
            }
          },
        )

      return () => {
        cancelled = true
      }
    },
    [
      contactId,
      token,
    ],
  )


  useEffect(
    () => {
      if (
        !token
        || !contactId
      ) {
        return
      }

      let cancelled = false

      void Promise.resolve()
        .then(
          () => {
            if (!cancelled) {
              setActivitiesLoading(
                true,
              )
            }

            return listActivitiesRequest(
              token,
              {
                contactId,
                limit: 500,
              },
            )
          },
        )
        .then(
          (
            result,
          ) => {
            if (cancelled) {
              return
            }

            setActivities(
              result,
            )

            setActivitiesError(
              null,
            )
          },
        )
        .catch(
          (
            caught,
          ) => {
            if (cancelled) {
              return
            }

            setActivitiesError(
              caught instanceof Error
                ? caught.message
                : (
                  "Impossible de charger "
                  + "la timeline."
                ),
            )
          },
        )
        .finally(
          () => {
            if (!cancelled) {
              setActivitiesLoading(
                false,
              )
            }
          },
        )

      return () => {
        cancelled = true
      }
    },
    [
      contactId,
      token,
    ],
  )


  return (
    <div className="page-stack">
      <Link to="/hub/contacts" className="back-link">
        <ArrowLeft size={16} />
        Contact Registry
      </Link>

      <section className="entity-hero">
        {client720Loading && !client720 ? (
          <div className="client720-core-state">
            <RefreshCw
              size={18}
            />

            <span>
              Chargement des données Core...
            </span>
          </div>
        ) : client720Error && !client720 ? (
          <div className="client720-core-state error">
            <strong>
              Client 720° indisponible
            </strong>

            <span>
              {client720Error}
            </span>
          </div>
        ) : client720 ? (
          <>
            <div className="entity-hero-main">
              <div className="avatar hero-avatar">
                {
                  contactInitials(
                    client720.contact.first_name,
                    client720.contact.last_name,
                  )
                }
              </div>

              <div>
                <span className="eyebrow">
                  Client 720°
                </span>

                <h1>
                  {
                    client720.contact.first_name
                  }
                  {" "}
                  {
                    client720.contact.last_name
                  }
                </h1>

                <p>
                  {
                    client720.contact.job_title
                    ?? "Fonction non renseignée"
                  }

                  {
                    client720.organization
                      ? (
                        <>
                          {" — "}
                          {
                            client720.organization.name
                          }
                        </>
                      )
                      : null
                  }
                </p>

                <span className="muted">
                  {
                    locationLabel(
                      client720,
                    )
                  }
                </span>

                <div className="badge-row">
                  <StatusBadge
                    tone={
                      client720.data_quality.is_verified
                        ? "success"
                        : undefined
                    }
                  >
                    {
                      client720.data_quality.is_verified
                        ? "Vérifié"
                        : "Non vérifié"
                    }
                  </StatusBadge>

                  <StatusBadge tone="info">
                    {
                      formatDecisionRole(
                        client720.contact.decision_role,
                      )
                    }
                  </StatusBadge>

                  <StatusBadge>
                    {
                      client720.contact.is_active
                        ? "Client actif"
                        : "Client inactif"
                    }
                  </StatusBadge>

                  <StatusBadge>
                    Assurance
                  </StatusBadge>

                  <StatusBadge>
                    Investissement
                  </StatusBadge>
                </div>
              </div>
            </div>

            <div className="entity-contact-grid">
              <div>
                <span>Email</span>

                <strong>
                  {
                    client720.contact.email
                    ?? "Non renseigné"
                  }
                </strong>
              </div>

              <div>
                <span>Téléphone</span>

                <strong>
                  {
                    client720.contact.phone
                    ?? "Non renseigné"
                  }
                </strong>
              </div>

              <div>
                <span>Source</span>

                <strong>
                  {
                    formatSourceLabel(
                      client720.contact.source_type,
                    )
                  }
                </strong>
              </div>

              <div>
                <span>Qualité</span>

                <strong>
                  {
                    client720.data_quality.completeness_score
                  }
                  %
                </strong>
              </div>
            </div>
          </>
        ) : null}
      </section>

      <div className="section-tabs">
        <button
          type="button"
          className={
            activeSection
              === "overview"
              ? "tab active"
              : "tab"
          }
          onClick={() =>
            setActiveSection(
              "overview",
            )
          }
        >
          Overview
        </button>

        <button
          type="button"
          className={
            activeSection
              === "relations"
              ? "tab active"
              : "tab"
          }
          onClick={() =>
            setActiveSection(
              "relations",
            )
          }
        >
          Relations
        </button>

        <button
          type="button"
          className="tab"
        >
          Commercial
        </button>

        <button
          type="button"
          className="tab"
        >
          Assurance
        </button>

        <button
          type="button"
          className="tab"
        >
          Investissement
        </button>

        <button
          type="button"
          className="tab"
        >
          Fiduciaire
        </button>

        <button
          type="button"
          className="tab"
        >
          Documents
        </button>

        <button
          type="button"
          className={
            activeSection
              === "history"
              ? "tab active"
              : "tab"
          }
          onClick={() =>
            setActiveSection(
              "history",
            )
          }
        >
          Historique
        </button>
      </div>

      <div
        className={
          activeSection
            === "overview"
            ? "client720-overview"
            : "client720-overview is-hidden"
        }
      >
      <section className="metric-grid three">
        <MetricCard
          label="Relationship Health"
          value="88/100"
          hint="Relation forte"
        />
        <MetricCard
          label="Data Quality"
          value={
            client720
              ? (
                `${client720.data_quality.completeness_score}%`
              )
              : "—"
          }
          hint={
            client720?.data_quality.is_verified
              ? "Données Core vérifiées"
              : "Vérification à compléter"
          }
        />
        <MetricCard
          label="Activité"
          value="Active"
          hint="Dernier contact aujourd'hui"
        />
      </section>

      <section className="business-cards">
        <div className="business-card">
          <BriefcaseBusiness size={22} />
          <span>Commercial</span>
          <strong>3 opportunités</strong>
          <p>CHF 85'000 de pipeline actif</p>
        </div>

        <div className="business-card">
          <ShieldCheck size={22} />
          <span>Assurance</span>
          <strong>2 contrats actifs</strong>
          <p>1 renouvellement prochain</p>
        </div>

        <div className="business-card">
          <TrendingUp size={22} />
          <span>Investissement</span>
          <strong>1 dossier actif</strong>
          <p>Profil investisseur modéré</p>
        </div>

        <div className="business-card">
          <Building2 size={22} />
          <span>Fiduciaire</span>
          <strong>Aucun mandat</strong>
          <p>Potentiel à explorer</p>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Pilotage</span>
              <h2>À surveiller</h2>
            </div>
          </div>

          <div className="watch-list">
            <div className="watch-item warning">
              <Clock3 size={18} />
              <div>
                <strong>Renouvellement Assurance</strong>
                <span>Échéance dans 27 jours</span>
              </div>
            </div>

            <div className="watch-item">
              <BriefcaseBusiness size={18} />
              <div>
                <strong>Opportunité CHF 45'000</strong>
                <span>Sans activité depuis 8 jours</span>
              </div>
            </div>

            <div className="watch-item">
              <FileText size={18} />
              <div>
                <strong>LinkedIn non vérifié</strong>
                <span>Compléter la qualité du contact</span>
              </div>
            </div>

            <div className="watch-item success">
              <CircleCheck size={18} />
              <div>
                <strong>Dossier Investissement</strong>
                <span>À jour</span>
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">720°</span>

              <div className="timeline-heading-row">
                <h2>
                  Activité récente
                </h2>

                {activities.length ? (
                  <span className="timeline-count">
                    {activities.length}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {activitiesLoading ? (
            <div className="timeline-state">
              <RefreshCw
                size={18}
              />

              <span>
                Chargement de l'activité...
              </span>
            </div>
          ) : activitiesError ? (
            <div className="timeline-state error">
              <span>
                {activitiesError}
              </span>
            </div>
          ) : activities.length ? (
            <div className="timeline">
              {visibleActivities.map(
                (
                  activity,
                ) => {
                  const ActivityIcon =
                    activityIcon(
                      activity.event_type,
                    )

                  return (
                  <div
                    className={
                      `timeline-item timeline-context-${activity.context}`
                    }
                    key={
                      activity.id
                    }
                  >
                    <div className="timeline-dot">
                      <ActivityIcon
                        size={10}
                      />
                    </div>

                    <div>
                      <span className="timeline-date">
                        {
                          formatActivityDate(
                            activity.created_at,
                          )
                        }
                      </span>

                      <strong>
                        {
                          activityLabel(
                            activity.event_type,
                          )
                        }
                      </strong>

                      <div className="timeline-meta">
                        <span
                          className={
                            `timeline-context-chip timeline-context-chip-${activity.context}`
                          }
                        >
                          {
                            contextLabel(
                              activity.context,
                            )
                          }
                        </span>

                        <span className="timeline-actor">
                          <UserRound
                            size={11}
                          />

                          {
                            actorLabel(
                              activity,
                            )
                          }
                        </span>
                      </div>

                      <p>
                        {
                          activity.title
                        }
                      </p>

                      {
                        activity.description
                          ? (
                            <small className="timeline-detail">
                              {
                                activity.description
                              }
                            </small>
                          )
                          : null
                      }
                    </div>
                  </div>
                  )
                },
              )}

              {activities.length > 6 ? (
                <button
                  type="button"
                  className="timeline-more-button"
                  onClick={() =>
                    setShowAllActivities(
                      (
                        current,
                      ) =>
                        !current,
                    )
                  }
                >
                  {
                    showAllActivities
                      ? "Réduire l'historique"
                      : `Voir tout l'historique (${activities.length})`
                  }
                </button>
              ) : null}
            </div>
          ) : (
            <div className="timeline-state">
              <CircleCheck
                size={20}
              />

              <span>
                Aucune activité réelle
                enregistrée pour ce client.
              </span>
            </div>
          )}
        </div>
      </section>
      </div>

      {activeSection === "relations" ? (
        <section className="panel client-relations-panel">
          <div className="client-relations-header">
            <div>
              <span className="eyebrow">
                Relations Core
              </span>

              <h2>
                Organisations liées
              </h2>

              <p>
                Affiliations actuelles et historiques
                connues par KEMS Core.
              </p>
            </div>

            <div className="client-relations-count">
              <Building2
                size={17}
              />

              <strong>
                {
                  client720?.relations.length
                  ?? 0
                }
              </strong>

              <span>
                relation{
                  (
                    client720?.relations.length
                    ?? 0
                  ) > 1
                    ? "s"
                    : ""
                }
              </span>
            </div>
          </div>

          {
            client720?.relations.length
              ? (
                <div className="client-relations-list">
                  {
                    client720.relations.map(
                      (
                        relation,
                      ) => (
                        <article
                          className="client-relation-card"
                          key={
                            relation.relationship.id
                          }
                        >
                          <div className="client-relation-icon">
                            <Building2
                              size={20}
                            />
                          </div>

                          <div className="client-relation-main">
                            <div className="client-relation-title">
                              <div>
                                <strong>
                                  {
                                    relation.organization.name
                                  }
                                </strong>

                                {
                                  relation.organization.legal_name
                                  && relation.organization.legal_name
                                    !== relation.organization.name
                                    ? (
                                      <span>
                                        {
                                          relation.organization.legal_name
                                        }
                                      </span>
                                    )
                                    : null
                                }
                              </div>

                              <div className="badge-row">
                                {
                                  relation.relationship.is_primary
                                    ? (
                                      <StatusBadge tone="info">
                                        Principale
                                      </StatusBadge>
                                    )
                                    : null
                                }

                                <StatusBadge
                                  tone={
                                    relation.relationship.is_active
                                      ? "success"
                                      : undefined
                                  }
                                >
                                  {
                                    relation.relationship.is_active
                                      ? "Active"
                                      : "Historique"
                                  }
                                </StatusBadge>
                              </div>
                            </div>

                            <div className="client-relation-grid">
                              <div>
                                <span>
                                  Relation
                                </span>

                                <strong>
                                  {
                                    relationshipTypeLabel(
                                      relation.relationship.relationship_type,
                                    )
                                  }
                                </strong>
                              </div>

                              <div>
                                <span>
                                  Fonction
                                </span>

                                <strong>
                                  {
                                    relation.relationship.job_title
                                    ?? client720.contact.job_title
                                    ?? "Non renseignée"
                                  }
                                </strong>
                              </div>

                              <div>
                                <span>
                                  Rôle
                                </span>

                                <strong>
                                  {
                                    relationshipRoleLabel(
                                      relation.relationship.relationship_role,
                                    )
                                  }
                                </strong>
                              </div>

                              <div>
                                <span>
                                  Localisation
                                </span>

                                <strong>
                                  {
                                    [
                                      relation.organization.city,
                                      relation.organization.country,
                                    ]
                                      .filter(Boolean)
                                      .join(", ")
                                    || "Non renseignée"
                                  }
                                </strong>
                              </div>
                            </div>

                            <div className="client-relation-footer">
                              <span>
                                Source
                              </span>

                              <strong>
                                {
                                  formatSourceLabel(
                                    relation.organization.source_type,
                                  )
                                }
                              </strong>

                              {
                                relation.organization.is_verified
                                  ? (
                                    <StatusBadge tone="success">
                                      Organisation vérifiée
                                    </StatusBadge>
                                  )
                                  : (
                                    <StatusBadge>
                                      Organisation non vérifiée
                                    </StatusBadge>
                                  )
                              }
                            </div>
                          </div>
                        </article>
                      ),
                    )
                  }
                </div>
              )
              : (
                <div className="timeline-state client-relations-empty">
                  <Building2
                    size={20}
                  />

                  <strong>
                    Aucune organisation liée
                  </strong>

                  <span>
                    Aucune relation Contact ↔ Organisation
                    n'est enregistrée dans KEMS Core.
                  </span>
                </div>
              )
          }
        </section>
      ) : null}

      {activeSection === "history" ? (
        <section className="panel client-history-panel">
          <div className="client-history-header">
            <div>
              <span className="eyebrow">
                Historique 720°
              </span>

              <h2>
                Historique du client
              </h2>

              <p>
                Vue chronologique des événements
                accessibles dans votre contexte KEMS.
              </p>
            </div>

            <div className="client-history-summary">
              <History
                size={18}
              />

              <div>
                <strong>
                  {
                    historyActivities.length
                  }
                </strong>

                <span>
                  événement{
                    historyActivities.length
                      > 1
                      ? "s"
                      : ""
                  }
                </span>
              </div>
            </div>
          </div>

          <div className="client-history-toolbar">
            <div className="client-history-toolbar-title">
              <SlidersHorizontal
                size={15}
              />

              <span>
                Filtres
              </span>
            </div>

            <label className="client-history-filter">
              <span>
                Métier
              </span>

              <select
                value={
                  historyContext
                }
                onChange={(
                  event,
                ) =>
                  setHistoryContext(
                    event.target.value,
                  )
                }
              >
                {
                  historyContextOptions.map(
                    (
                      option,
                    ) => (
                      <option
                        key={
                          option.value
                        }
                        value={
                          option.value
                        }
                      >
                        {
                          option.label
                        }
                      </option>
                    ),
                  )
                }
              </select>
            </label>

            <label className="client-history-filter">
              <span>
                Événement
              </span>

              <select
                value={
                  historyEventType
                }
                onChange={(
                  event,
                ) =>
                  setHistoryEventType(
                    event.target.value,
                  )
                }
              >
                {
                  historyEventOptions.map(
                    (
                      option,
                    ) => (
                      <option
                        key={
                          option.value
                        }
                        value={
                          option.value
                        }
                      >
                        {
                          option.label
                        }
                      </option>
                    ),
                  )
                }
              </select>
            </label>

            <button
              type="button"
              className="client-history-reset"
              disabled={
                historyContext
                  === "all"
                && historyEventType
                  === "all"
              }
              onClick={() => {
                setHistoryContext(
                  "all",
                )

                setHistoryEventType(
                  "all",
                )
              }}
            >
              <RotateCcw
                size={13}
              />

              Réinitialiser
            </button>
          </div>

          <div className="client-history-results">
            <span>
              {
                historyActivities.length
              }
              {" "}
              résultat{
                historyActivities.length
                  > 1
                  ? "s"
                  : ""
              }
            </span>

            {
              historyActivities.length
                !== activities.length
                ? (
                  <small>
                    sur {
                      activities.length
                    } événement{
                      activities.length
                        > 1
                        ? "s"
                        : ""
                    }
                  </small>
                )
                : null
            }
          </div>

          {activitiesLoading ? (
            <div className="timeline-state client-history-state">
              <RefreshCw
                size={18}
              />

              <span>
                Chargement de l'historique...
              </span>
            </div>
          ) : activitiesError ? (
            <div className="timeline-state error client-history-state">
              <span>
                {activitiesError}
              </span>
            </div>
          ) : historyActivities.length ? (
            <div className="timeline client-history-timeline">
              {
                historyActivities.map(
                  (
                    activity,
                  ) => {
                    const ActivityIcon =
                      activityIcon(
                        activity.event_type,
                      )

                    return (
                      <div
                        className={
                          `timeline-item timeline-context-${activity.context}`
                        }
                        key={
                          activity.id
                        }
                      >
                        <div className="timeline-dot">
                          <ActivityIcon
                            size={10}
                          />
                        </div>

                        <div>
                          <span className="timeline-date">
                            {
                              formatActivityDate(
                                activity.created_at,
                              )
                            }
                          </span>

                          <strong>
                            {
                              activityLabel(
                                activity.event_type,
                              )
                            }
                          </strong>

                          <div className="timeline-meta">
                            <span
                              className={
                                `timeline-context-chip timeline-context-chip-${activity.context}`
                              }
                            >
                              {
                                contextLabel(
                                  activity.context,
                                )
                              }
                            </span>

                            <span className="timeline-actor">
                              <UserRound
                                size={11}
                              />

                              {
                                actorLabel(
                                  activity,
                                )
                              }
                            </span>
                          </div>

                          <p>
                            {
                              activity.title
                            }
                          </p>

                          {
                            activity.description
                              ? (
                                <small className="timeline-detail">
                                  {
                                    activity.description
                                  }
                                </small>
                              )
                              : null
                          }

                          <div className="client-history-tech-meta">
                            <span>
                              Source
                            </span>

                            <strong>
                              {
                                activity.source_type
                              }
                            </strong>

                            {
                              activity.action_id
                                ? (
                                  <>
                                    <span>
                                      Action
                                    </span>

                                    <strong>
                                      {
                                        activity.action_id.slice(
                                          0,
                                          8,
                                        )
                                      }
                                    </strong>
                                  </>
                                )
                                : null
                            }
                          </div>
                        </div>
                      </div>
                    )
                  },
                )
              }
            </div>
          ) : (
            <div className="timeline-state client-history-state">
              <History
                size={20}
              />

              <strong>
                Aucun événement correspondant
              </strong>

              <span>
                Modifie ou réinitialise les filtres.
              </span>
            </div>
          )}
        </section>
      ) : null}
    </div>
  )
}
