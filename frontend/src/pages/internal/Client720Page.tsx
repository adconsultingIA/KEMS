import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CircleCheck,
  Clock3,
  FileText,
  RefreshCw,
  ShieldCheck,
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
import type {
  ApiActivity,
} from "../../services/activitiesApi"

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

  return new Intl.DateTimeFormat(
    "fr-CH",
    {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date)
}


export function Client720Page() {
  const {
    contactId,
  } = useParams()

  const {
    token,
  } = useAuth()

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
                limit: 50,
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
        <div className="entity-hero-main">
          <div className="avatar hero-avatar">JD</div>

          <div>
            <span className="eyebrow">Client 720°</span>
            <h1>Jean Dupont</h1>
            <p>
              Directeur — Example Consulting SA
            </p>
            <span className="muted">
              Genève, Suisse
            </span>

            <div className="badge-row">
              <StatusBadge tone="success">
                Vérifié
              </StatusBadge>
              <StatusBadge tone="info">
                Décideur
              </StatusBadge>
              <StatusBadge>Client actif</StatusBadge>
              <StatusBadge>Assurance</StatusBadge>
              <StatusBadge>
                Investissement
              </StatusBadge>
            </div>
          </div>
        </div>

        <div className="entity-contact-grid">
          <div>
            <span>Email</span>
            <strong>jean.dupont@example.ch</strong>
          </div>
          <div>
            <span>Téléphone</span>
            <strong>+41 79 123 45 67</strong>
          </div>
          <div>
            <span>Source</span>
            <strong>Legacy import</strong>
          </div>
          <div>
            <span>Qualité</span>
            <strong>94%</strong>
          </div>
        </div>
      </section>

      <div className="section-tabs">
        <button className="tab active">Overview</button>
        <button className="tab">Relations</button>
        <button className="tab">Commercial</button>
        <button className="tab">Assurance</button>
        <button className="tab">Investissement</button>
        <button className="tab">Fiduciaire</button>
        <button className="tab">Documents</button>
        <button className="tab">Historique</button>
      </div>

      <section className="metric-grid three">
        <MetricCard
          label="Relationship Health"
          value="88/100"
          hint="Relation forte"
        />
        <MetricCard
          label="Data Quality"
          value="94%"
          hint="Données fiables"
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
              <h2>Activité récente</h2>
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
              {activities.map(
                (
                  activity,
                ) => (
                  <div
                    className={
                      `timeline-item timeline-context-${activity.context}`
                    }
                    key={
                      activity.id
                    }
                  >
                    <div className="timeline-dot" />

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

                      <p>
                        {
                          contextLabel(
                            activity.context,
                          )
                        }
                        {" · "}
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
                ),
              )}
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
  )
}
