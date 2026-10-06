import {
  ArrowRight,
  ShieldAlert,
} from "lucide-react"
import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  Link,
  useNavigate,
} from "react-router-dom"
import {
  directionBusinessCards,
  projectionDefinitions,
} from "../../config/businessProjection"
import type {
  ProjectionKey,
} from "../../context/projection-context"
import { MetricCard } from "../../components/ui/MetricCard"
import { actions } from "../../data/demo"
import { useAuth } from "../../hooks/useAuth"
import {
  useProjection,
} from "../../hooks/useProjection"

import {
  listHandoffsRequest,
  listOpportunitiesRequest,
} from "../../services/growthApi"

import type {
  GrowthOpportunity,
  OpportunityHandoff,
} from "../../services/growthApi"

function normalizeBusinessCode(
  value: string,
) {
  return value
    .trim()
    .toUpperCase()
    .replaceAll("É", "E")
    .replaceAll("È", "E")
    .replaceAll("À", "A")
    .replaceAll(" ", "_")
}


function dashboardMoney(
  value: number | null,
  currency: string,
) {
  if (
    value === null
  ) {
    return "—"
  }

  try {
    return new Intl.NumberFormat(
      "fr-CH",
      {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      },
    ).format(
      value,
    )
  } catch {
    return `${
      value.toLocaleString(
        "fr-CH",
      )
    } ${currency}`
  }
}


const contextPriorities:
  Record<
    Exclude<
      ProjectionKey,
      "direction"
    >,
    {
      title: string
      detail: string
      meta: string
    }[]
  > = {
    commercial: [
      {
        title:
          "Relancer une opportunité",
        detail:
          "Prospect qualifié · Commercial",
        meta:
          "Aujourd'hui",
      },
      {
        title:
          "Préparer proposition",
        detail:
          "Nouvelle demande · Commercial",
        meta:
          "Demain",
      },
      {
        title:
          "Revoir pipeline",
        detail:
          "7 opportunités sans activité",
        meta:
          "Cette semaine",
      },
    ],

    assurance: [
      {
        title:
          "Renouvellement Assurance",
        detail:
          "Jean Dupont · Assurance",
        meta:
          "Aujourd'hui",
      },
      {
        title:
          "Dossier incomplet",
        detail:
          "Documents manquants",
        meta:
          "Aujourd'hui",
      },
      {
        title:
          "Opportunité à qualifier",
        detail:
          "Nouveau client Assurance",
        meta:
          "Demain",
      },
    ],

    investissement: [
      {
        title:
          "Analyse portefeuille",
        detail:
          "Client prioritaire",
        meta:
          "Aujourd'hui",
      },
      {
        title:
          "Opportunité à revoir",
        detail:
          "Investissement · Analyse",
        meta:
          "Demain",
      },
      {
        title:
          "Profil client à actualiser",
        detail:
          "Données à confirmer",
        meta:
          "Cette semaine",
      },
    ],

    fiduciaire: [
      {
        title:
          "Échéance mandat",
        detail:
          "Dossier prioritaire",
        meta:
          "Aujourd'hui",
      },
      {
        title:
          "Pièces manquantes",
        detail:
          "Client Fiduciaire",
        meta:
          "Demain",
      },
      {
        title:
          "Validation dossier",
        detail:
          "Mandat en cours",
        meta:
          "Cette semaine",
      },
    ],

    technologies: [
      {
        title:
          "Devis à relancer",
        detail:
          "Client Technologies",
        meta:
          "Aujourd'hui",
      },
      {
        title:
          "Ticket critique",
        detail:
          "Support · Priorité haute",
        meta:
          "Aujourd'hui",
      },
      {
        title:
          "Livrable à valider",
        detail:
          "Projet actif",
        meta:
          "Demain",
      },
    ],
  }

