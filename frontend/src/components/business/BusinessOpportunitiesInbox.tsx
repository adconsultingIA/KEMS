import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Handshake,
  Play,
  RefreshCw,
} from "lucide-react"

import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  Link,
} from "react-router-dom"

import {
  listHandoffsRequest,
  listOpportunitiesRequest,
  updateOpportunityHandoffStatusRequest,
} from "../../services/growthApi"

import type {
  GrowthOpportunity,
  OpportunityHandoff,
  OpportunityHandoffStatus,
} from "../../services/growthApi"


type Props = {
  contextKey: string
  contextLabel: string
  token: string | null
}


function normalizeCode(
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
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      },
    ).format(value)
  } catch {
    return `${value.toLocaleString("fr-CH")} ${currency}`
  }
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
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    ).format(
      new Date(value),
    )
  } catch {
    return value
  }
}


function statusLabel(
  status: OpportunityHandoff["status"],
) {
  const labels = {
    handed_off:
      "En attente de prise en charge",
    accepted:
      "Prise en charge acceptée",
    in_progress:
      "En cours de traitement",
    completed:
      "Terminé",
  }

  return labels[status]
}


function statusTone(
  status: OpportunityHandoff["status"],
) {
  if (status === "handed_off") {
    return "waiting"
  }

  if (status === "accepted") {
    return "accepted"
  }

  if (status === "in_progress") {
    return "progress"
  }

  return "completed"
}


function nextAction(
  status: OpportunityHandoff["status"],
): {
  label: string
  next: OpportunityHandoffStatus
  icon: typeof Handshake
} | null {
  if (status === "handed_off") {
    return {
      label: "Prendre en charge",
      next: "accepted",
      icon: Handshake,
    }
  }

  if (status === "accepted") {
    return {
      label: "Démarrer",
      next: "in_progress",
      icon: Play,
    }
  }

  if (status === "in_progress") {
    return {
      label: "Terminer",
      next: "completed",
      icon: CheckCircle2,
    }
  }

  return null
}


