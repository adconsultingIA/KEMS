import {
  BadgeCheck,
  ChevronDown,
  CircleUserRound,
  LogOut,
  Search,
} from "lucide-react"
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

  const definition =
    projectionDefinitions[
      activeContext
    ]

  const fullName =
    auth?.profile?.full_name
    ?? "KEMS"

  const firstName =
    fullName.split(" ")[0]

  const realUnit =
    auth?.primary_unit?.name
    ?? "Interne"

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

              <ChevronDown size={14} />
            </div>
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

        <nav className="sidebar-nav">
          {definition.nav.map(
            (item) => {
              const Icon =
                item.icon

              return (
                <NavLink
                  key={`${activeContext}-${item.to}-${item.label}`}
                  to={item.to}
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
                  <Icon size={18} />

                  <span>
                    {item.label}
                  </span>
                </NavLink>
              )
            },
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="avatar small">
              {initials(fullName)}
            </div>

            <div>
              <strong>
                {fullName}
              </strong>

              <span>
                {realUnit}
              </span>
            </div>

            <button
              type="button"
              className="sidebar-logout"
              aria-label="Se déconnecter"
              onClick={handleLogout}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
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

            <div className="topbar-profile">
              <CircleUserRound size={19} />

              <div>
                <strong>
                  {firstName}
                </strong>

                <span>
                  {realUnit}
                </span>
              </div>
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
