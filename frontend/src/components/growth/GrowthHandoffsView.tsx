import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  Handshake,
  RefreshCw,
  Route,
} from "lucide-react"

import {
  useEffect,
  useMemo,
  useState,
} from "react"

import OpportunityHandoffControl from "./OpportunityHandoffControl"

import {
  listHandoffsRequest,
} from "../../services/growthApi"

import type {
  GrowthOpportunity,
  OpportunityHandoff,
} from "../../services/growthApi"


type Props = {
  opportunities: GrowthOpportunity[]
  token: string | null
}


function formatMoney(
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
        style:
          "currency",
        currency,
        maximumFractionDigits:
          0,
      },
    ).format(
      value,
    )
  } catch {
    return `${value} ${currency}`
  }
}


function formatDate(
  value: string | null,
) {
  if (!value) {
    return "—"
  }

  return new Intl.DateTimeFormat(
    "fr-CH",
    {
      day:
        "2-digit",
      month:
        "short",
      year:
        "numeric",
      hour:
        "2-digit",
      minute:
        "2-digit",
    },
  ).format(
    new Date(
      value,
    ),
  )
}


function commercialStageLabel(
  stage: GrowthOpportunity["stage"],
) {
  const labels = {
    qualified:
      "Qualifiée",
    proposal:
      "Proposition",
    negotiation:
      "Négociation",
    won:
      "Gagnée",
    lost:
      "Perdue",
  }

  return labels[
    stage
  ]
}


function handoffStatusLabel(
  status: OpportunityHandoff["status"],
) {
  const labels = {
    handed_off:
      "En attente de prise en charge",
    accepted:
      "Prise en charge acceptée",
    in_progress:
      "En cours",
    completed:
      "Terminé",
  }

  return labels[
    status
  ]
}