export function DashboardPage() {
  const {
    auth,
    token,
  } = useAuth()

  const {
    activeContext,
    canSwitchContext,
    setActiveContext,
  } = useProjection()

  const [
    businessHandoffs,
    setBusinessHandoffs,
  ] =
    useState<
      OpportunityHandoff[]
    >([])

  const [
    businessOpportunities,
    setBusinessOpportunities,
  ] =
    useState<
      GrowthOpportunity[]
    >([])

  const [
    businessInboxLoading,
    setBusinessInboxLoading,
  ] =
    useState(false)

  const navigate = useNavigate()

  const definition =
    projectionDefinitions[
      activeContext
    ]

  const firstName =
    auth?.profile?.full_name
      ?.split(" ")[0]
    ?? "KEMS"

  function openContext(
    context: ProjectionKey,
  ) {
    if (!canSwitchContext) {
      return
    }

    setActiveContext(context)
    navigate("/hub")
  }

  useEffect(
    () => {
      if (
        activeContext
        === "direction"
        || activeContext
          === "commercial"
      ) {
        return
      }

      let cancelled =
        false

      async function loadBusinessInbox() {
        setBusinessInboxLoading(
          true,
        )

        try {
          const [
            handoffData,
            opportunityData,
          ] =
            await Promise.all([
              listHandoffsRequest(
                token,
              ),
              listOpportunitiesRequest(
                token,
              ),
            ])

          if (
            cancelled
          ) {
            return
          }

          setBusinessHandoffs(
            handoffData,
          )

          setBusinessOpportunities(
            opportunityData,
          )
        } catch {
          if (
            !cancelled
          ) {
            setBusinessHandoffs(
              [],
            )

            setBusinessOpportunities(
              [],
            )
          }
        } finally {
          if (
            !cancelled
          ) {
            setBusinessInboxLoading(
              false,
            )
          }
        }
      }

      void loadBusinessInbox()

      return () => {
        cancelled =
          true
      }
    },
    [
      activeContext,
      token,
    ],
  )


  const incomingOpportunities =
    useMemo(
      () => {
        if (
          activeContext
          === "direction"
          || activeContext
            === "commercial"
        ) {
          return []
        }

        const expectedCode =
          normalizeBusinessCode(
            activeContext,
          )

        return businessHandoffs
          .filter(
            handoff =>
              normalizeBusinessCode(
                handoff
                  .target_unit
                  .code,
              )
              === expectedCode,
          )
          .filter(
            handoff =>
              handoff.status
              === "handed_off",
          )
          .map(
            handoff => ({
              handoff,
              opportunity:
                businessOpportunities
                  .find(
                    opportunity =>
                      opportunity.id
                      === handoff
                        .opportunity_id,
                  )
                ?? null,
            }),
          )
          .sort(
            (
              left,
              right,
            ) =>
              new Date(
                right.handoff
                  .handed_off_at,
              ).getTime()
              - new Date(
                left.handoff
                  .handed_off_at,
              ).getTime(),
          )
      },
      [
        activeContext,
        businessHandoffs,
        businessOpportunities,
      ],
    )



  if (
    activeContext === "direction"
  ) {
    return (
      <div className="page-stack">
        <div className="page-header">
          <div>
            <span className="eyebrow">
              KEMS 720°
            </span>

            <h1>
              Pilotage global
            </h1>

            <p>
              Voir selon son rôle.
              Comprendre selon son contexte.
              Agir depuis un seul endroit.
            </p>
          </div>

          <div className="dashboard-user-context">
            <span>
              Connecté en tant que
            </span>

            <strong>
              {firstName} · Direction
            </strong>
          </div>
        </div>

        <section className="metric-grid five">
          {definition.metrics.map(
            (metric) => (
              <MetricCard
                key={metric.label}
                label={metric.label}
                value={metric.value}
                hint={metric.hint}
              />
            ),
          )}
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">
                Contextes métier
              </span>

              <h2>
                Piloter par brique
              </h2>
            </div>

            <span className="context-help">
              Ouvrir une projection
              sans changer d'identité
            </span>
          </div>

          <div className="direction-business-grid">
            {directionBusinessCards.map(
              (business) => {
                const Icon =
                  business.icon

                return (
                  <button
                    type="button"
                    className="direction-business-card"
                    key={business.context}
                    onClick={() =>
                      openContext(
                        business.context,
                      )
                    }
                  >
                    <div className="business-context-icon">
                      <Icon size={21} />
                    </div>

                    <span>
                      {business.label}
                    </span>

                    <strong>
                      {business.value}
                    </strong>

                    <small>
                      {business.hint}
                    </small>

                    <div className="business-context-link">
                      Voir le contexte
                      <ArrowRight size={14} />
                    </div>
                  </button>
                )
              },
            )}
          </div>
        </section>

        <section className="dashboard-grid">
          <div className="panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">
                  Priorités
                </span>

                <h2>
                  À traiter aujourd'hui
                </h2>
              </div>

              <Link
                to="/hub/actions"
                className="text-link"
              >
                Tout voir
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="action-list">
              {actions.map(
                (action) => (
                  <div
                    className="action-row"
                    key={action.id}
                  >
                    <div className="action-icon">
                      <ShieldAlert size={18} />
                    </div>

                    <div className="action-main">
                      <strong>
                        {action.title}
                      </strong>

                      <span>
                        {action.entity}
                        {" · "}
                        {action.source}
                      </span>
                    </div>

                    <div className="action-meta">
                      <strong>
                        {action.priority}
                      </strong>

                      <span>
                        {action.due}
                      </span>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="panel direction-summary">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">
                  Direction
                </span>

                <h2>
                  À surveiller
                </h2>
              </div>
            </div>

            <div className="direction-watch">
              <div>
                <span>
                  Actions critiques
                </span>
                <strong>12</strong>
              </div>

              <div>
                <span>
                  Clients sensibles
                </span>
                <strong>8</strong>
              </div>

              <div>
                <span>
                  Opportunités majeures
                </span>
                <strong>14</strong>
              </div>

              <div>
                <span>
                  Data Quality
                </span>
                <strong>94%</strong>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }

  const priorities =
    contextPriorities[
      activeContext
    ]

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">
            KEMS 720° ·
            {" "}
            {definition.shortLabel}
          </span>

          <h1>
            Dashboard
            {" "}
            {definition.shortLabel}
          </h1>

          <p>
            {definition.description}
          </p>
        </div>

        {canSwitchContext ? (
          <button
            type="button"
            className="button secondary"
            onClick={() =>
              openContext(
                "direction",
              )
            }
          >
            Retour Direction 720°
          </button>
        ) : null}
      </div>

      <section className="metric-grid five">
        {definition.metrics.map(
          (metric) => (
            <MetricCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              hint={metric.hint}
            />
          ),
        )}
      </section>

      {
        activeContext
          !== "commercial"
        ? (
          <section
            className={
              `panel business-dashboard-inbox business-dashboard-inbox-${activeContext}`
            }
          >
            <div className="panel-heading">
              <div>
                <span className="eyebrow">
                  Réception métier
                </span>

                <h2>
                  Opportunités entrantes
                </h2>
              </div>

              <Link
                to={
                  `/hub/${
                    activeContext
                  }/opportunities`
                }
                className="text-link"
              >
                Tout voir
                <ArrowRight
                  size={16}
                />
              </Link>
            </div>

            <div className="business-dashboard-inbox-summary">
              <div className="business-dashboard-inbox-count">
                <strong>
                  {
                    businessInboxLoading
                      ? "…"
                      : incomingOpportunities
                          .length
                  }
                </strong>

                <span>
                  À prendre en charge
                </span>
              </div>

              <div className="business-dashboard-inbox-list">
                {
                  businessInboxLoading
                  ? (
                    <div className="business-dashboard-inbox-loading">
                      Chargement des opportunités entrantes…
                    </div>
                  )
                  : null
                }

                {
                  !businessInboxLoading
                  && incomingOpportunities
                    .slice(
                      0,
                      3,
                    )
                    .map(
                      (
                        item,
                      ) => (
                        <Link
                          key={
                            item.handoff.id
                          }
                          to={
                            `/hub/${
                              activeContext
                            }/opportunities`
                          }
                          className="business-dashboard-inbox-item"
                        >
                          <div>
                            <div className="business-dashboard-inbox-title">
                              <strong>
                                {
                                  item.opportunity
                                    ?.name
                                  ?? "Nouvelle opportunité"
                                }
                              </strong>

                              <span className="business-dashboard-new-badge">
                                Nouveau
                              </span>
                            </div>

                            <span>
                              Transmise depuis
                              {" "}
                              le Growth Engine
                            </span>
                          </div>

                          <div className="business-dashboard-inbox-value">
                            {
                              item.opportunity
                              ? dashboardMoney(
                                  item.opportunity
                                    .estimated_value,
                                  item.opportunity
                                    .currency,
                                )
                              : "—"
                            }

                            <ArrowRight
                              size={15}
                            />
                          </div>
                        </Link>
                      ),
                    )
                }

                {
                  !businessInboxLoading
                  && incomingOpportunities
                    .length > 3
                  ? (
                    <Link
                      to={
                        `/hub/${
                          activeContext
                        }/opportunities`
                      }
                      className="business-dashboard-inbox-more"
                    >
                      +{
                        incomingOpportunities
                          .length - 3
                      }
                      {" autre"}
                      {
                        incomingOpportunities
                          .length - 3 > 1
                          ? "s"
                          : ""
                      }
                      {" opportunité"}
                      {
                        incomingOpportunities
                          .length - 3 > 1
                          ? "s"
                          : ""
                      }
                      <ArrowRight
                        size={14}
                      />
                    </Link>
                  )
                  : null
                }

                {
                  !businessInboxLoading
                  && !incomingOpportunities
                    .length
                  ? (
                    <div className="business-dashboard-inbox-empty">
                      Aucune nouvelle opportunité
                      à prendre en charge.
                    </div>
                  )
                  : null
                }
              </div>
            </div>
          </section>
        )
        : null
      }


      <section className="dashboard-grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">
                Priorités
              </span>

              <h2>
                À traiter
              </h2>
            </div>

            <Link
              to="/hub/actions"
              className="text-link"
            >
              Action Center
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="action-list">
            {priorities.map(
              (
                priority,
                index,
              ) => (
                <div
                  className="action-row"
                  key={
                    priority.title
                  }
                >
                  <div className="action-icon">
                    <definition.icon
                      size={18}
                    />
                  </div>

                  <div className="action-main">
                    <strong>
                      {priority.title}
                    </strong>

                    <span>
                      {priority.detail}
                    </span>
                  </div>

                  <div className="action-meta">
                    <strong>
                      {index === 0
                        ? "Haute"
                        : "Normale"}
                    </strong>

                    <span>
                      {priority.meta}
                    </span>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">
                Navigation métier
              </span>

              <h2>
                Modules
              </h2>
            </div>
          </div>

          <div className="module-shortcuts">
            {definition.nav
              .filter(
                (item) =>
                  item.to !== "/hub"
                  && item.to
                    !== "/hub/actions",
              )
              .slice(0, 7)
              .map((item) => {
                const Icon =
                  item.icon

                return (
                  <Link
                    to={item.to}
                    className="module-shortcut"
                    key={
                      `${item.label}-${item.to}`
                    }
                  >
                    <Icon size={18} />

                    <span>
                      {item.label}
                    </span>

                    <ArrowRight
                      size={14}
                    />
                  </Link>
                )
              })}
          </div>
        </div>
      </section>
    </div>
  )
}
