import {
  ArrowLeft,
  Building2,
  Calculator,
  CalendarDays,
  CircleCheck,
  Clock3,
  Database,
  Handshake,
  History,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react"

import {
  useEffect,
  useState,
} from "react"

import {
  Link,
  useParams,
} from "react-router-dom"

import {
  MetricCard,
} from "../../components/ui/MetricCard"

import {
  StatusBadge,
} from "../../components/ui/StatusBadge"

import EntityHandoffSnapshot from "../../components/handoffs/EntityHandoffSnapshot"

import {
  useAuth,
} from "../../hooks/useAuth"

import {
  listActivitiesRequest,
} from "../../services/activitiesApi"

import type {
  ApiActivity,
} from "../../services/activitiesApi"

import {
  getOrganization720Request,
} from "../../services/organization720Api"

import type {
  Organization720ContactRelation,
  Organization720Projection,
} from "../../services/organization720Api"


function organizationTypeLabel(
  value: string,
) {
  const labels:
    Record<string, string> = {
      company:
        "Entreprise",
      partner:
        "Partenaire",
      insurer:
        "Assureur",
      foundation:
        "Fondation",
      association:
        "Association",
      public_body:
        "Organisme public",
      bank:
        "Institution financière",
      fiduciary:
        "Fiduciaire",
    }

  return (
    labels[value]
    ?? value.replaceAll(
      "_",
      " ",
    )
  )
}


function sourceLabel(
  value: string,
) {
  const labels:
    Record<string, string> = {
      manual:
        "Saisie manuelle",
      legacy_import:
        "Import historique",
      csv:
        "Import CSV",
      scraping:
        "Acquisition externe",
      client_360:
        "Client 360°",
    }

  return (
    labels[value]
    ?? value.replaceAll(
      "_",
      " ",
    )
  )
}


function locationLabel(
  projection:
    Organization720Projection,
) {
  const values = [
    projection.organization.city,
    projection.organization.country,
  ].filter(Boolean)

  return (
    values.length
      ? values.join(", ")
      : "Localisation non renseignée"
  )
}


function organizationInitials(
  name: string,
) {
  const words =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)

  if (!words.length) {
    return "OR"
  }

  if (words.length === 1) {
    return words[0]
      .slice(0, 2)
      .toUpperCase()
  }

  return (
    `${words[0][0]}${words[1][0]}`
      .toUpperCase()
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


function relationshipTypeLabel(
  value: string | null,
) {
  if (!value) {
    return "Relation historique Core"
  }

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
      decider:
        "Décideur",
      director:
        "Direction",
      owner:
        "Propriétaire",
      influencer:
        "Influenceur",
      employee:
        "Collaborateur",
      advisor:
        "Conseiller",
      user:
        "Utilisateur",
    }

  return (
    labels[value]
    ?? value.replaceAll(
      "_",
      " ",
    )
  )
}


function isDecisionMaker(
  relation:
    Organization720ContactRelation,
) {
  const value =
    relation.relationship
      ?.relationship_role
    ?? relation.contact
      .decision_role

  return [
    "decision_maker",
    "decider",
    "owner",
    "director",
  ].includes(
    value,
  )
}


function isActiveRelation(
  relation:
    Organization720ContactRelation,
) {
  if (
    relation.relationship
  ) {
    return (
      relation.relationship
        .is_active
    )
  }

  return (
    relation.contact
      .is_active
  )
}


function formatRelationDate(
  value: string | null,
) {
  if (!value) {
    return null
  }

  const date =
    new Date(
      `${value}T00:00:00`,
    )

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value
  }

  return new Intl.DateTimeFormat(
    "fr-CH",
    {
      month: "short",
      year: "numeric",
    },
  ).format(date)
}


function relationPeriodLabel(
  relation:
    Organization720ContactRelation,
) {
  const link =
    relation.relationship

  if (!link) {
    return "Période non renseignée"
  }

  const start =
    formatRelationDate(
      link.started_at,
    )

  const end =
    formatRelationDate(
      link.ended_at,
    )

  if (
    link.is_active
  ) {
    return start
      ? `Depuis ${start}`
      : "Relation actuelle"
  }

  if (
    start
    && end
  ) {
    return `${start} → ${end}`
  }

  if (end) {
    return `Jusqu'à ${end}`
  }

  if (start) {
    return `Depuis ${start}`
  }

  return "Période non renseignée"
}


function qualityFieldLabel(
  field: string,
) {
  const labels:
    Record<string, string> = {
      legal_name:
        "Raison sociale",
      industry:
        "Secteur",
      website:
        "Site web",
      email:
        "Email",
      phone:
        "Téléphone",
      country:
        "Pays",
      city:
        "Ville",
      address:
        "Adresse",
    }

  return (
    labels[field]
    ?? field.replaceAll(
      "_",
      " ",
    )
  )
}


