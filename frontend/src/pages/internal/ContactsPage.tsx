import {
  Building2,
  Download,
  Filter,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
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
  listContactsRequest,
} from "../../services/contactsApi"

import type {
  CoreContact,
} from "../../services/contactsApi"


function contactInitials(
  contact: CoreContact,
) {
  return (
    `${contact.first_name.charAt(0)}${contact.last_name.charAt(0)}`
      .toUpperCase()
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
      client_360:
        "Client 360°",
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


function completenessScore(
  contact: CoreContact,
) {
  const checks = [
    Boolean(
      contact.first_name,
    ),
    Boolean(
      contact.last_name,
    ),
    Boolean(
      contact.email,
    ),
    Boolean(
      contact.phone,
    ),
    Boolean(
      contact.job_title,
    ),
    Boolean(
      contact.organization_id,
    ),
  ]

  return Math.round(
    (
      checks.filter(
        Boolean,
      ).length
      / checks.length
    )
    * 100,
  )
}


export function ContactsPage() {
  const {
    token,
  } = useAuth()

  const [
    contacts,
    setContacts,
  ] =
    useState<
      CoreContact[]
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

            return listContactsRequest(
              token,
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

            setContacts(
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
                  + "les contacts Core."
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


  const visibleContacts =
    useMemo(
      () => {
        const normalizedSearch =
          search
            .trim()
            .toLowerCase()

        return contacts.filter(
          (
            contact,
          ) => {
            if (
              verificationFilter
                === "verified"
              && !contact.is_verified
            ) {
              return false
            }

            if (
              verificationFilter
                === "unverified"
              && contact.is_verified
            ) {
              return false
            }

            if (
              !normalizedSearch
            ) {
              return true
            }

            const haystack = [
              contact.first_name,
              contact.last_name,
              contact.email,
              contact.phone,
              contact.job_title,
              contact.source_type,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()

            return haystack.includes(
              normalizedSearch,
            )
          },
        )
      },
      [
        contacts,
        search,
        verificationFilter,
      ],
    )


  const verifiedCount =
    contacts.filter(
      (
        contact,
      ) =>
        contact.is_verified,
    ).length

  const linkedCount =
    contacts.filter(
      (
        contact,
      ) =>
        Boolean(
          contact.organization_id,
        ),
    ).length

  const sourceCount =
    new Set(
      contacts.map(
        (
          contact,
        ) =>
          contact.source_type,
      ),
    ).size


  return (
    <div className="page-stack">
      <div className="page-header with-actions">
        <div>
          <span className="eyebrow">
            KEMS Core
          </span>

          <h1>
            Contact Registry
          </h1>

          <p>
            Référentiel relationnel central de KEMS.
          </p>
        </div>

        <div className="button-group">
          <button
            type="button"
            className="button secondary"
          >
            <Download
              size={17}
            />

            Importer
          </button>

          <button
            type="button"
            className="button secondary"
          >
            <ShieldCheck
              size={17}
            />

            Déduplication
          </button>

          <button
            type="button"
            className="button primary"
          >
            <Plus
              size={17}
            />

            Nouveau contact
          </button>
        </div>
      </div>

      <section className="metric-grid five">
        <MetricCard
          label="Contacts"
          value={
            String(
              contacts.length,
            )
          }
        />

        <MetricCard
          label="Vérifiés"
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
              contacts.length
              - verifiedCount,
            )
          }
        />

        <MetricCard
          label="Avec organisation"
          value={
            String(
              linkedCount,
            )
          }
        />

        <MetricCard
          label="Sources"
          value={
            String(
              sourceCount,
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
              Tous
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
              Vérifiés
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
                placeholder="Rechercher un contact..."
              />
            </div>

            <button
              type="button"
              className="button ghost"
            >
              <Filter
                size={16}
              />

              Filtres
            </button>
          </div>
        </div>

        {loading ? (
          <div className="registry-state">
            <RefreshCw
              size={20}
            />

            <strong>
              Chargement des contacts Core...
            </strong>
          </div>
        ) : error ? (
          <div className="registry-state error">
            <strong>
              Contact Registry indisponible
            </strong>

            <span>
              {error}
            </span>
          </div>
        ) : visibleContacts.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>
                    Contact
                  </th>

                  <th>
                    Organisation
                  </th>

                  <th>
                    Fonction
                  </th>

                  <th>
                    Source
                  </th>

                  <th>
                    Qualité
                  </th>

                  <th>
                    Statut
                  </th>

                  <th />
                </tr>
              </thead>

              <tbody>
                {
                  visibleContacts.map(
                    (
                      contact,
                    ) => {
                      const quality =
                        completenessScore(
                          contact,
                        )

                      return (
                        <tr
                          key={
                            contact.id
                          }
                        >
                          <td>
                            <div className="entity-cell">
                              <div className="avatar">
                                {
                                  contactInitials(
                                    contact,
                                  )
                                }
                              </div>

                              <div>
                                <strong>
                                  {
                                    contact.first_name
                                  }
                                  {" "}
                                  {
                                    contact.last_name
                                  }
                                </strong>

                                <span>
                                  {
                                    contact.email
                                    ?? "Email non renseigné"
                                  }
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>
                            {
                              contact.organization_id
                                ? "Organisation liée"
                                : "—"
                            }
                          </td>

                          <td>
                            {
                              contact.job_title
                              ?? "—"
                            }
                          </td>

                          <td>
                            <StatusBadge tone="info">
                              {
                                sourceLabel(
                                  contact.source_type,
                                )
                              }
                            </StatusBadge>
                          </td>

                          <td>
                            <div className="quality">
                              <div className="quality-bar">
                                <span
                                  style={{
                                    width:
                                      `${quality}%`,
                                  }}
                                />
                              </div>

                              <strong>
                                {quality}%
                              </strong>
                            </div>
                          </td>

                          <td>
                            <StatusBadge
                              tone={
                                contact.is_verified
                                  ? "success"
                                  : "warning"
                              }
                            >
                              {
                                contact.is_verified
                                  ? "Vérifié"
                                  : "À vérifier"
                              }
                            </StatusBadge>
                          </td>

                          <td>
                            <div className="registry-row-actions">
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

                              {
                                contact.organization_id
                                  ? (
                                    <Link
                                      className="registry-icon-action organization"
                                      to={
                                        `/hub/organizations/${contact.organization_id}`
                                      }
                                      title="Voir Organization 720°"
                                      aria-label={
                                        `Voir Organization 720° liée à ${
                                          contact.first_name
                                        } ${
                                          contact.last_name
                                        }`
                                      }
                                    >
                                      <Building2
                                        size={17}
                                      />
                                    </Link>
                                  )
                                  : null
                              }
                            </div>
                          </td>
                        </tr>
                      )
                    },
                  )
                }
              </tbody>
            </table>
          </div>
        ) : (
          <div className="registry-state">
            <Search
              size={20}
            />

            <strong>
              Aucun contact trouvé
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
