import {
  ArrowLeft,
  Layers3,
} from "lucide-react"
import {
  Link,
  useParams,
} from "react-router-dom"
import {
  projectionDefinitions,
} from "../../config/businessProjection"
import type {
  ProjectionKey,
} from "../../context/projection-context"
import { useAuth } from "../../hooks/useAuth"
import BusinessOpportunitiesInbox from "../../components/business/BusinessOpportunitiesInbox"

function humanize(
  value: string,
) {
  const labels:
    Record<string, string> = {
      prospects: "Prospects",
      opportunities: "Opportunités",
      contracts: "Contrats",
      renewals: "Renouvellements",
      cases: "Dossiers",
      documents: "Documents",
      portfolios: "Portefeuilles",
      mandates: "Mandats",
      deadlines: "Échéances",
      quotes: "Devis",
      projects: "Projets",
      maintenance: "Contrats de maintenance",
      tickets: "Tickets / Support",
      deliverables: "Livrables",
      billing: "Facturation",
      integrations: "Intégrations",
      automations: "Automatisations",
    }

  return labels[value]
    ?? value
      .replaceAll("-", " ")
      .replace(
        /^./,
        (letter) =>
          letter.toUpperCase(),
      )
}

export function BusinessModulePage() {
  const {
    context,
    module,
  } = useParams()

  const {
    token,
  } = useAuth()

  const key =
    context as ProjectionKey

  const definition =
    projectionDefinitions[key]

  const title =
    humanize(
      module ?? "module",
    )

  if (
    definition
    && module
      === "opportunities"
    && key
      !== "commercial"
  ) {
    return (
      <BusinessOpportunitiesInbox
        contextKey={
          key
        }
        contextLabel={
          definition.shortLabel
        }
        token={
          token
        }
      />
    )
  }


  if (!definition) {
    return (
      <div className="page-stack">
        <section className="panel empty-panel">
          <h2>
            Contexte introuvable
          </h2>
        </section>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">
            {definition.label}
          </span>

          <h1>{title}</h1>

          <p>
            Fondation fonctionnelle prête
            pour le développement de cette
            brique métier.
          </p>
        </div>
      </div>

      <section className="panel business-module-placeholder">
        <div className="business-module-icon">
          <Layers3 size={28} />
        </div>

        <h2>
          {title}
        </h2>

        <p>
          Cette vue fait désormais partie
          de l'architecture de la projection
          {` ${definition.shortLabel}`}.
          La logique métier sera ajoutée
          progressivement sans modifier
          la structure de navigation.
        </p>

        <Link
          to="/hub"
          className="button secondary"
        >
          <ArrowLeft size={16} />
          Retour au dashboard
        </Link>
      </section>
    </div>
  )
}
