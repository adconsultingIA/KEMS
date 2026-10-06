import {
  Building2,
  Plus,
  RefreshCw,
  Search,
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
  MetricCard,
} from "../../components/ui/MetricCard"

import {
  StatusBadge,
} from "../../components/ui/StatusBadge"

import {
  useAuth,
} from "../../hooks/useAuth"

import {
  listOrganizationsRequest,
} from "../../services/organizationsApi"

import type {
  CoreOrganization,
} from "../../services/organizationsApi"


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
    }

  return (
    labels[value]
    ?? value.replaceAll(
      "_",
      " ",
    )
  )
}


function organizationInitials(
  name: string,
) {
  const parts =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)

  if (!parts.length) {
    return "OR"
  }

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase()
  }

  return (
    `${parts[0][0]}${parts[1][0]}`
      .toUpperCase()
  )
}


export function OrganizationsPage() {
  const {
    token,
  } = useAuth()

  const [
    organizations,
    setOrganizations,
  ] =
    useState<
      CoreOrganization[]
    >([])

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
    search,
    setSearch,
  ] =
    useState("")

  const [
    verificationFilter,
    setVerificationFilter,
  ] =
    useState<
      "all"
      | "verified"
      | "unverified"
    >("all")


  useEffect(
    () => {
      if (!token) {
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
              listOrganizationsRequest(
                token,
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

            setOrganizations(
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
                  + "les organisations."
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
      token,
    ],
  )


  const visibleOrganizations =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase()

        return organizations.filter(
          (
            organization,
          ) => {
            if (
              verificationFilter
                === "verified"
              && !organization
                .is_verified
            ) {
              return false
            }

            if (
              verificationFilter
                === "unverified"
              && organization
                .is_verified
            ) {
              return false
            }

            if (!query) {
              return true
            }

            const haystack = [
              organization.name,
              organization.legal_name,
              organization.industry,
              organization.domain,
              organization.city,
              organization.country,
              organization.organization_type,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()

            return haystack.includes(
              query,
            )
          },
        )
      },
      [
        organizations,
        search,
        verificationFilter,
      ],
    )


  const verifiedCount =
    organizations.filter(
      (
        organization,
      ) =>
        organization.is_verified,
    ).length

  const activeCount =
    organizations.filter(
      (
        organization,
      ) =>
        organization.is_active,
    ).length

  const partnerLikeCount =
    organizations.filter(
      (
        organization,
      ) =>
        [
          "partner",
          "insurer",
          "bank",
          "fiduciary",
        ].includes(
          organization
            .organization_type,
        ),
    ).length


  return (
    <div className="page-stack">
      <div className="page-header with-actions">
        <div>
          <span className="eyebrow">
            KEMS Core
          </span>

          <h1>
            Organization Registry
          </h1>

          <p>
            Référentiel central des entreprises,
            partenaires et structures liées à KEMS.
          </p>
        </div>

        <div className="button-group">
          <button
            type="button"
            className="button primary"
          >
            <Plus
              size={17}
            />

            Nouvelle organisation
          </button>
        </div>
      </div>


      <section className="metric-grid five">
        <MetricCard
          label="Organisations"
          value={
            String(
              organizations.length,
            )
          }
        />

        <MetricCard
          label="Actives"
          value={
            String(
              activeCount,
            )
          }
        />

        <MetricCard
          label="Vérifiées"
          value={
            String(
              verifiedCount,
            )
          }
        />

        <MetricCard
          label="À vérifier"
          value={
            String(
              organizations.length
              - verifiedCount,
            )
          }
        />

        <MetricCard
          label="Partenaires / institutions"
          value={
            String(
              partnerLikeCount,
            )
          }
        />
      </section>


      <section className="panel">
        <div className="registry-toolbar">
          <div className="tabs">
            <button
              type="button"
              className={
                verificationFilter
                  === "all"
                  ? "tab active"
                  : "tab"
              }
              onClick={() =>
                setVerificationFilter(
                  "all",
                )
              }
            >
              Toutes
            </button>

            <button
              type="button"
              className={
                verificationFilter
                  === "verified"
                  ? "tab active"
                  : "tab"
              }
              onClick={() =>
                setVerificationFilter(
                  "verified",
                )
              }
            >
              Vérifiées
            </button>

            <button
              type="button"
              className={
                verificationFilter
                  === "unverified"
                  ? "tab active"
                  : "tab"
              }
              onClick={() =>
                setVerificationFilter(
                  "unverified",
                )
              }
            >
              À vérifier
            </button>
          </div>

          <div className="toolbar-actions">
            <div className="inline-search">
              <Search
                size={16}
              />

              <input
                value={
                  search
                }
                onChange={(
                  event,
                ) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Rechercher une organisation..."
              />
            </div>
          </div>
        </div>


        {loading ? (
          <div className="registry-state">
            <RefreshCw
              size={20}
            />

            <strong>
              Chargement des organisations Core...
            </strong>
          </div>
        ) : error ? (
          <div className="registry-state error">
            <strong>
              Organization Registry indisponible
            </strong>

            <span>
              {error}
            </span>
          </div>
        ) : visibleOrganizations.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>
                    Organisation
                  </th>

                  <th>
                    Type
                  </th>

                  <th>
                    Secteur
                  </th>

                  <th>
                    Localisation
                  </th>

                  <th>
                    Source
                  </th>

                  <th>
                    Statut
                  </th>

                  <th />
                </tr>
              </thead>

              <tbody>
                {
                  visibleOrganizations.map(
                    (
                      organization,
                    ) => (
                      <tr
                        key={
                          organization.id
                        }
                      >
                        <td>
                          <div className="entity-cell">
                            <div className="avatar">
                              {
                                organizationInitials(
                                  organization.name,
                                )
                              }
                            </div>

                            <div>
                              <strong>
                                {
                                  organization.name
                                }
                              </strong>

                              <span>
                                {
                                  organization.domain
                                  ?? organization.website
                                  ?? "Domaine non renseigné"
                                }
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          {
                            organizationTypeLabel(
                              organization
                                .organization_type,
                            )
                          }
                        </td>

                        <td>
                          {
                            organization.industry
                            ?? "—"
                          }
                        </td>

                        <td>
                          {
                            [
                              organization.city,
                              organization.country,
                            ]
                              .filter(Boolean)
                              .join(", ")
                            || "—"
                          }
                        </td>

                        <td>
                          <StatusBadge tone="info">
                            {
                              sourceLabel(
                                organization
                                  .source_type,
                              )
                            }
                          </StatusBadge>
                        </td>

                        <td>
                          <StatusBadge
                            tone={
                              organization
                                .is_verified
                                ? "success"
                                : "warning"
                            }
                          >
                            {
                              organization
                                .is_verified
                                ? "Vérifiée"
                                : "À vérifier"
                            }
                          </StatusBadge>
                        </td>

                        <td>
                          <Link
                            className="row-link"
                            to={
                              `/hub/organizations/${organization.id}`
                            }
                          >
                            Voir 720°
                          </Link>
                        </td>
                      </tr>
                    ),
                  )
                }
              </tbody>
            </table>
          </div>
        ) : (
          <div className="registry-state">
            <Building2
              size={21}
            />

            <strong>
              Aucune organisation trouvée
            </strong>

            <span>
              Modifie la recherche ou le filtre.
            </span>
          </div>
        )}
      </section>
    </div>
  )
}
