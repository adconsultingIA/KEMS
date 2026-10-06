import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  Handshake,
  Route,
} from "lucide-react"

import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  listHandoffsRequest,
  listOpportunitiesRequest,
} from "../../services/growthApi"

import type {
  GrowthOpportunity,
  OpportunityHandoff,
} from "../../services/growthApi"


type Props = {
  token: string | null
  contactId?: string | null
  organizationId?: string | null
  title?: string
}


function statusLabel(
  status: OpportunityHandoff["status"],
) {
  const labels = {
    handed_off:
      "En attente",
    accepted:
      "Accepté",
    in_progress:
      "En cours",
    completed:
      "Terminé",
  }

  return labels[status]
}


function formatDate(
  value: string | null,
) {
  if (!value) {
    return "—"
  }

  try {
    return new Intl.DateTimeFormat(
      "fr-CH",
      {
        day:
          "2-digit",
        month:
          "short",
        year:
          "numeric",
      },
    ).format(
      new Date(value),
    )
  } catch {
    return value
  }
}


function formatMoney(
  value: number | null,
  currency: string,
) {
  if (value === null) {
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
    ).format(value)
  } catch {
    return `${value} ${currency}`
  }
}


function cleanOpportunityName(
  opportunity: GrowthOpportunity,
) {
  return opportunity.name
    .split(" · ")[0]
}


export default function EntityHandoffSnapshot({
  token,
  contactId,
  organizationId,
  title = "Parcours commercial / métier",
}: Props) {
  const [
    handoffs,
    setHandoffs,
  ] =
    useState<
      OpportunityHandoff[]
    >([])

  const [
    opportunities,
    setOpportunities,
  ] =
    useState<
      GrowthOpportunity[]
    >([])

  const [
    loading,
    setLoading,
  ] =
    useState(true)


  useEffect(
    () => {
      let cancelled =
        false

      async function load() {
        setLoading(true)

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

          if (!cancelled) {
            setHandoffs(
              handoffData,
            )

            setOpportunities(
              opportunityData,
            )
          }
        } catch {
          if (!cancelled) {
            setHandoffs([])
            setOpportunities([])
          }
        } finally {
          if (!cancelled) {
            setLoading(false)
          }
        }
      }

      void load()

      return () => {
        cancelled =
          true
      }
    },
    [
      token,
      contactId,
      organizationId,
    ],
  )


  const rows =
    useMemo(
      () =>
        handoffs
          .map(
            handoff => {
              const opportunity =
                opportunities.find(
                  item =>
                    item.id
                    === handoff.opportunity_id,
                )

              if (!opportunity) {
                return null
              }

              const matchesContact =
                Boolean(
                  contactId
                  && opportunity
                    .primary_contact_id
                    === contactId,
                )

              const matchesOrganization =
                Boolean(
                  organizationId
                  && opportunity
                    .organization_id
                    === organizationId,
                )

              if (
                !matchesContact
                && !matchesOrganization
              ) {
                return null
              }

              return {
                handoff,
                opportunity,
              }
            },
          )
          .filter(
            (
              item,
            ): item is {
              handoff:
                OpportunityHandoff
              opportunity:
                GrowthOpportunity
            } =>
              item !== null,
          ),
      [
        handoffs,
        opportunities,
        contactId,
        organizationId,
      ],
    )


  if (
    loading
    || !rows.length
  ) {
    return null
  }


  return (
    <section className="panel entity-handoff-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">
            Growth Engine
          </span>

          <h2>
            {title}
          </h2>
        </div>

        <Route
          size={20}
        />
      </div>


      <div className="entity-handoff-list">
        {
          rows.map(
            ({
              handoff,
              opportunity,
            }) => (
              <article
                className="entity-handoff-row"
                key={
                  handoff.id
                }
              >
                <div className="entity-handoff-main">
                  <div className="entity-handoff-icon">
                    <Handshake
                      size={18}
                    />
                  </div>

                  <div>
                    <strong>
                      {
                        cleanOpportunityName(
                          opportunity,
                        )
                      }
                    </strong>

                    <span>
                      {
                        opportunity.description
                        ?? opportunity.name
                          .split(" · ")
                          .slice(1)
                          .join(" · ")
                        ?? "Opportunité commerciale"
                      }
                    </span>
                  </div>
                </div>


                <div className="entity-handoff-data">
                  <div>
                    <span>
                      Source
                    </span>

                    <strong>
                      Growth Engine
                    </strong>
                  </div>


                  <div>
                    <span>
                      Métier
                    </span>

                    <strong className="entity-handoff-target">
                      <Building2
                        size={13}
                      />

                      {
                        handoff
                          .target_unit
                          .name
                      }
                    </strong>
                  </div>


                  <div>
                    <span>
                      Statut
                    </span>

                    <strong
                      className={
                        `entity-handoff-status status-${handoff.status}`
                      }
                    >
                      {
                        handoff.status
                        === "completed"
                          ? (
                            <CheckCircle2
                              size={13}
                            />
                          )
                          : (
                            <Clock3
                              size={13}
                            />
                          )
                      }

                      {
                        statusLabel(
                          handoff.status,
                        )
                      }
                    </strong>
                  </div>


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
                      Transmission
                    </span>

                    <strong>
                      {
                        formatDate(
                          handoff
                            .handed_off_at,
                        )
                      }
                    </strong>
                  </div>
                </div>


                <div className="entity-handoff-flow">
                  <span>
                    Growth Engine
                  </span>

                  <ArrowRight
                    size={13}
                  />

                  <span>
                    {
                      handoff
                        .target_unit
                        .name
                    }
                  </span>

                  <ArrowRight
                    size={13}
                  />

                  <span>
                    {
                      statusLabel(
                        handoff.status,
                      )
                    }
                  </span>
                </div>
              </article>
            ),
          )
        }
      </div>
    </section>
  )
}