function formatCoreDate(
  value: string | null,
) {
  if (!value) {
    return "Jamais"
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

  return new Intl.DateTimeFormat(
    "fr-CH",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date)
}


function formatBusinessMoney(
  value: number,
  currency: string,
) {
  return new Intl.NumberFormat(
    "fr-CH",
    {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    },
  ).format(value)
}


function commercialPipelineLabel(
  pipeline:
    Record<string, number>,
) {
  const entries =
    Object.entries(
      pipeline,
    )

  if (!entries.length) {
    return "Aucun pipeline actif"
  }

  return entries
    .map(
      (
        [
          currency,
          value,
        ],
      ) =>
        formatBusinessMoney(
          value,
          currency,
        ),
    )
    .join(" · ")
}


function organizationActivityContextLabel(
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
    ?? value.replaceAll(
      "_",
      " ",
    )
  )
}


function organizationActivityEventLabel(
  value: string,
) {
  const labels:
    Record<string, string> = {
      "action.created":
        "Action créée",
      "action.assigned":
        "Action assignée",
      "action.reassigned":
        "Action réassignée",
      "action.started":
        "Action démarrée",
      "action.blocked":
        "Action bloquée",
      "action.completed":
        "Action terminée",
      "action.reopened":
        "Action réouverte",
      "action.cancelled":
        "Action annulée",
      "client.advice_requested":
        "Demande de conseil",
    }

  return (
    labels[value]
    ?? value.replaceAll(
      ".",
      " · ",
    )
  )
}


