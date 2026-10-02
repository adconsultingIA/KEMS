import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  FileText,
  HeartHandshake,
  Landmark,
  MessageSquareText,
  ShieldCheck,
  X,
} from "lucide-react"
import { useState } from "react"
import type { FormEvent } from "react"
import { Link } from "react-router-dom"
import { useActions } from "../../hooks/useActions"

const solutions = [
  {
    label: "Assurance",
    value: "2 contrats actifs",
    detail: "1 renouvellement prochain",
    icon: ShieldCheck,
    tone: "blue",
  },
  {
    label: "Investissement",
    value: "1 dossier actif",
    detail: "Profil à jour",
    icon: Landmark,
    tone: "orange",
  },
  {
    label: "Fiduciaire",
    value: "Aucun service actif",
    detail: "Découvrir les solutions",
    icon: FileText,
    tone: "violet",
  },
  {
    label: "Immobilier",
    value: "Aucun projet actif",
    detail: "Découvrir les solutions",
    icon: Building2,
    tone: "red",
  },
]

export function ClientPortalPage() {
  const {
    addAdviceRequest,
  } = useActions()

  const [drawerOpen, setDrawerOpen] =
    useState(false)

  const [reference, setReference] =
    useState<string | null>(null)

  const [domain, setDomain] =
    useState("Assurance")

  const [subject, setSubject] =
    useState("")

  const [description, setDescription] =
    useState("")

  const [urgency, setUrgency] =
    useState("normal")

  function closeDrawer() {
    setDrawerOpen(false)

    window.setTimeout(
      () => setReference(null),
      200,
    )
  }

  function submitRequest(
    event: FormEvent,
  ) {
    event.preventDefault()

    const result = addAdviceRequest({
      entity: "Jean Dupont",
      domain,
      subject,
      description,
      urgency,
    })

    setReference(
      result.reference,
    )
  }

  return (
    <div className="client-portal">
      <header className="client-topbar">
        <div className="brand dark">
          <div className="brand-mark">K</div>

          <div>
            <strong>KEMS</strong>
            <span>Espace client</span>
          </div>
        </div>

        <div className="client-topbar-actions">
          <Link
            to="/hub"
            className="experience-switch hub-switch"
          >
            <ArrowLeft size={14} />

            <div>
              <strong>Hub 720°</strong>
              <span>Espace interne</span>
            </div>
          </Link>

          <div className="client-profile">
            <div className="avatar small">
              JD
            </div>

            <div>
              <strong>Jean Dupont</strong>
              <span>Client KEMS</span>
            </div>
          </div>
        </div>
      </header>

      <main className="client-content">
        <section className="client-welcome">
          <div className="client-brand-line">
            <span />
            <span />
            <span />
          </div>

          <span className="eyebrow">
            Client 360°
          </span>

          <h1>Bonjour Jean.</h1>

          <p>
            Retrouvez vos solutions, dossiers
            et échanges avec KEMS depuis
            un seul espace.
          </p>
        </section>

        <section>
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                Votre espace
              </span>

              <h2>Mes solutions</h2>
            </div>
          </div>

          <div className="client-solutions">
            {solutions.map((solution) => {
              const Icon =
                solution.icon

              return (
                <article
                  className={`client-solution-card tone-${solution.tone}`}
                  key={solution.label}
                >
                  <div className="solution-accent" />

                  <div className="client-solution-icon">
                    <Icon size={21} />
                  </div>

                  <span>
                    {solution.label}
                  </span>

                  <strong>
                    {solution.value}
                  </strong>

                  <p>
                    {solution.detail}
                  </p>

                  <button className="client-card-link">
                    Voir
                    <ArrowRight size={16} />
                  </button>
                </article>
              )
            })}
          </div>
        </section>

        <section className="advice-card">
          <div className="advice-brand-accent" />

          <div>
            <div className="advice-icon">
              <HeartHandshake size={24} />
            </div>

            <span className="eyebrow">
              KEMS Conseil
            </span>

            <h2>
              Besoin d'un conseil ?
            </h2>

            <p>
              Décrivez votre besoin.
              Notre équipe vous orientera
              vers le bon spécialiste KEMS.
            </p>
          </div>

          <button
            className="button primary large warm-action"
            onClick={() =>
              setDrawerOpen(true)
            }
          >
            <MessageSquareText size={18} />
            Demander conseil à KEMS
          </button>
        </section>
      </main>

      {drawerOpen ? (
        <div className="drawer-layer">
          <button
            className="drawer-backdrop"
            aria-label="Fermer"
            onClick={closeDrawer}
          />

          <aside className="advice-drawer">
            <div className="drawer-header">
              <div>
                <span className="eyebrow">
                  KEMS Conseil
                </span>

                <h2>
                  Demander conseil
                </h2>
              </div>

              <button
                className="icon-button"
                onClick={closeDrawer}
              >
                <X size={19} />
              </button>
            </div>

            {reference ? (
              <div className="request-success">
                <div className="success-icon">
                  <CheckCircle2 size={28} />
                </div>

                <span className="eyebrow">
                  Demande transmise
                </span>

                <h3>
                  Votre demande est bien
                  arrivée chez KEMS.
                </h3>

                <p>
                  Elle apparaît maintenant
                  dans l'Action Center de
                  l'équipe KEMS.
                </p>

                <div className="request-ticket">
                  <span>
                    Référence
                  </span>

                  <strong>
                    {reference}
                  </strong>

                  <span>
                    Statut : Reçue
                  </span>
                </div>

                <button
                  className="button primary large"
                  onClick={closeDrawer}
                >
                  Terminer
                </button>
              </div>
            ) : (
              <form
                className="advice-form"
                onSubmit={submitRequest}
              >
                <label>
                  <span>
                    Domaine concerné
                  </span>

                  <select
                    value={domain}
                    onChange={(event) =>
                      setDomain(
                        event.target.value,
                      )
                    }
                  >
                    <option>
                      Assurance
                    </option>
                    <option>
                      Investissement
                    </option>
                    <option>
                      Fiduciaire
                    </option>
                    <option>
                      Immobilier
                    </option>
                    <option>
                      Consulting
                    </option>
                    <option>
                      Autre
                    </option>
                  </select>
                </label>

                <label>
                  <span>Sujet</span>

                  <input
                    required
                    value={subject}
                    onChange={(event) =>
                      setSubject(
                        event.target.value,
                      )
                    }
                    placeholder="Ex. Revoir ma couverture assurance"
                  />
                </label>

                <label>
                  <span>
                    Votre besoin
                  </span>

                  <textarea
                    required
                    rows={6}
                    value={description}
                    onChange={(event) =>
                      setDescription(
                        event.target.value,
                      )
                    }
                    placeholder="Décrivez votre besoin..."
                  />
                </label>

                <label>
                  <span>Priorité</span>

                  <select
                    value={urgency}
                    onChange={(event) =>
                      setUrgency(
                        event.target.value,
                      )
                    }
                  >
                    <option value="low">
                      Flexible
                    </option>
                    <option value="normal">
                      Normal
                    </option>
                    <option value="urgent">
                      Urgent
                    </option>
                  </select>
                </label>

                <div className="drawer-footer">
                  <button
                    type="button"
                    className="button secondary"
                    onClick={closeDrawer}
                  >
                    Annuler
                  </button>

                  <button
                    type="submit"
                    className="button primary large warm-action"
                  >
                    <MessageSquareText size={17} />
                    Envoyer à KEMS
                  </button>
                </div>
              </form>
            )}
          </aside>
        </div>
      ) : null}
    </div>
  )
}