export default function GrowthHandoffsView({
  opportunities,
  token,
}: Props) {
  const [
    handoffs,
    setHandoffs,
  ] =
    useState<
      OpportunityHandoff[]
    >([])

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null)


  async function loadHandoffs() {
    setLoading(
      true,
    )

    setError(
      null,
    )

    try {
      const result =
        await listHandoffsRequest(
          token,
        )

      setHandoffs(
        result,
      )
    } catch (
      requestError
    ) {
      setError(
        requestError
        instanceof Error
          ? requestError.message
          : "Impossible de charger les handoffs.",
      )
    } finally {
      setLoading(
        false,
      )
    }
  }


  useEffect(
    () => {
      void loadHandoffs()
    },
    [
      token,
    ],
  )


  const handoffByOpportunity =
    useMemo(
      () =>
        new Map(
          handoffs.map(
            handoff => [
              handoff.opportunity_id,
              handoff,
            ],
          ),
        ),
      [
        handoffs,
      ],
    )


  const pending =
    opportunities.filter(
      opportunity =>
        opportunity.stage
          !== "lost"
        && !handoffByOpportunity
          .has(
            opportunity.id,
          ),
    )


  const transmitted =
    handoffs.map(
      handoff => ({
        handoff,
        opportunity:
          opportunities.find(
            item =>
              item.id
              === handoff.opportunity_id,
          )
          ?? null,
      }),
    )


  const waitingCount =
    handoffs.filter(
      handoff =>
        handoff.status
        === "handed_off",
    ).length


  const activeCount =
    handoffs.filter(
      handoff =>
        [
          "accepted",
          "in_progress",
        ].includes(
          handoff.status,
        ),
    ).length


  return (
    <div className="growth-handoffs-page">
      <section className="growth-handoff-kpis">
        <article className="growth-handoff-kpi">
          <div>
            <Clock3
              size={18}
            />
          </div>

          <span>
            À transmettre
          </span>

          <strong>
            {
              pending.length
            }
          </strong>

          <small>
            Opportunités disponibles
          </small>
        </article>


        <article className="growth-handoff-kpi">
          <div>
            <Route
              size={18}
            />
          </div>

          <span>
            Transmis
          </span>

          <strong>
            {
              handoffs.length
            }
          </strong>

          <small>
            Handoffs créés
          </small>
        </article>


        <article className="growth-handoff-kpi">
          <div>
            <Handshake
              size={18}
            />
          </div>

          <span>
            En attente
          </span>

          <strong>
            {
              waitingCount
            }
          </strong>

          <small>
            À prendre en charge
          </small>
        </article>


        <article className="growth-handoff-kpi">
          <div>
            <CheckCircle2
              size={18}
            />
          </div>

          <span>
            En traitement
          </span>

          <strong>
            {
              activeCount
            }
          </strong>

          <small>
            Acceptés / en cours
          </small>
        </article>
      </section>


      <section className="panel growth-handoff-workspace">
        <header className="growth-handoff-section-heading">
          <div>
            <span className="eyebrow">
              Orchestration commerciale
            </span>

            <h2>
              À transmettre
            </h2>

            <p>
              Opportunités commerciales pouvant être
              affectées à une unité métier KEMS.
            </p>
          </div>
        </header>


        {
          pending.length
          ? (
            <div className="growth-handoff-pending-grid">
              {
                pending.map(
                  opportunity => (
                    <article
                      key={
                        opportunity.id
                      }
                      className="growth-handoff-pending-card"
                    >
                      <div className="growth-handoff-card-top">
                        <div className="growth-handoff-card-icon">
                          <Building2
                            size={18}
                          />
                        </div>

                        <div>
                          <strong>
                            {
                              opportunity.name
                            }
                          </strong>

                          <span>
                            {
                              commercialStageLabel(
                                opportunity.stage,
                              )
                            }
                            {" · "}
                            {
                              opportunity.probability
                            } %
                          </span>
                        </div>
                      </div>


                      <div className="growth-handoff-card-data">
                        <div>
                          <span>
                            Valeur
                          </span>

                          <strong>
                            {
                              formatMoney(
                                opportunity
                                  .estimated_value,
                                opportunity
                                  .currency,
                              )
                            }
                          </strong>
                        </div>

                        <div>
                          <span>
                            Organisation Core
                          </span>

                          <strong>
                            {
                              opportunity
                                .organization_id
                                ? "Liée"
                                : "—"
                            }
                          </strong>
                        </div>

                        <div>
                          <span>
                            Contact Core
                          </span>

                          <strong>
                            {
                              opportunity
                                .primary_contact_id
                                ? "Lié"
                                : "—"
                            }
                          </strong>
                        </div>
                      </div>


                      {
                        opportunity.description
                        ? (
                          <p className="growth-handoff-description">
                            {
                              opportunity.description
                            }
                          </p>
                        )
                        : null
                      }


                      <OpportunityHandoffControl
                        opportunity={
                          opportunity
                        }
                        token={
                          token
                        }
                        onChanged={
                          () =>
                            void loadHandoffs()
                        }
                      />
                    </article>
                  ),
                )
              }
            </div>
          )
          : (
            <div className="growth-handoff-empty-state">
              <CheckCircle2
                size={23}
              />

              <strong>
                Aucune opportunité à transmettre
              </strong>

              <span>
                Toutes les opportunités disponibles
                ont déjà été orientées vers un métier.
              </span>
            </div>
          )
        }
      </section>


      <section className="panel growth-handoff-workspace">
        <header className="growth-handoff-section-heading inline">
          <div>
            <span className="eyebrow">
              Suivi des affectations
            </span>

            <h2>
              Handoffs transmis
            </h2>

            <p>
              Suivi du passage entre le Growth Engine
              et les unités métier.
            </p>
          </div>

          <button
            type="button"
            className="button ghost"
            onClick={
              () =>
                void loadHandoffs()
            }
          >
            <RefreshCw
              size={15}
            />

            Actualiser
          </button>
        </header>


        {
          loading
          ? (
            <div className="growth-handoff-empty-state">
              <RefreshCw
                size={22}
              />

              Chargement des handoffs…
            </div>
          )
          : null
        }


        {
          error
          ? (
            <div className="growth-handoff-error">
              {
                error
              }
            </div>
          )
          : null
        }


        {
          !loading
          && transmitted.length
          ? (
            <div className="growth-handoff-table">
              <div className="growth-handoff-table-head">
                <span>
                  Opportunité
                </span>

                <span>
                  Métier
                </span>

                <span>
                  Commercial
                </span>

                <span>
                  Valeur
                </span>

                <span>
                  Statut handoff
                </span>

                <span>
                  Transmission
                </span>
              </div>


              {
                transmitted.map(
                  ({
                    handoff,
                    opportunity,
                  }) => (
                    <div
                      key={
                        handoff.id
                      }
                      className="growth-handoff-table-row"
                    >
                      <div>
                        <strong>
                          {
                            opportunity
                              ?.name
                            ?? "Opportunité"
                          }
                        </strong>

                        {
                          handoff.notes
                          ? (
                            <span>
                              {
                                handoff.notes
                              }
                            </span>
                          )
                          : null
                        }
                      </div>


                      <span className="growth-handoff-target">
                        <Building2
                          size={14}
                        />

                        {
                          handoff
                            .target_unit
                            .name
                        }
                      </span>


                      <span>
                        {
                          opportunity
                          ? (
                            commercialStageLabel(
                              opportunity.stage,
                            )
                          )
                          : "—"
                        }
                      </span>


                      <strong>
                        {
                          opportunity
                          ? (
                            formatMoney(
                              opportunity
                                .estimated_value,
                              opportunity
                                .currency,
                            )
                          )
                          : "—"
                        }
                      </strong>


                      <span
                        className={
                          `growth-handoff-state status-${handoff.status}`
                        }
                      >
                        {
                          handoffStatusLabel(
                            handoff.status,
                          )
                        }
                      </span>


                      <span className="growth-handoff-date">
                        {
                          formatDate(
                            handoff
                              .handed_off_at,
                          )
                        }
                      </span>
                    </div>
                  ),
                )
              }
            </div>
          )
          : null
        }


        {
          !loading
          && !transmitted.length
          ? (
            <div className="growth-handoff-empty-state">
              <Route
                size={22}
              />

              <strong>
                Aucun handoff enregistré
              </strong>

              <span>
                Les futures transmissions apparaîtront ici.
              </span>
            </div>
          )
          : null
        }
      </section>


      <section className="growth-handoff-flow">
        <span>
          Opportunité
        </span>

        <ArrowRight
          size={15}
        />

        <span>
          Handoff
        </span>

        <ArrowRight
          size={15}
        />

        <span>
          Métier
        </span>

        <ArrowRight
          size={15}
        />

        <span>
          Prise en charge
        </span>
      </section>
    </div>
  )
}