export default function BusinessOpportunitiesInbox({
  contextKey,
  contextLabel,
  token,
}: Props) {
  const [
    handoffs,
    setHandoffs,
  ] = useState<OpportunityHandoff[]>([])

  const [
    opportunities,
    setOpportunities,
  ] = useState<GrowthOpportunity[]>([])

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState<string | null>(null)

  const [
    busyId,
    setBusyId,
  ] = useState<string | null>(null)


  async function loadData() {
    setLoading(true)
    setError(null)

    try {
      const [
        handoffData,
        opportunityData,
      ] =
        await Promise.all([
          listHandoffsRequest(token),
          listOpportunitiesRequest(token),
        ])

      setHandoffs(handoffData)
      setOpportunities(opportunityData)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible de charger les opportunités reçues.",
      )
    } finally {
      setLoading(false)
    }
  }


  useEffect(
    () => {
      void loadData()
    },
    [
      token,
      contextKey,
    ],
  )


  const expectedCode =
    normalizeCode(contextKey)


  const received =
    useMemo(
      () =>
        handoffs
          .filter(
            handoff =>
              normalizeCode(
                handoff.target_unit.code,
              )
              === expectedCode,
          )
          .map(
            handoff => ({
              handoff,
              opportunity:
                opportunities.find(
                  opportunity =>
                    opportunity.id
                    === handoff.opportunity_id,
                )
                ?? null,
            }),
          ),
      [
        handoffs,
        opportunities,
        expectedCode,
      ],
    )


  const waitingCount =
    received.filter(
      item =>
        item.handoff.status
        === "handed_off",
    ).length


  const activeCount =
    received.filter(
      item =>
        [
          "accepted",
          "in_progress",
        ].includes(
          item.handoff.status,
        ),
    ).length


  const completedCount =
    received.filter(
      item =>
        item.handoff.status
        === "completed",
    ).length


  async function advance(
    handoff: OpportunityHandoff,
    status: OpportunityHandoffStatus,
  ) {
    setBusyId(handoff.id)
    setError(null)

    try {
      await updateOpportunityHandoffStatusRequest(
        token,
        handoff.opportunity_id,
        status,
      )

      await loadData()
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible de modifier la prise en charge.",
      )
    } finally {
      setBusyId(null)
    }
  }


  return (
    <div className="business-opportunity-inbox">
      <div className="page-header">
        <div>
          <span className="eyebrow">
            {contextLabel}
            {" · Réception métier"}
          </span>

          <h1>
            Opportunités reçues
          </h1>

          <p>
            Opportunités transmises depuis
            le Growth Engine vers le métier{" "}
            {contextLabel}.
          </p>
        </div>

        <button
          type="button"
          className="button secondary"
          onClick={
            () =>
              void loadData()
          }
        >
          <RefreshCw size={16} />
          Actualiser
        </button>
      </div>


      <section className="business-inbox-kpis">
        <article>
          <span>Reçues</span>
          <strong>{received.length}</strong>
          <small>Handoffs métier</small>
        </article>

        <article>
          <span>En attente</span>
          <strong>{waitingCount}</strong>
          <small>À prendre en charge</small>
        </article>

        <article>
          <span>En traitement</span>
          <strong>{activeCount}</strong>
          <small>Acceptées / démarrées</small>
        </article>

        <article>
          <span>Terminées</span>
          <strong>{completedCount}</strong>
          <small>Handoffs clôturés</small>
        </article>
      </section>


      {
        error
        ? (
          <section className="panel growth-error">
            <strong>
              Une action nécessite votre attention.
            </strong>

            <span>
              {error}
            </span>
          </section>
        )
        : null
      }


      {
        loading
        ? (
          <section className="panel business-inbox-empty">
            <RefreshCw size={23} />

            <strong>
              Chargement des opportunités...
            </strong>
          </section>
        )
        : null
      }


      {
        !loading
        && received.length
        ? (
          <section className="business-inbox-list">
            {
              received.map(
                ({
                  handoff,
                  opportunity,
                }) => {
                  const action =
                    nextAction(
                      handoff.status,
                    )

                  const ActionIcon =
                    action?.icon
                    ?? CheckCircle2

                  return (
                    <article
                      className="panel business-inbox-card"
                      key={
                        handoff.id
                      }
                    >
                      <div className="business-inbox-card-main">
                        <div className="business-inbox-source-icon">
                          <Handshake size={20} />
                        </div>

                        <div className="business-inbox-identity">
                          <span className="eyebrow">
                            Growth Engine
                          </span>

                          <h2>
                            {
                              opportunity
                                ?.name
                                .split(" · ")[0]
                              ?? "Opportunité"
                            }
                          </h2>

                          <p>
                            {
                              opportunity?.description
                              ?? (
                                opportunity
                                  ?.name
                                  .split(" · ")
                                  .slice(1)
                                  .join(" · ")
                                || "Sans description"
                              )
                            }
                          </p>
                        </div>

                        <div className="business-inbox-value">
                          <span>
                            Valeur
                          </span>

                          <strong>
                            {
                              opportunity
                              ? formatMoney(
                                  opportunity.estimated_value,
                                  opportunity.currency,
                                )
                              : "—"
                            }
                          </strong>
                        </div>
                      </div>


                      <div className="business-inbox-details">
                        <div>
                          <span>
                            Statut
                          </span>

                          <strong
                            className={
                              `business-handoff-status ${
                                statusTone(
                                  handoff.status,
                                )
                              }`
                            }
                          >
                            <Clock3 size={13} />

                            {
                              statusLabel(
                                handoff.status,
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
                                handoff.handed_off_at,
                              )
                            }
                          </strong>
                        </div>


                        <div>
                          <span>
                            Organisation Core
                          </span>

                          {
                            opportunity?.organization_id
                            ? (
                              <Link
                                to={
                                  `/hub/organizations/${
                                    opportunity.organization_id
                                  }`
                                }
                                className="business-core-link"
                              >
                                <Building2 size={13} />
                                Voir 720°
                                <ExternalLink size={12} />
                              </Link>
                            )
                            : (
                              <strong>—</strong>
                            )
                          }
                        </div>


                        <div>
                          <span>
                            Contact Core
                          </span>

                          {
                            opportunity?.primary_contact_id
                            ? (
                              <Link
                                to={
                                  `/hub/contacts/${
                                    opportunity.primary_contact_id
                                  }`
                                }
                                className="business-core-link"
                              >
                                Voir 720°
                                <ExternalLink size={12} />
                              </Link>
                            )
                            : (
                              <strong>—</strong>
                            )
                          }
                        </div>
                      </div>


                      {
                        handoff.notes
                        ? (
                          <div className="business-inbox-note">
                            <span>
                              Note de transmission
                            </span>

                            <p>
                              {handoff.notes}
                            </p>
                          </div>
                        )
                        : null
                      }


                      <footer className="business-inbox-card-footer">
                        <div className="business-inbox-flow">
                          <span>
                            Growth Engine
                          </span>

                          <ArrowRight size={14} />

                          <span>
                            {contextLabel}
                          </span>
                        </div>

                        {
                          action
                          ? (
                            <button
                              type="button"
                              className="button primary business-handoff-action"
                              disabled={
                                busyId
                                === handoff.id
                              }
                              onClick={
                                () =>
                                  void advance(
                                    handoff,
                                    action.next,
                                  )
                              }
                            >
                              <ActionIcon size={15} />

                              {
                                busyId
                                === handoff.id
                                  ? "Mise à jour..."
                                  : action.label
                              }
                            </button>
                          )
                          : (
                            <span className="business-handoff-done">
                              <CheckCircle2 size={15} />
                              Traitement terminé
                            </span>
                          )
                        }
                      </footer>
                    </article>
                  )
                },
              )
            }
          </section>
        )
        : null
      }


      {
        !loading
        && !received.length
        ? (
          <section className="panel business-inbox-empty">
            <Handshake size={25} />

            <strong>
              Aucune opportunité reçue
            </strong>

            <span>
              Les prochaines transmissions
              depuis Growth Engine apparaîtront ici.
            </span>
          </section>
        )
        : null
      }
    </div>
  )
}
