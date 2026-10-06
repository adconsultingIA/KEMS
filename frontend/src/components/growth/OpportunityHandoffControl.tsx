import {
  Building2,
  CheckCircle2,
  Handshake,
  X,
} from "lucide-react"

import {
  useEffect,
  useState,
} from "react"

import {
  createPortal,
} from "react-dom"

import {
  createOpportunityHandoffRequest,
  getOpportunityHandoffRequest,
  listHandoffTargetsRequest,
} from "../../services/growthApi"

import type {
  GrowthOpportunity,
  HandoffTargetUnit,
  OpportunityHandoff,
} from "../../services/growthApi"


type Props = {
  opportunity: GrowthOpportunity
  token: string | null
  onChanged?: (
    handoff: OpportunityHandoff,
  ) => void
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
      "En traitement",
    completed:
      "Traitement terminé",
  }

  return labels[
    status
  ]
}


export default function OpportunityHandoffControl({
  opportunity,
  token,
  onChanged,
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

  const [
    open,
    setOpen,
  ] =
    useState(false)

  const [
    targets,
    setTargets,
  ] =
    useState<
      HandoffTargetUnit[]
    >([])

  const [
    targetUnitId,
    setTargetUnitId,
  ] =
    useState("")

  const [
    notes,
    setNotes,
  ] =
    useState("")

  const [
    saving,
    setSaving,
  ] =
    useState(false)

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null)


  useEffect(
    () => {
      let cancelled = false

      async function loadHandoff() {
        setLoading(
          true,
        )

        try {
          const result =
            await getOpportunityHandoffRequest(
              token,
              opportunity.id,
            )

          if (!cancelled) {
            setHandoff(
              result,
            )
          }
        } catch {
          if (!cancelled) {
            setHandoff(
              null,
            )
          }
        } finally {
          if (!cancelled) {
            setLoading(
              false,
            )
          }
        }
      }

      void loadHandoff()

      return () => {
        cancelled = true
      }
    },
    [
      opportunity.id,
      token,
    ],
  )


  async function openModal() {
    setError(
      null,
    )

    try {
      const availableTargets =
        await listHandoffTargetsRequest(
          token,
        )

      setTargets(
        availableTargets,
      )

      setTargetUnitId(
        availableTargets[0]
          ?.id
        ?? "",
      )

      setNotes(
        `Transmission de l'opportunité ${opportunity.name} au métier sélectionné.`,
      )

      setOpen(
        true,
      )
    } catch (
      requestError
    ) {
      setError(
        requestError
        instanceof Error
          ? requestError.message
          : "Impossible de charger les métiers disponibles.",
      )
    }
  }


  useEffect(
    () => {
      if (!open) {
        return
      }

      const previousOverflow =
        document.body.style.overflow

      document.body.style.overflow =
        "hidden"

      function handleKeyDown(
        event: KeyboardEvent,
      ) {
        if (
          event.key
          === "Escape"
          && !saving
        ) {
          setOpen(
            false,
          )

          setError(
            null,
          )
        }
      }

      window.addEventListener(
        "keydown",
        handleKeyDown,
      )

      return () => {
        document.body.style.overflow =
          previousOverflow

        window.removeEventListener(
          "keydown",
          handleKeyDown,
        )
      }
    },
    [
      open,
      saving,
    ],
  )


  function closeModal() {
    if (
      saving
    ) {
      return
    }

    setOpen(
      false,
    )

    setError(
      null,
    )
  }


  async function submitHandoff() {
    if (
      !targetUnitId
    ) {
      setError(
        "Sélectionnez un métier cible.",
      )

      return
    }

    setSaving(
      true,
    )

    setError(
      null,
    )

    try {
      const created =
        await createOpportunityHandoffRequest(
          token,
          opportunity.id,
          {
            target_unit_id:
              targetUnitId,
            notes:
              notes.trim()
              || null,
          },
        )

      setHandoff(
        created,
      )

      onChanged?.(
        created,
      )

      setOpen(
        false,
      )
    } catch (
      requestError
    ) {
      setError(
        requestError
        instanceof Error
          ? requestError.message
          : "Impossible de transmettre l'opportunité.",
      )
    } finally {
      setSaving(
        false,
      )
    }
  }


  if (
    loading
  ) {
    return (
      <span className="growth-handoff-loading">
        Vérification handoff…
      </span>
    )
  }


  if (
    handoff
  ) {
    return (
      <div className="growth-handoff-status">
        <span className="growth-handoff-badge">
          <CheckCircle2
            size={14}
          />

          Transmis à {
            handoff
              .target_unit
              .name
          }
        </span>

        <small>
          {
            handoffStatusLabel(
              handoff.status,
            )
          }
        </small>
      </div>
    )
  }


  if (
    opportunity.stage
    === "lost"
  ) {
    return (
      <span className="growth-handoff-unavailable">
        Handoff indisponible
      </span>
    )
  }


  return (
    <>
      <div className="growth-handoff-control">
        <button
          type="button"
          className="button compact growth-handoff-trigger"
          onClick={
            () =>
              void openModal()
          }
        >
          <Handshake
            size={14}
          />

          Transmettre au métier
        </button>

        {
          error
          ? (
            <small className="growth-handoff-inline-error">
              {error}
            </small>
          )
          : null
        }
      </div>


      {
        open
        ? createPortal(
          (
            <div
              className="growth-modal-backdrop growth-handoff-overlay"
            role="presentation"
            onMouseDown={
              event => {
                if (
                  event.target
                  === event.currentTarget
                ) {
                  closeModal()
                }
              }
            }
          >
            <section
              className="growth-modal growth-handoff-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="growth-handoff-title"
            >
              <header className="growth-modal-header">
                <div>
                  <span className="eyebrow">
                    Handoff métier
                  </span>

                  <h2
                    id="growth-handoff-title"
                  >
                    Transmettre l’opportunité
                  </h2>

                  <p>
                    L’opportunité commerciale reste dans
                    Growth Engine. Le métier reçoit sa
                    référence et peut ensuite la prendre
                    en charge.
                  </p>
                </div>

                <button
                  type="button"
                  className="growth-modal-close"
                  aria-label="Fermer"
                  onClick={
                    closeModal
                  }
                >
                  <X
                    size={19}
                  />
                </button>
              </header>


              <div className="growth-handoff-modal-body">
                <section className="growth-handoff-opportunity">
                  <div className="growth-handoff-opportunity-icon">
                    <Handshake
                      size={20}
                    />
                  </div>

                  <div>
                    <span>
                      Opportunité
                    </span>

                    <strong>
                      {
                        opportunity.name
                      }
                    </strong>

                    <small>
                      {
                        opportunity.description
                        ?? "Sans description"
                      }
                    </small>
                  </div>
                </section>


                <label className="growth-field full">
                  <span>
                    Métier cible
                  </span>

                  <div className="growth-handoff-select-wrap">
                    <Building2
                      size={17}
                    />

                    <select
                      value={
                        targetUnitId
                      }
                      onChange={
                        event =>
                          setTargetUnitId(
                            event.target.value,
                          )
                      }
                    >
                      {
                        targets.map(
                          target => (
                            <option
                              key={
                                target.id
                              }
                              value={
                                target.id
                              }
                            >
                              {
                                target.name
                              }
                            </option>
                          ),
                        )
                      }
                    </select>
                  </div>
                </label>


                <label className="growth-field full">
                  <span>
                    Note de transmission
                  </span>

                  <textarea
                    rows={4}
                    value={
                      notes
                    }
                    onChange={
                      event =>
                        setNotes(
                          event.target.value,
                        )
                    }
                    placeholder="Contexte utile pour le métier destinataire…"
                  />
                </label>


                {
                  !targets.length
                  ? (
                    <div className="growth-handoff-empty">
                      Aucun métier disponible pour
                      recevoir cette opportunité.
                    </div>
                  )
                  : null
                }


                {
                  error
                  ? (
                    <div className="growth-handoff-error">
                      {error}
                    </div>
                  )
                  : null
                }
              </div>


              <footer className="growth-modal-footer">
                <button
                  type="button"
                  className="button secondary"
                  disabled={
                    saving
                  }
                  onClick={
                    closeModal
                  }
                >
                  Annuler
                </button>

                <button
                  type="button"
                  className="button primary"
                  disabled={
                    saving
                    || !targetUnitId
                  }
                  onClick={
                    () =>
                      void submitHandoff()
                  }
                >
                  <Handshake
                    size={15}
                  />

                  {
                    saving
                      ? "Transmission..."
                      : "Transmettre au métier"
                  }
                </button>
              </footer>
            </section>
            </div>
          ),
          document.body,
        )
        : null
      }
    </>
  )
}
