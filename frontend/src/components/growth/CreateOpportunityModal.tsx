import {
  ArrowRight,
  Building2,
  CheckCircle2,
  UserRound,
  X,
} from "lucide-react"

import {
  createOpportunityRequest,
  type GrowthLead,
} from "../../services/growthApi"


type Props = {
  lead: GrowthLead
  token: string | null

  onClose: () => void

  onCreated:
    () => Promise<void>
}


function leadLabel(
  lead: GrowthLead,
) {
  if (
    lead.lead_type
    === "b2b"
  ) {
    return (
      lead.company_name
      || [
        lead.first_name,
        lead.last_name,
      ]
        .filter(Boolean)
        .join(" ")
      || "Prospect B2B"
    )
  }

  return (
    [
      lead.first_name,
      lead.last_name,
    ]
      .filter(Boolean)
      .join(" ")
    || lead.email
    || "Prospect B2C"
  )
}


function contactLabel(
  lead: GrowthLead,
) {
  return (
    [
      lead.first_name,
      lead.last_name,
    ]
      .filter(Boolean)
      .join(" ")
    || lead.email
    || "Non renseigné"
  )
}


export default function CreateOpportunityModal({
  lead,
  token,
  onClose,
  onCreated,
}: Props) {
  const defaultName =
    lead.need_summary
      ? `${leadLabel(lead)} · ${lead.need_summary}`
      : `Opportunité · ${leadLabel(lead)}`

  const [
    name,
    setName,
  ] =
    React.useState(
      defaultName,
    )

  const [
    description,
    setDescription,
  ] =
    React.useState(
      lead.need_summary
      ?? "",
    )

  const [
    value,
    setValue,
  ] =
    React.useState(
      lead.estimated_value
        != null
        ? String(
            lead.estimated_value,
          )
        : "",
    )

  const [
    currency,
    setCurrency,
  ] =
    React.useState(
      lead.currency
      || "CHF",
    )

  const [
    expectedCloseDate,
    setExpectedCloseDate,
  ] =
    React.useState("")

  const [
    saving,
    setSaving,
  ] =
    React.useState(false)

  const [
    error,
    setError,
  ] =
    React.useState<
      string | null
    >(null)


  async function submit(
    event:
      React.FormEvent<
        HTMLFormElement
      >,
  ) {
    event.preventDefault()

    const normalizedName =
      name.trim()

    if (!normalizedName) {
      setError(
        "Le nom de l'opportunité est obligatoire.",
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
      await createOpportunityRequest(
        token,
        {
          lead_id:
            lead.id,

          name:
            normalizedName,

          description:
            description.trim()
            || null,

          estimated_value:
            value.trim()
              ? Number(
                  value,
                )
              : null,

          currency:
            currency,

          probability:
            25,

          expected_close_date:
            expectedCloseDate
            || null,
        },
      )

      await onCreated()
    } catch (
      requestError
    ) {
      setError(
        requestError
          instanceof Error
          ? requestError.message
          : (
            "Impossible de créer "
            + "l'opportunité."
          ),
      )
    } finally {
      setSaving(
        false,
      )
    }
  }


  return (
    <div
      className="growth-modal-backdrop"
      role="presentation"
      onMouseDown={
        event => {
          if (
            event.target
            === event.currentTarget
            && !saving
          ) {
            onClose()
          }
        }
      }
    >
      <section
        className="growth-modal growth-opportunity-create-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-opportunity-title"
      >

        <header className="growth-modal-header">

          <div>
            <span className="eyebrow">
              Growth Engine · Opportunité
            </span>

            <h2
              id="create-opportunity-title"
            >
              Créer une opportunité
            </h2>

            <p>
              Transformer le lead qualifié
              en opportunité commerciale.
            </p>
          </div>

          <button
            type="button"
            className="growth-modal-close"
            aria-label="Fermer"
            onClick={
              onClose
            }
            disabled={
              saving
            }
          >
            <X
              size={19}
            />
          </button>

        </header>


        <form
          onSubmit={
            event =>
              void submit(
                event,
              )
          }
        >

          <section className="growth-opportunity-source">

            <div className="growth-opportunity-source-icon">
              {
                lead.lead_type
                  === "b2b"
                ? (
                  <Building2
                    size={21}
                  />
                )
                : (
                  <UserRound
                    size={21}
                  />
                )
              }
            </div>

            <div>
              <span>
                Prospect Core
              </span>

              <strong>
                {
                  leadLabel(
                    lead,
                  )
                }
              </strong>

              <small>
                {
                  contactLabel(
                    lead,
                  )
                }
              </small>
            </div>

            <div className="growth-opportunity-core-ready">
              <CheckCircle2
                size={15}
              />

              KEMS Core lié
            </div>

          </section>


          {
            error
            ? (
              <div className="growth-opportunity-error">
                {error}
              </div>
            )
            : null
          }


          <section className="growth-form-section">

            <div className="growth-form-section-heading">
              <strong>
                Opportunité commerciale
              </strong>

              <span>
                Les informations principales sont
                préremplies depuis le lead.
              </span>
            </div>


            <label className="growth-field full">
              <span>
                Nom de l'opportunité *
              </span>

              <input
                autoFocus
                value={
                  name
                }
                onChange={
                  event =>
                    setName(
                      event.target.value,
                    )
                }
              />
            </label>


            <label className="growth-field full">
              <span>
                Description
              </span>

              <textarea
                rows={4}
                value={
                  description
                }
                onChange={
                  event =>
                    setDescription(
                      event.target.value,
                    )
                }
                placeholder={
                  "Contexte commercial, "
                  + "besoin, objectif..."
                }
              />
            </label>

          </section>


          <section className="growth-form-section">

            <div className="growth-form-section-heading">
              <strong>
                Valeur & échéance
              </strong>
            </div>


            <div className="growth-form-grid three">

              <label className="growth-field">
                <span>
                  Valeur estimée
                </span>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={
                    value
                  }
                  onChange={
                    event =>
                      setValue(
                        event.target.value,
                      )
                  }
                  placeholder="0"
                />
              </label>


              <label className="growth-field">
                <span>
                  Devise
                </span>

                <select
                  value={
                    currency
                  }
                  onChange={
                    event =>
                      setCurrency(
                        event.target.value,
                      )
                  }
                >
                  <option value="CHF">
                    CHF
                  </option>

                  <option value="EUR">
                    EUR
                  </option>

                  <option value="USD">
                    USD
                  </option>
                </select>
              </label>


              <label className="growth-field">
                <span>
                  Échéance estimée
                </span>

                <input
                  type="date"
                  value={
                    expectedCloseDate
                  }
                  onChange={
                    event =>
                      setExpectedCloseDate(
                        event.target.value,
                      )
                  }
                />
              </label>

            </div>

          </section>


          <section className="growth-opportunity-stage-preview">

            <div>
              <span>
                Étape initiale
              </span>

              <strong>
                Qualifié
              </strong>
            </div>

            <ArrowRight
              size={17}
            />

            <div>
              <span>
                Probabilité initiale
              </span>

              <strong>
                25 %
              </strong>
            </div>

            <ArrowRight
              size={17}
            />

            <div>
              <span>
                Destination
              </span>

              <strong>
                Pipeline
              </strong>
            </div>

          </section>


          <footer className="growth-modal-footer">

            <button
              type="button"
              className="button secondary"
              onClick={
                onClose
              }
              disabled={
                saving
              }
            >
              Annuler
            </button>

            <button
              type="submit"
              className="button primary"
              disabled={
                saving
              }
            >
              {
                saving
                  ? "Création..."
                  : (
                    <>
                      Créer l'opportunité

                      <ArrowRight
                        size={16}
                      />
                    </>
                  )
              }
            </button>

          </footer>

        </form>

      </section>
    </div>
  )
}


/*
 * React is deliberately imported at the bottom through a namespace
 * to keep the component's state calls explicit.
 */
import * as React from "react"
