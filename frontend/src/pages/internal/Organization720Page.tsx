import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CircleCheck,
  RefreshCw,
  ShieldAlert,
  UserRound,
  Users,
} from "lucide-react"

import {
  useEffect,
  useState,
} from "react"

import {
  Link,
  useParams,
} from "react-router-dom"

import {
  MetricCard,
} from "../../components/ui/MetricCard"

import {
  StatusBadge,
} from "../../components/ui/StatusBadge"

import {
  useAuth,
} from "../../hooks/useAuth"

import {
  getOrganization720Request,
} from "../../services/organization720Api"

import type {
  Organization720ContactRelation,
  Organization720Projection,
} from "../../services/organization720Api"


function organizationTypeLabel(
  value: string,
) {
  const labels:
    Record<string, string> = {
      company:
        "Entreprise",
      partner:
        "Partenaire",
      insurer:
        "Assureur",
      foundation:
        "Fondation",
      association:
        "Association",
      public_body:
        "Organisme public",
      bank:
        "Institution financière",
      fiduciary:
        "Fiduciaire",
    }

  return (
    labels[value]
    ?? value.replaceAll(
      "_",
      " ",
    )
  )
}


function sourceLabel(
  value: string,
) {
  const labels:
    Record<string, string> = {
      manual:
        "Saisie manuelle",
      legacy_import:
        "Import historique",
      csv:
        "Import CSV",
      scraping:
        "Acquisition externe",
      client_360:
        "Client 360°",
    }

  return (
    labels[value]
    ?? value.replaceAll(
      "_",
      " ",
    )
  )
}


function locationLabel(
  projection:
    Organization720Projection,
) {
  const values = [
    projection.organization.city,
    projection.organization.country,
  ].filter(Boolean)

  return (
    values.length
      ? values.join(", ")
      : "Localisation non renseignée"
  )
}


function organizationInitials(
  name: string,
) {
  const words =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)

  if (!words.length) {
    return "OR"
  }

  if (words.length === 1) {
    return words[0]
      .slice(0, 2)
      .toUpperCase()
  }

  return (
    `${words[0][0]}${words[1][0]}`
      .toUpperCase()
  )
}


function contactInitials(
  firstName: string,
  lastName: string,
) {
  return (
    `${firstName.charAt(0)}${lastName.charAt(0)}`
      .toUpperCase()
  )
}


function relationshipTypeLabel(
  value: string | null,
) {
  if (!value) {
    return "Relation historique Core"
  }

  const labels:
    Record<string, string> = {
      employee:
        "Collaborateur",
      owner:
        "Propriétaire",
      founder:
        "Fondateur",
      director:
        "Direction",
      advisor:
        "Conseiller",
      partner:
        "Partenaire",
      client:
        "Client",
    }

  return (
    labels[value]
    ?? value.replaceAll(
      "_",
      " ",
    )
  )
}


function relationshipRoleLabel(
  value: string | null,
) {
  if (!value) {
    return "Rôle non renseigné"
  }

  const labels:
    Record<string, string> = {
      decision_maker:
        "Décideur",
      decider:
        "Décideur",
      director:
        "Direction",
      owner:
        "Propriétaire",
      influencer:
        "Influenceur",
      employee:
        "Collaborateur",
      advisor:
        "Conseiller",
      user:
        "Utilisateur",
    }

  return (
    labels[value]
    ?? value.replaceAll(
      "_",
      " ",
    )
  )
}


function isDecisionMaker(
  relation:
    Organization720ContactRelation,
) {
  const value =
    relation.relationship
      ?.relationship_role
    ?? relation.contact
      .decision_role

  return [
    "decision_maker",
    "decider",
    "owner",
    "director",
  ].includes(
    value,
  )
}


function isActiveRelation(
  relation:
    Organization720ContactRelation,
) {
  if (
    relation.relationship
  ) {
    return (
      relation.relationship
        .is_active
    )
  }

  return (
    relation.contact
      .is_active
  )
}


function formatRelationDate(
  value: string | null,
) {
  if (!value) {
    return null
  }

  const date =
    new Date(
      `${value}T00:00:00`,
    )

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
      month: "short",
      year: "numeric",
    },
  ).format(date)
}