function organizationActivityActorLabel(
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


function formatOrganizationActivityDate(
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

  return new Intl.DateTimeFormat(
    "fr-CH",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date)
}


export function Organization720Page() {
  const {
    organizationId,
  } = useParams()

  const {
    token,
  } = useAuth()

  const [
    organization720,
    setOrganization720,
  ] =
    useState<
      Organization720Projection
      | null
    >(null)

  const [
    loading,
    setLoading,
  ] =
    useState(false)

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    )

  const [
    activeSection,
    setActiveSection,
  ] =
    useState<
      "overview"
      | "contacts"
      | "history"
    >("overview")

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
    activityContextFilter,
    setActivityContextFilter,
  ] =
    useState("all")

  const [
    activityEventFilter,
    setActivityEventFilter,
  ] =
    useState("all")


  const [
    contactFilter,
    setContactFilter,
  ] =
    useState<
      "all"
      | "active"
      | "historical"
      | "decision_makers"
    >("all")


  useEffect(
    () => {
      if (
        !token
        || !organizationId
      ) {
        return
      }

      let cancelled = false

      void Promise.resolve()
        .then(
          () => {
            if (!cancelled) {
              setLoading(
                true,
              )
            }

            return (
              getOrganization720Request(
                token,
                organizationId,
              )
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

            setOrganization720(
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
            if (cancelled) {
              return
            }

            setError(
              caught instanceof Error
                ? caught.message
                : (
                  "Impossible de charger "
                  + "l'Organization 720°."
                ),
            )
          },
        )
        .finally(
          () => {
            if (!cancelled) {
              setLoading(
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
      organizationId,
      token,
    ],
  )


  useEffect(
    () => {
      if (
        !token
        || !organizationId
      ) {
        return
      }

      let cancelled = false

      setActivitiesLoading(
        true,
      )

      void listActivitiesRequest(
        token,
        {
          organizationId,
          limit: 500,
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
                : "Impossible de charger l'historique.",
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
      organizationId,
      token,
    ],
  )


  if (
    loading
    && !organization720
  ) {
    return (
      <div className="page-stack">
        <Link
          to="/hub/organizations"
          className="back-link"
        >
          <ArrowLeft
            size={16}
          />

          Organisations
        </Link>

        <section className="panel organization720-page-state">
          <RefreshCw
            size={23}
          />

          <strong>
            Chargement de l'Organization 720°...
          </strong>

          <span>
            Lecture des données KEMS Core.
          </span>
        </section>
      </div>
    )
  }


  if (
    error
    && !organization720
  ) {
    return (
      <div className="page-stack">
        <Link
          to="/hub/organizations"
          className="back-link"
        >
          <ArrowLeft
            size={16}
          />

          Organisations
        </Link>

        <section className="panel organization720-page-state error">
          <ShieldAlert
            size={25}
          />

          <strong>
            Organization 720° indisponible
          </strong>

          <span>
            {error}
          </span>

          <Link
            to="/hub/organizations"
            className="button secondary"
          >
            Retour aux organisations
          </Link>
        </section>
      </div>
    )
  }


  if (!organization720) {
    return null
  }


  const {
    organization,
    contact_summary: contactSummary,
    data_quality: dataQuality,
    provenance,
    contacts,
    business_summary: businessSummary,
  } = organization720


  const availableActivityContexts =
    Array.from(
      new Set(
        activities.map(
          (
            activity,
          ) =>
            activity.context,
        ),
      ),
    ).sort()


  const availableActivityEvents =
    Array.from(
      new Set(
        activities.map(
          (
            activity,
          ) =>
            activity.event_type,
        ),
      ),
    ).sort()


  const filteredActivities =
    activities.filter(
      (
        activity,
      ) => {
        const contextMatches =
          activityContextFilter
            === "all"
          || activity.context
            === activityContextFilter

        const eventMatches =
          activityEventFilter
            === "all"
          || activity.event_type
            === activityEventFilter

        return (
          contextMatches
          && eventMatches
        )
      },
    )


  const recentActivities =
    activities.slice(
      0,
      6,
    )


  const visibleContacts =
    contacts.filter(
      (
        relation,
      ) => {
        if (
          contactFilter
          === "active"
        ) {
          return (
            isActiveRelation(
              relation,
            )
          )
        }

        if (
          contactFilter
          === "historical"
        ) {
          return (
            !isActiveRelation(
              relation,
            )
          )
        }

        if (
          contactFilter
          === "decision_makers"
        ) {
          return (
            isDecisionMaker(
              relation,
            )
          )
        }

        return true
      },
    )


  return (
    <div className="page-stack organization720-page">
      <Link
        to="/hub/organizations"
        className="back-link"
      >
        <ArrowLeft
          size={16}
        />

        Organisations
      </Link>


      <section className="entity-hero organization720-hero">
        <div className="entity-hero-main">
          <div className="organization720-avatar">
            <Building2
              size={25}
            />

            <strong>
              {
                organizationInitials(
                  organization.name,
                )
              }
            </strong>
          </div>

          <div>
            <span className="eyebrow">
              Organization 720°
            </span>

            <h1>
              {organization.name}
            </h1>

            <p>
              {
                organization.industry
                ?? "Secteur non renseigné"
              }

              {" · "}

              {
                organizationTypeLabel(
                  organization.organization_type,
                )
              }
            </p>

            {
              organization.legal_name
              && organization.legal_name
                !== organization.name
                ? (
                  <span className="organization720-legal-name">
                    {
                      organization.legal_name
                    }
                  </span>
                )
                : null
            }

            <span className="muted">
              {
                locationLabel(
                  organization720,
                )
              }
            </span>

            <div className="badge-row">
              <StatusBadge
                tone={
                  organization.is_verified
                    ? "success"
                    : "warning"
                }
              >
                {
                  organization.is_verified
                    ? "Organisation vérifiée"
                    : "Organisation non vérifiée"
                }
              </StatusBadge>

              <StatusBadge
                tone={
                  organization.is_active
                    ? "success"
                    : undefined
                }
              >
                {
                  organization.is_active
                    ? "Active"
                    : "Inactive"
                }
              </StatusBadge>

              <StatusBadge tone="info">
                {
                  organizationTypeLabel(
                    organization.organization_type,
                  )
                }
              </StatusBadge>
            </div>
          </div>
        </div>


        <div className="entity-contact-grid">
          <div>
            <span>
              Site web
            </span>

            <strong>
              {
                organization.domain
                ?? organization.website
                ?? "Non renseigné"
              }
            </strong>
          </div>

          <div>
            <span>
              Email
            </span>

            <strong>
              {
                organization.email
                ?? "Non renseigné"
              }
            </strong>
          </div>

          <div>
            <span>
              Téléphone
            </span>

            <strong>
              {
                organization.phone
                ?? "Non renseigné"
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
                  provenance.source_type,
                )
              }
            </strong>
          </div>
        </div>
      </section>


      <div
        className="section-tabs organization720-section-tabs"
        role="tablist"
        aria-label="Navigation Organization 720°"
      >
        <button
          type="button"
          role="tab"
          aria-selected={
            activeSection
            === "overview"
          }
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
          role="tab"
          aria-selected={
            activeSection
            === "contacts"
          }
          className={
            activeSection
              === "contacts"
              ? "tab active"
              : "tab"
          }
          onClick={() =>
            setActiveSection(
              "contacts",
            )
          }
        >
          Contacts
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={
            activeSection
            === "history"
          }
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


      <section className="entity720-quick-nav">
        <div>
          <span className="eyebrow">
            Organization 720°
          </span>

          <p>
            {
              activeSection
                === "overview"
                ? (
                  "Vue transverse de l'organisation, "
                  + "de ses relations et de son activité KEMS."
                )
                : activeSection
                  === "contacts"
                  ? (
                    "Contacts, décideurs et affiliations "
                    + "rattachés à cette organisation."
                  )
                  : (
                    "Historique transverse des événements "
                    + "rattachés à cette organisation."
                  )
            }
          </p>
        </div>

        <div className="entity720-quick-actions">
          {
            activeSection
            !== "overview"
              ? (
                <button
                  type="button"
                  className="button secondary"
                  onClick={() =>
                    setActiveSection(
                      "overview",
                    )
                  }
                >
                  <Building2
                    size={16}
                  />

                  Overview
                </button>
              )
              : null
          }

          {
            activeSection
            !== "contacts"
              ? (
                <button
                  type="button"
                  className="button secondary"
                  onClick={() =>
                    setActiveSection(
                      "contacts",
                    )
                  }
                >
                  <Users
                    size={16}
                  />

                  Contacts liés
                </button>
              )
              : null
          }

          {
            activeSection
            !== "history"
              ? (
                <button
                  type="button"
                  className="button secondary"
                  onClick={() =>
                    setActiveSection(
                      "history",
                    )
                  }
                >
                  <History
                    size={16}
                  />

                  Historique
                </button>
              )
              : null
          }
        </div>
      </section>


      {
        activeSection
        === "overview"
          ? (
            <>
              <EntityHandoffSnapshot
                token={
                  token
                }
                organizationId={
                  organization.id
                }
              />


              <section className="metric-grid three">
                <MetricCard
                  label="Contacts liés"
                  value={
                    String(
                      contactSummary
                        .total_contacts,
                    )
                  }
                  hint={
                    (
                      `${contactSummary.active_relations}`
                      + " relation"
                      + (
                        contactSummary.active_relations
                          > 1
                          ? "s actives"
                          : " active"
                      )
                    )
                  }
                />

                <MetricCard
                  label="Décideurs identifiés"
                  value={
                    String(
                      contactSummary
                        .decision_makers,
                    )
                  }
                  hint="Relations Core"
                />

                <MetricCard
                  label="Qualité Core"
                  value={
                    `${dataQuality.completeness_score}%`
                  }
                  hint={
                    dataQuality.is_verified
                      ? "Organisation vérifiée"
                      : "Vérification à compléter"
                  }
                />
              </section>


              <section className="organization720-business-section">
                <div className="organization720-business-heading">
                  <div>
                    <span className="eyebrow">
                      Vue transverse
                    </span>

                    <h2>
                      Activité par métier
                    </h2>

                    <p>
                      Résumés issus uniquement des données
                      réellement rattachées à cette organisation.
                    </p>
                  </div>
                </div>


                <div className="organization720-business-grid">
                  <article className="organization720-business-card commercial">
                    <div className="organization720-business-card-head">
                      <Handshake
                        size={20}
                      />

                      <span>
                        Commercial
                      </span>
                    </div>

                    {
                      businessSummary
                        .commercial
                        .accessible
                        ? (
                          <>
                            <strong>
                              {
                                businessSummary
                                  .commercial
                                  .active_opportunities
                              }
                              {" opportunité"}
                              {
                                businessSummary
                                  .commercial
                                  .active_opportunities
                                > 1
                                  ? "s actives"
                                  : " active"
                              }
                            </strong>

                            <span>
                              {
                                commercialPipelineLabel(
                                  businessSummary
                                    .commercial
                                    .pipeline_by_currency,
                                )
                              }
                            </span>

                            <small>
                              {
                                businessSummary
                                  .commercial
                                  .leads
                              }
                              {" lead"}
                              {
                                businessSummary
                                  .commercial
                                  .leads
                                > 1
                                  ? "s"
                                  : ""
                              }
                              {" · "}
                              {
                                businessSummary
                                  .commercial
                                  .qualified_leads
                              }
                              {" qualifié"}
                              {
                                businessSummary
                                  .commercial
                                  .qualified_leads
                                > 1
                                  ? "s"
                                  : ""
                              }
                              {" · Growth Engine"}
                            </small>
                          </>
                        )
                        : (
                          <div className="organization720-business-restricted">
                            Vue disponible dans le contexte Commercial
                            ou Direction.
                          </div>
                        )
                    }
                  </article>


                  <article className="organization720-business-card assurance">
                    <div className="organization720-business-card-head">
                      <ShieldCheck
                        size={20}
                      />

                      <span>
                        Assurance
                      </span>
                    </div>

                    {
                      businessSummary
                        .assurance
                        .accessible
                        ? (
                          <>
                            <strong>
                              {
                                businessSummary
                                  .assurance
                                  .active_actions
                              }
                              {" action"}
                              {
                                businessSummary
                                  .assurance
                                  .active_actions
                                > 1
                                  ? "s actives"
                                  : " active"
                              }
                            </strong>

                            <span>
                              {
                                businessSummary
                                  .assurance
                                  .total_actions
                              }
                              {" action"}
                              {
                                businessSummary
                                  .assurance
                                  .total_actions
                                > 1
                                  ? "s"
                                  : ""
                              }
                              {" au total"}
                            </span>

                            <small>
                              Module métier à connecter
                            </small>
                          </>
                        )
                        : (
                          <div className="organization720-business-restricted">
                            Vue disponible dans le contexte Assurance
                            ou Direction.
                          </div>
                        )
                    }
                  </article>


                  <article className="organization720-business-card investissement">
                    <div className="organization720-business-card-head">
                      <TrendingUp
                        size={20}
                      />

                      <span>
                        Investissement
                      </span>
                    </div>

                    {
                      businessSummary
                        .investissement
                        .accessible
                        ? (
                          <>
                            <strong>
                              {
                                businessSummary
                                  .investissement
                                  .active_actions
                              }
                              {" action"}
                              {
                                businessSummary
                                  .investissement
                                  .active_actions
                                > 1
                                  ? "s actives"
                                  : " active"
                              }
                            </strong>

                            <span>
                              {
                                businessSummary
                                  .investissement
                                  .total_actions
                              }
                              {" au total"}
                            </span>

                            <small>
                              Module métier à connecter
                            </small>
                          </>
                        )
                        : (
                          <div className="organization720-business-restricted">
                            Vue disponible dans le contexte Investissement
                            ou Direction.
                          </div>
                        )
                    }
                  </article>


                  <article className="organization720-business-card fiduciaire">
                    <div className="organization720-business-card-head">
                      <Calculator
                        size={20}
                      />

                      <span>
                        Fiduciaire
                      </span>
                    </div>

                    {
                      businessSummary
                        .fiduciaire
                        .accessible
                        ? (
                          <>
                            <strong>
                              {
                                businessSummary
                                  .fiduciaire
                                  .active_actions
                              }
                              {" action"}
                              {
                                businessSummary
                                  .fiduciaire
                                  .active_actions
                                > 1
                                  ? "s actives"
                                  : " active"
                              }
                            </strong>

                            <span>
                              {
                                businessSummary
                                  .fiduciaire
                                  .total_actions
                              }
                              {" au total"}
                            </span>

                            <small>
                              Module métier à connecter
                            </small>
                          </>
                        )
                        : (
                          <div className="organization720-business-restricted">
                            Vue disponible dans le contexte Fiduciaire
                            ou Direction.
                          </div>
                        )
                    }
                  </article>


                  <article className="organization720-business-card technologies">
                    <div className="organization720-business-card-head">
                      <Sparkles
                        size={20}
                      />

                      <span>
                        Technologies
                      </span>
                    </div>

                    {
                      businessSummary
                        .technologies
                        .accessible
                        ? (
                          <>
                            <strong>
                              {
                                businessSummary
                                  .technologies
                                  .active_actions
                              }
                              {" action"}
                              {
                                businessSummary
                                  .technologies
                                  .active_actions
                                > 1
                                  ? "s actives"
                                  : " active"
                              }
                            </strong>

                            <span>
                              {
                                businessSummary
                                  .technologies
                                  .total_actions
                              }
                              {" au total"}
                            </span>

                            <small>
                              Module métier à connecter
                            </small>
                          </>
                        )
                        : (
                          <div className="organization720-business-restricted">
                            Vue disponible dans le contexte Technologies
                            ou Direction.
                          </div>
                        )
                    }
                  </article>
                </div>
              </section>


              <section className="panel organization720-timeline-panel">
                <div className="organization720-timeline-heading">
                  <div>
                    <span className="eyebrow">
                      Activité Core
                    </span>

                    <h2>
                      Activité récente
                    </h2>

                    <p>
                      Événements réellement rattachés
                      à cette organisation.
                    </p>
                  </div>

                  <div className="organization720-timeline-count">
                    <History
                      size={17}
                    />

                    <strong>
                      {
                        activities.length
                      }
                    </strong>

                    <span>
                      événement
                      {
                        activities.length
                        > 1
                          ? "s"
                          : ""
                      }
                    </span>
                  </div>
                </div>


                {
                  activitiesLoading
                    ? (
                      <div className="organization720-timeline-empty">
                        <RefreshCw
                          size={19}
                        />

                        Chargement de l'activité...
                      </div>
                    )
                    : activitiesError
                      ? (
                        <div className="organization720-timeline-empty error">
                          <ShieldAlert
                            size={19}
                          />

                          {
                            activitiesError
                          }
                        </div>
                      )
                      : recentActivities.length
                        ? (
                          <>
                            <div className="organization720-timeline">
                              {
                                recentActivities.map(
                                  (
                                    activity,
                                  ) => (
                                    <article
                                      key={
                                        activity.id
                                      }
                                      className="organization720-timeline-item"
                                    >
                                      <div
                                        className={
                                          `organization720-timeline-dot ${activity.context}`
                                        }
                                      >
                                        <Clock3
                                          size={14}
                                        />
                                      </div>

                                      <div className="organization720-timeline-content">
                                        <div className="organization720-timeline-top">
                                          <strong>
                                            {
                                              activity.title
                                            }
                                          </strong>

                                          <span>
                                            {
                                              formatOrganizationActivityDate(
                                                activity.created_at,
                                              )
                                            }
                                          </span>
                                        </div>

                                        {
                                          activity.description
                                            ? (
                                              <p>
                                                {
                                                  activity.description
                                                }
                                              </p>
                                            )
                                            : null
                                        }

                                        <div className="organization720-timeline-meta">
                                          <span
                                            className={
                                              `organization720-context-chip ${activity.context}`
                                            }
                                          >
                                            {
                                              organizationActivityContextLabel(
                                                activity.context,
                                              )
                                            }
                                          </span>

                                          <span>
                                            {
                                              organizationActivityEventLabel(
                                                activity.event_type,
                                              )
                                            }
                                          </span>

                                          <span>
                                            {
                                              organizationActivityActorLabel(
                                                activity,
                                              )
                                            }
                                          </span>
                                        </div>
                                      </div>
                                    </article>
                                  ),
                                )
                              }
                            </div>

                            {
                              activities.length
                              > 6
                                ? (
                                  <button
                                    type="button"
                                    className="button secondary"
                                    onClick={() =>
                                      setActiveSection(
                                        "history",
                                      )
                                    }
                                  >
                                    Voir tout l'historique
                                  </button>
                                )
                                : null
                            }
                          </>
                        )
                        : (
                          <div className="organization720-timeline-empty">
                            <History
                              size={20}
                            />

                            <strong>
                              Aucun événement enregistré
                            </strong>

                            <span>
                              Les prochaines activités liées
                              à cette organisation apparaîtront ici.
                            </span>
                          </div>
                        )
                }
              </section>


              <section className="organization720-quality-grid">
                <div className="panel organization720-quality-card">
                  <div className="organization720-quality-heading">
                    <div className="organization720-quality-icon">
                      <ShieldCheck
                        size={20}
                      />
                    </div>

                    <div>
                      <span className="eyebrow">
                        Qualité Core
                      </span>

                      <h2>
                        Qualité & vérification
                      </h2>
                    </div>
                  </div>

                  <div className="organization720-quality-score">
                    <div>
                      <strong>
                        {
                          dataQuality
                            .completeness_score
                        }
                        %
                      </strong>

                      <span>
                        Complétude
                      </span>
                    </div>

                    <div>
                      <strong
                        className={
                          dataQuality
                            .is_verified
                            ? "is-verified"
                            : "is-unverified"
                        }
                      >
                        {
                          dataQuality
                            .is_verified
                            ? "Vérifiée"
                            : "À vérifier"
                        }
                      </strong>

                      <span>
                        Vérification
                      </span>
                    </div>
                  </div>

                  {
                    dataQuality
                      .missing_fields
                      .length
                      ? (
                        <div className="organization720-missing">
                          <div>
                            <ShieldAlert
                              size={15}
                            />

                            <strong>
                              Informations à compléter
                            </strong>
                          </div>

                          <div className="organization720-missing-tags">
                            {
                              dataQuality
                                .missing_fields
                                .map(
                                  (
                                    field,
                                  ) => (
                                    <span
                                      key={
                                        field
                                      }
                                    >
                                      {
                                        qualityFieldLabel(
                                          field,
                                        )
                                      }
                                    </span>
                                  ),
                                )
                            }
                          </div>
                        </div>
                      )
                      : (
                        <div className="organization720-complete">
                          <CircleCheck
                            size={15}
                          />

                          Données essentielles complètes
                        </div>
                      )
                  }
                </div>


                <div className="panel organization720-provenance-card">
                  <div className="organization720-quality-heading">
                    <div className="organization720-quality-icon provenance">
                      <Database
                        size={20}
                      />
                    </div>

                    <div>
                      <span className="eyebrow">
                        Traçabilité
                      </span>

                      <h2>
                        Provenance des données
                      </h2>
                    </div>
                  </div>

                  <div className="organization720-provenance-list">
                    <div>
                      <span>
                        Source organisation
                      </span>

                      <strong>
                        {
                          sourceLabel(
                            provenance
                              .source_type,
                          )
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Référence source
                      </span>

                      <strong>
                        {
                          provenance
                            .source_reference
                          ?? "Aucune"
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Collectée le
                      </span>

                      <strong>
                        {
                          formatCoreDate(
                            provenance
                              .collected_at,
                          )
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Dernière vérification
                      </span>

                      <strong>
                        {
                          formatCoreDate(
                            provenance
                              .last_verified_at,
                          )
                        }
                      </strong>
                    </div>
                  </div>

                  <div className="organization720-provenance-meta">
                    <span>
                      Type
                    </span>

                    <strong>
                      {
                        organizationTypeLabel(
                          organization
                            .organization_type,
                        )
                      }
                    </strong>

                    <small>
                      Statut Core : {
                        organization
                          .is_active
                          ? "Active"
                          : "Inactive"
                      }
                    </small>
                  </div>
                </div>
              </section>


              <section className="panel organization720-foundation">
                <div className="organization720-foundation-icon">
                  <Users
                    size={21}
                  />
                </div>

                <div>
                  <span className="eyebrow">
                    Relations Core
                  </span>

                  <h2>
                    Réseau organisationnel
                  </h2>

                  <p>
                    {
                      contactSummary.total_contacts
                    }
                    {" contact"}
                    {
                      contactSummary.total_contacts
                      > 1
                        ? "s"
                        : ""
                    }
                    {" connu"}
                    {
                      contactSummary.total_contacts
                      > 1
                        ? "s"
                        : ""
                    }
                    {" dans KEMS Core, dont "}
                    {
                      contactSummary.decision_makers
                    }
                    {" décideur"}
                    {
                      contactSummary.decision_makers
                      > 1
                        ? "s"
                        : ""
                    }
                    {" identifié"}
                    {
                      contactSummary.decision_makers
                      > 1
                        ? "s"
                        : ""
                    }
                    .
                  </p>

                  <button
                    type="button"
                    className="button secondary"
                    onClick={() =>
                      setActiveSection(
                        "contacts",
                      )
                    }
                  >
                    Voir les contacts liés
                  </button>
                </div>
              </section>
            </>
          )
          : null
      }


      {
        activeSection
        === "history"
          ? (
            <section className="panel organization720-history-panel">
              <div className="organization720-timeline-heading">
                <div>
                  <span className="eyebrow">
                    Historique complet
                  </span>

                  <h2>
                    Timeline organisation
                  </h2>

                  <p>
                    Historique transverse visible selon
                    les droits et le contexte actif.
                  </p>
                </div>

                <div className="organization720-timeline-count">
                  <History
                    size={17}
                  />

                  <strong>
                    {
                      filteredActivities.length
                    }
                  </strong>

                  <span>
                    affiché
                    {
                      filteredActivities.length
                      > 1
                        ? "s"
                        : ""
                    }
                  </span>
                </div>
              </div>


              <div className="organization720-history-filters">
                <label>
                  <span>
                    Métier
                  </span>

                  <select
                    value={
                      activityContextFilter
                    }
                    onChange={
                      (
                        event,
                      ) =>
                        setActivityContextFilter(
                          event.target.value,
                        )
                    }
                  >
                    <option value="all">
                      Tous les contextes
                    </option>

                    {
                      availableActivityContexts.map(
                        (
                          context,
                        ) => (
                          <option
                            key={
                              context
                            }
                            value={
                              context
                            }
                          >
                            {
                              organizationActivityContextLabel(
                                context,
                              )
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
                      activityEventFilter
                    }
                    onChange={
                      (
                        event,
                      ) =>
                        setActivityEventFilter(
                          event.target.value,
                        )
                    }
                  >
                    <option value="all">
                      Tous les événements
                    </option>

                    {
                      availableActivityEvents.map(
                        (
                          eventType,
                        ) => (
                          <option
                            key={
                              eventType
                            }
                            value={
                              eventType
                            }
                          >
                            {
                              organizationActivityEventLabel(
                                eventType,
                              )
                            }
                          </option>
                        ),
                      )
                    }
                  </select>
                </label>

                <button
                  type="button"
                  className="button secondary"
                  onClick={() => {
                    setActivityContextFilter(
                      "all",
                    )
                    setActivityEventFilter(
                      "all",
                    )
                  }}
                >
                  Réinitialiser
                </button>
              </div>


              {
                activitiesLoading
                  ? (
                    <div className="organization720-timeline-empty">
                      Chargement...
                    </div>
                  )
                  : filteredActivities.length
                    ? (
                      <div className="organization720-timeline full">
                        {
                          filteredActivities.map(
                            (
                              activity,
                            ) => (
                              <article
                                key={
                                  activity.id
                                }
                                className="organization720-timeline-item"
                              >
                                <div
                                  className={
                                    `organization720-timeline-dot ${activity.context}`
                                  }
                                >
                                  <Clock3
                                    size={14}
                                  />
                                </div>

                                <div className="organization720-timeline-content">
                                  <div className="organization720-timeline-top">
                                    <strong>
                                      {
                                        activity.title
                                      }
                                    </strong>

                                    <span>
                                      {
                                        formatOrganizationActivityDate(
                                          activity.created_at,
                                        )
                                      }
                                    </span>
                                  </div>

                                  {
                                    activity.description
                                      ? (
                                        <p>
                                          {
                                            activity.description
                                          }
                                        </p>
                                      )
                                      : null
                                  }

                                  <div className="organization720-timeline-meta">
                                    <span
                                      className={
                                        `organization720-context-chip ${activity.context}`
                                      }
                                    >
                                      {
                                        organizationActivityContextLabel(
                                          activity.context,
                                        )
                                      }
                                    </span>

                                    <span>
                                      {
                                        organizationActivityEventLabel(
                                          activity.event_type,
                                        )
                                      }
                                    </span>

                                    <span>
                                      {
                                        organizationActivityActorLabel(
                                          activity,
                                        )
                                      }
                                    </span>

                                    {
                                      activity.action_id
                                        ? (
                                          <span>
                                            Action liée
                                          </span>
                                        )
                                        : null
                                    }

                                    {
                                      activity.source_entity_type
                                        ? (
                                          <span>
                                            Source : {
                                              activity.source_entity_type
                                            }
                                          </span>
                                        )
                                        : null
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
                      <div className="organization720-timeline-empty">
                        <History
                          size={20}
                        />

                        <strong>
                          Aucun événement dans cette vue
                        </strong>

                        <span>
                          Modifie les filtres ou attends
                          une nouvelle activité liée à l'organisation.
                        </span>
                      </div>
                    )
              }
            </section>
          )
          : null
      }


      {
        activeSection
        === "contacts"
          ? (
            <section className="panel organization720-contacts-panel">
              <div className="organization720-contacts-heading">
                <div>
                  <span className="eyebrow">
                    Relations Core
                  </span>

                  <h2>
                    Contacts & décideurs
                  </h2>

                  <p>
                    Personnes actuellement ou historiquement
                    rattachées à cette organisation.
                  </p>
                </div>

                <div className="organization720-contact-counter">
                  <Users
                    size={18}
                  />

                  <strong>
                    {
                      contactSummary.total_contacts
                    }
                  </strong>

                  <span>
                    contact
                    {
                      contactSummary.total_contacts
                      > 1
                        ? "s"
                        : ""
                    }
                  </span>
                </div>
              </div>


              <div className="organization720-relation-summary">
                <button
                  type="button"
                  className={
                    contactFilter
                      === "all"
                      ? "organization720-relation-stat active"
                      : "organization720-relation-stat"
                  }
                  onClick={() =>
                    setContactFilter(
                      "all",
                    )
                  }
                >
                  <span>
                    Toutes
                  </span>

                  <strong>
                    {
                      contactSummary.total_contacts
                    }
                  </strong>
                </button>

                <button
                  type="button"
                  className={
                    contactFilter
                      === "active"
                      ? "organization720-relation-stat active"
                      : "organization720-relation-stat"
                  }
                  onClick={() =>
                    setContactFilter(
                      "active",
                    )
                  }
                >
                  <span>
                    Actives
                  </span>

                  <strong>
                    {
                      contactSummary.active_relations
                    }
                  </strong>
                </button>

                <button
                  type="button"
                  className={
                    contactFilter
                      === "historical"
                      ? "organization720-relation-stat active"
                      : "organization720-relation-stat"
                  }
                  onClick={() =>
                    setContactFilter(
                      "historical",
                    )
                  }
                >
                  <span>
                    Historiques
                  </span>

                  <strong>
                    {
                      contactSummary.historical_relations
                    }
                  </strong>
                </button>

                <button
                  type="button"
                  className={
                    contactFilter
                      === "decision_makers"
                      ? "organization720-relation-stat active"
                      : "organization720-relation-stat"
                  }
                  onClick={() =>
                    setContactFilter(
                      "decision_makers",
                    )
                  }
                >
                  <span>
                    Décideurs
                  </span>

                  <strong>
                    {
                      contactSummary.decision_makers
                    }
                  </strong>
                </button>
              </div>


              {
                visibleContacts.length
                  ? (
                    <div className="organization720-contact-list">
                      {
                        visibleContacts.map(
                          (
                            relation,
                          ) => {
                            const {
                              contact,
                              relationship,
                            } = relation

                            const active =
                              isActiveRelation(
                                relation,
                              )

                            const decisionMaker =
                              isDecisionMaker(
                                relation,
                              )

                            const jobTitle =
                              relationship
                                ?.job_title
                              ?? contact.job_title
                              ?? "Fonction non renseignée"

                            const role =
                              relationship
                                ?.relationship_role
                              ?? contact.decision_role

                            return (
                              <article
                                key={
                                  relationship?.id
                                  ?? contact.id
                                }
                                className="organization720-contact-card"
                              >
                                <div className="organization720-contact-main">
                                  <div className="avatar">
                                    {
                                      contactInitials(
                                        contact.first_name,
                                        contact.last_name,
                                      )
                                    }
                                  </div>

                                  <div>
                                    <div className="organization720-contact-name">
                                      <strong>
                                        {
                                          contact.first_name
                                        }
                                        {" "}
                                        {
                                          contact.last_name
                                        }
                                      </strong>

                                      {
                                        decisionMaker
                                          ? (
                                            <StatusBadge tone="info">
                                              Décideur
                                            </StatusBadge>
                                          )
                                          : null
                                      }

                                      {
                                        relationship?.is_primary
                                          ? (
                                            <StatusBadge>
                                              Principal
                                            </StatusBadge>
                                          )
                                          : null
                                      }

                                      <StatusBadge
                                        tone={
                                          active
                                            ? "success"
                                            : undefined
                                        }
                                      >
                                        {
                                          active
                                            ? "Actif"
                                            : "Historique"
                                        }
                                      </StatusBadge>
                                    </div>

                                    <span>
                                      {jobTitle}
                                    </span>

                                    <small>
                                      {
                                        contact.email
                                        ?? "Email non renseigné"
                                      }
                                    </small>
                                  </div>
                                </div>


                                <Link
                                  className="registry-icon-action"
                                  to={
                                    `/hub/contacts/${contact.id}`
                                  }
                                  title="Voir Client 720°"
                                  aria-label={
                                    `Voir Client 720° de ${
                                      contact.first_name
                                    } ${
                                      contact.last_name
                                    }`
                                  }
                                >
                                  <UserRound
                                    size={17}
                                  />
                                </Link>


                                <div className="organization720-contact-details">
                                  <div>
                                    <span>
                                      Relation
                                    </span>

                                    <strong>
                                      {
                                        relationshipTypeLabel(
                                          relationship
                                            ?.relationship_type
                                          ?? null,
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
                                        relationshipRoleLabel(
                                          role,
                                        )
                                      }
                                    </strong>
                                  </div>

                                  <div>
                                    <span>
                                      Période
                                    </span>

                                    <strong>
                                      <CalendarDays
                                        size={14}
                                      />

                                      {
                                        relationPeriodLabel(
                                          relation,
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
                                        sourceLabel(
                                          contact.source_type,
                                        )
                                      }
                                    </strong>
                                  </div>

                                  <div>
                                    <span>
                                      Vérification
                                    </span>

                                    <strong
                                      className={
                                        contact.is_verified
                                          ? "organization720-verified"
                                          : "organization720-unverified"
                                      }
                                    >
                                      {
                                        contact.is_verified
                                          ? "Vérifié"
                                          : "À vérifier"
                                      }
                                    </strong>
                                  </div>

                                  <div>
                                    <span>
                                      Téléphone
                                    </span>

                                    <strong>
                                      {
                                        contact.phone
                                        ?? "Non renseigné"
                                      }
                                    </strong>
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
                    <div className="organization720-empty-relations">
                      <CircleCheck
                        size={22}
                      />

                      <strong>
                        Aucun contact dans cette vue
                      </strong>

                      <span>
                        Aucun rattachement ne correspond
                        au filtre sélectionné.
                      </span>
                    </div>
                  )
              }
            </section>
          )
          : null
      }
    </div>
  )
}
