import {
  CheckCircle2,
  Clock3,
  XCircle,
} from "lucide-react"

import {
  useEffect,
  useState,
} from "react"

import {
  getOpportunityHandoffRequest,
} from "../../services/growthApi"

import type {
  GrowthOpportunity,
  OpportunityHandoff,
} from "../../services/growthApi"


type Props = {
  opportunity: GrowthOpportunity
  token: string | null
  compact?: boolean
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

  return labels[
    status
  ]
}


export default function OpportunityHandoffSummary({
  opportunity,
  token,
  compact = false,
}: Props) {
  const [
    handoff,
    setHandoff,
  ] =
    useState<
      OpportunityHandoff | null
    >(null)

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
        setLoading(
          true,
        )

        try {
          const result =
            await getOpportunityHandoffRequest(
              token,
              opportunity.id,
            )

          if (
            !cancelled
          ) {
            setHandoff(
              result,
            )
          }
        } catch {
          if (
            !cancelled
          ) {
            setHandoff(
              null,
            )
          }
        } finally {
          if (
            !cancelled
          ) {
            setLoading(
              false,
            )
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
      opportunity.id,
      token,
    ],
  )


  if (
    loading
  ) {
    return (
      <span className="handoff-summary muted">
        …
      </span>
    )
  }


  if (
    handoff
  ) {
    return (
      <div
        className={
          compact
            ? "handoff-summary compact transmitted"
            : "handoff-summary transmitted"
        }
      >
        <span>
          <CheckCircle2
            size={13}
          />

          {
            compact
              ? handoff
                  .target_unit
                  .name
              : (
                `Transmis → ${
                  handoff
                    .target_unit
                    .name
                }`
              )
          }
        </span>

        {
          !compact
          ? (
            <small>
              {
                statusLabel(
                  handoff.status,
                )
              }
            </small>
          )
          : null
        }
      </div>
    )
  }


  if (
    opportunity.stage
    === "lost"
  ) {
    return (
      <span className="handoff-summary unavailable">
        <XCircle
          size={13}
        />

        Indisponible
      </span>
    )
  }


  return (
    <span className="handoff-summary pending">
      <Clock3
        size={13}
      />

      À transmettre
    </span>
  )
}