function relationPeriodLabel(
  relation:
    Organization720ContactRelation,
) {
  const link =
    relation.relationship

  if (!link) {
    return "Période non renseignée"
  }

  const start =
    formatRelationDate(
      link.started_at,
    )

  const end =
    formatRelationDate(
      link.ended_at,
    )

  if (
    link.is_active
  ) {
    return start
      ? `Depuis ${start}`
      : "Relation actuelle"
  }

  if (
    start
    && end
  ) {
    return `${start} → ${end}`
  }

  if (end) {
    return `Jusqu'à ${end}`
  }

  if (start) {
    return `Depuis ${start}`
  }

  return "Période non renseignée"
}


export function Organization720Page() {
  const {
    organizationId,
  } = useParams()

  const {
    token,
  } = useAuth()

  const [
    organization720,
    setOrganization720,
  ] =
    useState<
      Organization720Projection
      | null
    >(null)

  const [
    loading,
    setLoading,
  ] =
    useState(false)

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    )

  const [
    activeSection,
    setActiveSection,
  ] =
    useState<
      "overview"
      | "contacts"
    >("overview")

  const [
    contactFilter,
    setContactFilter,
  ] =
    useState<
      "all"
      | "active"
      | "historical"
      | "decision_makers"
    >("all")


  useEffect(
    () => {
      if (
        !token
        || !organizationId
      ) {
        return
      }

      let cancelled = false

      void Promise.resolve()
        .then(
          () => {
            if (!cancelled) {
              setLoading(
                true,
              )
            }

            return (
              getOrganization720Request(
                token,
                organizationId,
              )
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

            setOrganization720(
              result,
            )

            setError(
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

            setError(
              caught instanceof Error
                ? caught.message
                : (
                  "Impossible de charger "
                  + "l'Organization 720°."
                ),
            )
          },
        )
        .finally(
          () => {
            if (!cancelled) {
              setLoading(
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
      organizationId,
      token,
    ],
  )


  if (
    loading
    && !organization720
  ) {
    return (
      <div className="page-stack">
        <Link
          to="/hub/organizations"
          className="back-link"
        >
          <ArrowLeft
            size={16}
          />

          Organization Registry
        </Link>

        <section className="panel organization720-page-state">
          <RefreshCw
            size={23}
          />

          <strong>
            Chargement de l'Organization 720°...
          </strong>

          <span>
            Lecture des données KEMS Core.
          </span>
        </section>
      </div>
    )
  }


  if (
    error
    && !organization720
  ) {
    return (
      <div className="page-stack">
        <Link
          to="/hub/organizations"
          className="back-link"
        >
          <ArrowLeft
            size={16}
          />

          Organization Registry
        </Link>

        <section className="panel organization720-page-state error">
          <ShieldAlert
            size={25}
          />

          <strong>
            Organization 720° indisponible
          </strong>

          <span>
            {error}
          </span>

          <Link
            to="/hub/organizations"
            className="button secondary"
          >
            Retour aux organisations
          </Link>
        </section>
      </div>
    )
  }


  if (!organization720) {
    return null
  }


  const {
    organization,
    contact_summary: contactSummary,
    data_quality: dataQuality,
    provenance,
    contacts,
  } = organization720


  const visibleContacts =
    contacts.filter(
      (
        relation,
      ) => {
        if (
          contactFilter
          === "active"
        ) {
          return (
            isActiveRelation(
              relation,
            )
          )
        }

        if (
          contactFilter
          === "historical"
        ) {
          return (
            !isActiveRelation(
              relation,
            )
          )
        }

        if (
          contactFilter
          === "decision_makers"
        ) {
          return (
            isDecisionMaker(
              relation,
            )
          )
        }

        return true
      },
    )


  return (
    <div className="page-stack organization720-page">
      <Link
        to="/hub/organizations"
        className="back-link"
      >
        <ArrowLeft
          size={16}
        />

        Organization Registry
      </Link>


      <section className="entity-hero organization720-hero">
        <div className="entity-hero-main">
          <div className="organization720-avatar">
            <Building2
              size={25}
            />

            <strong>
              {
                organizationInitials(
                  organization.name,
                )
              }
            </strong>
          </div>

          <div>
            <span className="eyebrow">
              Organization 720°
            </span>

            <h1>
              {organization.name}
            </h1>

            <p>
              {
                organization.industry
                ?? "Secteur non renseigné"
              }

              {" · "}

              {
                organizationTypeLabel(
                  organization.organization_type,
                )
              }
            </p>

            {
              organization.legal_name
              && organization.legal_name
                !== organization.name
                ? (
                  <span className="organization720-legal-name">
                    {
                      organization.legal_name
                    }
                  </span>
                )
                : null
            }

            <span className="muted">
              {
                locationLabel(
                  organization720,
                )
              }
            </span>

            <div className="badge-row">
              <StatusBadge
                tone={
                  organization.is_verified
                    ? "success"
                    : "warning"
                }
              >
                {
                  organization.is_verified
                    ? "Organisation vérifiée"
                    : "Organisation non vérifiée"
                }
              </StatusBadge>

              <StatusBadge
                tone={
                  organization.is_active
                    ? "success"
                    : undefined
                }
              >
                {
                  organization.is_active
                    ? "Active"
                    : "Inactive"
                }
              </StatusBadge>

              <StatusBadge tone="info">
                {
                  organizationTypeLabel(
                    organization.organization_type,
                  )
                }
              </StatusBadge>
            </div>
          </div>
        </div>


        <div className="entity-contact-grid">
          <div>
            <span>
              Site web
            </span>

            <strong>
              {
                organization.domain
                ?? organization.website
                ?? "Non renseigné"
              }
            </strong>
          </div>

          <div>
            <span>
              Email
            </span>

            <strong>
              {
                organization.email
                ?? "Non renseigné"
              }
            </strong>
          </div>

          <div>
            <span>
              Téléphone
            </span>

            <strong>
              {
                organization.phone
                ?? "Non renseigné"
              }
            </strong>
          </div>

          <div>
            <span>
              Source
            </span>

            <strong>
              {
                sourceLabel(
                  provenance.source_type,
                )
              }
            </strong>
          </div>
        </div>
      </section>


      <div className="section-tabs">
        <button
          type="button"
          className={
            activeSection
              === "overview"
              ? "tab active"
              : "tab"
          }
          onClick={() =>
            setActiveSection(
              "overview",
            )
          }
        >
          Overview
        </button>

        <button
          type="button"
          className={
            activeSection
              === "contacts"
              ? "tab active"
              : "tab"
          }
          onClick={() =>
            setActiveSection(
              "contacts",
            )
          }
        >
          Contacts
        </button>

        <button
          type="button"
          className="tab"
        >
          Commercial
        </button>

        <button
          type="button"
          className="tab"
        >
          Assurance
        </button>

        <button
          type="button"
          className="tab"
        >
          Investissement
        </button>

        <button
          type="button"
          className="tab"
        >
          Fiduciaire
        </button>

        <button
          type="button"
          className="tab"
        >
          Technologies
        </button>

        <button
          type="button"
          className="tab"
        >
          Historique
        </button>
      </div>


      {
        activeSection
        === "overview"
          ? (
            <>
              <section className="metric-grid three">
                <MetricCard
                  label="Contacts liés"
                  value={
                    String(
                      contactSummary
                        .total_contacts,
                    )
                  }
                  hint={
                    (
                      `${contactSummary.active_relations}`
                      + " relation"
                      + (
                        contactSummary.active_relations
                          > 1
                          ? "s actives"
                          : " active"
                      )
                    )
                  }
                />

                <MetricCard
                  label="Décideurs identifiés"
                  value={
                    String(
                      contactSummary
                        .decision_makers,
                    )
                  }
                  hint="Relations Core"
                />

                <MetricCard
                  label="Qualité Core"
                  value={
                    `${dataQuality.completeness_score}%`
                  }
                  hint={
                    dataQuality.is_verified
                      ? "Organisation vérifiée"
                      : "Vérification à compléter"
                  }
                />
              </section>


              <section className="panel organization720-foundation">
                <div className="organization720-foundation-icon">
                  <Users
                    size={21}
                  />
                </div>

                <div>
                  <span className="eyebrow">
                    Relations Core
                  </span>

                  <h2>
                    Réseau organisationnel
                  </h2>

                  <p>
                    {
                      contactSummary.total_contacts
                    }
                    {" contact"}
                    {
                      contactSummary.total_contacts
                      > 1
                        ? "s"
                        : ""
                    }
                    {" connu"}
                    {
                      contactSummary.total_contacts
                      > 1
                        ? "s"
                        : ""
                    }
                    {" dans KEMS Core, dont "}
                    {
                      contactSummary.decision_makers
                    }
                    {" décideur"}
                    {
                      contactSummary.decision_makers
                      > 1
                        ? "s"
                        : ""
                    }
                    {" identifié"}
                    {
                      contactSummary.decision_makers
                      > 1
                        ? "s"
                        : ""
                    }
                    .
                  </p>

                  <button
                    type="button"
                    className="button secondary"
                    onClick={() =>
                      setActiveSection(
                        "contacts",
                      )
                    }
                  >
                    Voir les contacts liés
                  </button>
                </div>
              </section>
            </>
          )
          : null
      }


      {
        activeSection
        === "contacts"
          ? (
            <section className="panel organization720-contacts-panel">
              <div className="organization720-contacts-heading">
                <div>
                  <span className="eyebrow">
                    Relations Core
                  </span>

                  <h2>
                    Contacts & décideurs
                  </h2>

                  <p>
                    Personnes actuellement ou historiquement
                    rattachées à cette organisation.
                  </p>
                </div>

                <div className="organization720-contact-counter">
                  <Users
                    size={18}
                  />

                  <strong>
                    {
                      contactSummary.total_contacts
                    }
                  </strong>

                  <span>
                    contact
                    {
                      contactSummary.total_contacts
                      > 1
                        ? "s"
                        : ""
                    }
                  </span>
                </div>
              </div>


              <div className="organization720-relation-summary">
                <button
                  type="button"
                  className={
                    contactFilter
                      === "all"
                      ? "organization720-relation-stat active"
                      : "organization720-relation-stat"
                  }
                  onClick={() =>
                    setContactFilter(
                      "all",
                    )
                  }
                >
                  <span>
                    Toutes
                  </span>

                  <strong>
                    {
                      contactSummary.total_contacts
                    }
                  </strong>
                </button>

                <button
                  type="button"
                  className={
                    contactFilter
                      === "active"
                      ? "organization720-relation-stat active"
                      : "organization720-relation-stat"
                  }
                  onClick={() =>
                    setContactFilter(
                      "active",
                    )
                  }
                >
                  <span>
                    Actives
                  </span>

                  <strong>
                    {
                      contactSummary.active_relations
                    }
                  </strong>
                </button>

                <button
                  type="button"
                  className={
                    contactFilter
                      === "historical"
                      ? "organization720-relation-stat active"
                      : "organization720-relation-stat"
                  }
                  onClick={() =>
                    setContactFilter(
                      "historical",
                    )
                  }
                >
                  <span>
                    Historiques
                  </span>

                  <strong>
                    {
                      contactSummary.historical_relations
                    }
                  </strong>
                </button>

                <button
                  type="button"
                  className={
                    contactFilter
                      === "decision_makers"
                      ? "organization720-relation-stat active"
                      : "organization720-relation-stat"
                  }
                  onClick={() =>
                    setContactFilter(
                      "decision_makers",
                    )
                  }
                >
                  <span>
                    Décideurs
                  </span>

                  <strong>
                    {
                      contactSummary.decision_makers
                    }
                  </strong>
                </button>
              </div>


              {
                visibleContacts.length
                  ? (
                    <div className="organization720-contact-list">
                      {
                        visibleContacts.map(
                          (
                            relation,
                          ) => {
                            const {
                              contact,
                              relationship,
                            } = relation

                            const active =
                              isActiveRelation(
                                relation,
                              )

                            const decisionMaker =
                              isDecisionMaker(
                                relation,
                              )

                            const jobTitle =
                              relationship
                                ?.job_title
                              ?? contact.job_title
                              ?? "Fonction non renseignée"

                            const role =
                              relationship
                                ?.relationship_role
                              ?? contact.decision_role

                            return (
                              <article
                                key={
                                  relationship?.id
                                  ?? contact.id
                                }
                                className="organization720-contact-card"
                              >
                                <div className="organization720-contact-main">
                                  <div className="avatar">
                                    {
                                      contactInitials(
                                        contact.first_name,
                                        contact.last_name,
                                      )
                                    }
                                  </div>

                                  <div>
                                    <div className="organization720-contact-name">
                                      <strong>
                                        {
                                          contact.first_name
                                        }
                                        {" "}
                                        {
                                          contact.last_name
                                        }
                                      </strong>

                                      {
                                        decisionMaker
                                          ? (
                                            <StatusBadge tone="info">
                                              Décideur
                                            </StatusBadge>
                                          )
                                          : null
                                      }

                                      {
                                        relationship?.is_primary
                                          ? (
                                            <StatusBadge>
                                              Principal
                                            </StatusBadge>
                                          )
                                          : null
                                      }

                                      <StatusBadge
                                        tone={
                                          active
                                            ? "success"
                                            : undefined
                                        }
                                      >
                                        {
                                          active
                                            ? "Actif"
                                            : "Historique"
                                        }
                                      </StatusBadge>
                                    </div>

                                    <span>
                                      {jobTitle}
                                    </span>

                                    <small>
                                      {
                                        contact.email
                                        ?? "Email non renseigné"
                                      }
                                    </small>
                                  </div>
                                </div>


                                <Link
                                  className="registry-icon-action"
                                  to={
                                    `/hub/contacts/${contact.id}`
                                  }
                                  title="Voir Client 720°"
                                  aria-label={
                                    `Voir Client 720° de ${
                                      contact.first_name
                                    } ${
                                      contact.last_name
                                    }`
                                  }
                                >
                                  <UserRound
                                    size={17}
                                  />
                                </Link>


                                <div className="organization720-contact-details">
                                  <div>
                                    <span>
                                      Relation
                                    </span>

                                    <strong>
                                      {
                                        relationshipTypeLabel(
                                          relationship
                                            ?.relationship_type
                                          ?? null,
                                        )
                                      }
                                    </strong>
                                  </div>

                                  <div>
                                    <span>
                                      Rôle
                                    </span>

                                    <strong>
                                      {
                                        relationshipRoleLabel(
                                          role,
                                        )
                                      }
                                    </strong>
                                  </div>

                                  <div>
                                    <span>
                                      Période
                                    </span>

                                    <strong>
                                      <CalendarDays
                                        size={14}
                                      />

                                      {
                                        relationPeriodLabel(
                                          relation,
                                        )
                                      }
                                    </strong>
                                  </div>

                                  <div>
                                    <span>
                                      Source
                                    </span>

                                    <strong>
                                      {
                                        sourceLabel(
                                          contact.source_type,
                                        )
                                      }
                                    </strong>
                                  </div>

                                  <div>
                                    <span>
                                      Vérification
                                    </span>

                                    <strong
                                      className={
                                        contact.is_verified
                                          ? "organization720-verified"
                                          : "organization720-unverified"
                                      }
                                    >
                                      {
                                        contact.is_verified
                                          ? "Vérifié"
                                          : "À vérifier"
                                      }
                                    </strong>
                                  </div>

                                  <div>
                                    <span>
                                      Téléphone
                                    </span>

                                    <strong>
                                      {
                                        contact.phone
                                        ?? "Non renseigné"
                                      }
                                    </strong>
                                  </div>
                                </div>
                              </article>
                            )
                          },
                        )
                      }
                    </div>
                  )
                  : (
                    <div className="organization720-empty-relations">
                      <CircleCheck
                        size={22}
                      />

                      <strong>
                        Aucun contact dans cette vue
                      </strong>

                      <span>
                        Aucun rattachement ne correspond
                        au filtre sélectionné.
                      </span>
                    </div>
                  )
              }
            </section>
          )
          : null
      }
    </div>
  )
}
