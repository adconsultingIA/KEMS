import {
  BadgeCheck,
  ChevronDown,
  Layers3,
  LogOut,
  Search,
} from "lucide-react"
import {
  useState,
} from "react"

import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom"
import {
  projectionDefinitions,
} from "../../config/businessProjection"
import type {
  ProjectionKey,
} from "../../context/projection-context"
import { useAuth } from "../../hooks/useAuth"
import {
  useProjection,
} from "../../hooks/useProjection"

function initials(
  fullName: string,
) {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase(),
    )
    .join("")
}

export function AppShell() {
  const {
    auth,
    logout,
  } = useAuth()

  const {
    activeContext,
    canSwitchContext,
    setActiveContext,
  } = useProjection()

  const navigate = useNavigate()

  const [
    directionMenuOpen,
    setDirectionMenuOpen,
  ] =
    useState(true)

  const [
    directionServicesOpen,
    setDirectionServicesOpen,
  ] =
    useState(false)

  const definition =
    projectionDefinitions[
      activeContext
    ]

  const fullName =
    auth?.profile?.full_name
    ?? "KEMS"

  const realUnit =
    auth?.primary_unit?.name
    ?? "Interne"

  const directionServices = [
    {
      context:
        "commercial" as const,
      definition:
        projectionDefinitions.commercial,
    },
    {
      context:
        "assurance" as const,
      definition:
        projectionDefinitions.assurance,
    },
    {
      context:
        "investissement" as const,
      definition:
        projectionDefinitions.investissement,
    },
    {
      context:
        "fiduciaire" as const,
      definition:
        projectionDefinitions.fiduciaire,
    },
    {
      context:
        "technologies" as const,
      definition:
        projectionDefinitions.technologies,
    },
  ]

  async function handleLogout() {
    await logout()

    navigate(
      "/login",
      {
        replace: true,
      },
    )
  }

  function switchContext(
    context: ProjectionKey,
  ) {
    setActiveContext(context)

    navigate(
      "/hub",
      {
        replace: false,
      },
    )
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand sidebar-brand-lockup">
          <div className="sidebar-brand-frame">
            <img
              src="/brand/kems-logo.jpeg"
              alt="KEMS Concept"
              className="kems-logo-sidebar"
            />
          </div>
        </div>

        <div className="brand-signature">
          <span />
          <span />
          <span />
        </div>

        <div className="sidebar-context">
          <span className="sidebar-context-label">
            Contexte
          </span>

          {canSwitchContext ? (
            activeContext
            === "direction"
              ? (
                <button
                  type="button"
                  className={
                    `sidebar-accordion-control direction-accordion-control ${
                      directionMenuOpen
                        ? "open"
                        : ""
                    }`
                  }
                  aria-expanded={
                    directionMenuOpen
                  }
                  onClick={() =>
                    setDirectionMenuOpen(
                      (
                        current,
                      ) =>
                        !current,
                    )
                  }
                >
                  <span className="sidebar-accordion-icon direction-accordion-icon">
                    <definition.icon
                      size={18}
                    />
                  </span>

                  <span className="sidebar-accordion-label">
                    Direction 720°
                  </span>

                  <ChevronDown
                    size={16}
                    className="sidebar-accordion-chevron"
                  />
                </button>
              )
              : (
                <div className="context-select-wrap">
                  <definition.icon
                    size={17}
                  />

                  <select
                    aria-label="Changer de contexte KEMS"
                    value={activeContext}
                    onChange={(event) =>
                      switchContext(
                        event.target
                          .value as ProjectionKey,
                      )
                    }
                  >
                    <option value="direction">
                      Direction 720°
                    </option>

                    <option value="commercial">
                      Commercial
                    </option>

                    <option value="assurance">
                      Assurance
                    </option>

                    <option value="investissement">
                      Investissement
                    </option>

                    <option value="fiduciaire">
                      Fiduciaire
                    </option>

                    <option value="technologies">
                      Technologies
                    </option>
                  </select>

                  <ChevronDown
                    size={14}
                    className="context-native-chevron"
                  />
                </div>
              )
          ) : (
            <div className="context-static">
              <definition.icon
                size={17}
              />

              <span>
                {definition.shortLabel}
              </span>
            </div>
          )}
        </div>

        <nav
          className={
            `sidebar-nav sidebar-nav-${activeContext}`
          }
        >
          {
            activeContext
            === "direction"
              ? (
                <div className="direction-sidebar-family">
                  {
                    directionMenuOpen
                      ? (
                        <div className="direction-menu-content">
                          {
                            definition.nav.map(
                              (
                                item,
                              ) => {
                                const Icon =
                                  item.icon

                                return (
                                  <NavLink
                                    key={
                                      `${activeContext}-${item.to}-${item.label}`
                                    }
                                    to={
                                      item.to
                                    }
                                    end={
                                      item.to
                                      === "/hub"
                                    }
                                    className={({
                                      isActive,
                                    }) =>
                                      `nav-item direction-nav-item ${
                                        isActive
                                          ? "active"
                                          : ""
                                      }`
                                    }
                                  >
                                    <Icon
                                      size={18}
                                    />

                                    <span>
                                      {
                                        item.label
                                      }
                                    </span>
                                  </NavLink>
                                )
                              },
                            )
                          }
                        </div>
                      )
                      : null
                  }


                  <div className="direction-services-block">
                    <button
                      type="button"
                      className={
                        `sidebar-accordion-control services-accordion-control ${
                          directionServicesOpen
                            ? "open"
                            : ""
                        }`
                      }
                      aria-expanded={
                        directionServicesOpen
                      }
                      onClick={() =>
                        setDirectionServicesOpen(
                          (
                            current,
                          ) =>
                            !current,
                        )
                      }
                    >
                      <span className="sidebar-accordion-icon services-accordion-icon">
                        <Layers3
                          size={18}
                        />
                      </span>

                      <span className="sidebar-accordion-label">
                        Services
                      </span>

                      <ChevronDown
                        size={16}
                        className="sidebar-accordion-chevron"
                      />
                    </button>

                    {
                      directionServicesOpen
                        ? (
                          <div className="direction-services-list">
                            {
                              directionServices.map(
                                (
                                  service,
                                ) => {
                                  const ServiceIcon =
                                    service.definition.icon

                                  return (
                                    <button
                                      key={
                                        service.context
                                      }
                                      type="button"
                                      className={
                                        `direction-service-item service-${service.context}`
                                      }
                                      onClick={() =>
                                        switchContext(
                                          service.context,
                                        )
                                      }
                                    >
                                      <span className="direction-service-icon">
                                        <ServiceIcon
                                          size={17}
                                        />
                                      </span>

                                      <span>
                                        {
                                          service.definition.shortLabel
                                        }
                                      </span>
                                    </button>
                                  )
                                },
                              )
                            }
                          </div>
                        )
                        : null
                    }
                  </div>
                </div>
              )
              : (
                <>
                  <span
                    className={
                      `sidebar-family-label service-family-label service-${activeContext}`
                    }
                  >
                    {
                      definition.shortLabel
                    }
                  </span>

                  {
                    definition.nav.map(
                      (
                        item,
                      ) => {
                        const Icon =
                          item.icon

                        return (
                          <NavLink
                            key={
                              `${activeContext}-${item.to}-${item.label}`
                            }
                            to={
                              item.to
                            }
                            end={
                              item.to
                              === "/hub"
                            }
                            className={({
                              isActive,
                            }) =>
                              `nav-item ${
                                isActive
                                  ? "active"
                                  : ""
                              }`
                            }
                          >
                            <Icon
                              size={18}
                            />

                            <span>
                              {
                                item.label
                              }
                            </span>
                          </NavLink>
                        )
                      },
                    )
                  }
                </>
              )
          }
        </nav>

      </aside>

      <main className="main-shell">
        <header className="topbar">
          <div className="global-search">
            <Search size={18} />

            <input
              placeholder="Rechercher dans KEMS..."
              aria-label="Rechercher dans KEMS"
            />
          </div>

          <div className="topbar-actions">
            <div
              className={
                `current-context-pill context-${activeContext}`
              }
            >
              <definition.icon
                size={15}
              />

              <span>
                {definition.label}
              </span>
            </div>

            <span className="environment-pill">
              <BadgeCheck size={15} />
              KEMS Core
            </span>

            <div className="topbar-user-card">
              <div className="topbar-user-avatar">
                {
                  initials(
                    fullName,
                  )
                }
              </div>

              <div className="topbar-user-identity">
                <strong>
                  {fullName}
                </strong>

                <span>
                  {realUnit}
                </span>
              </div>

              <button
                type="button"
                className="topbar-logout"
                aria-label="Se déconnecter"
                title="Se déconnecter"
                onClick={handleLogout}
              >
                <LogOut
                  size={16}
                />
              </button>
            </div>
          </div>
        </header>

        <div className="page-container">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
