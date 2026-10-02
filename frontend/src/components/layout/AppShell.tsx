import {
  Activity,
  BadgeCheck,
  Building2,
  CircleUserRound,
  ExternalLink,
  LayoutDashboard,
  LineChart,
  LogOut,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react"
import { Link, NavLink, Outlet } from "react-router-dom"

const navItems = [
  {
    label: "Dashboard",
    to: "/hub",
    icon: LayoutDashboard,
  },
  {
    label: "Growth Engine",
    to: "/hub/growth",
    icon: LineChart,
  },
  {
    label: "Contacts",
    to: "/hub/contacts",
    icon: Users,
  },
  {
    label: "Organizations",
    to: "/hub/organizations",
    icon: Building2,
  },
  {
    label: "Action Center",
    to: "/hub/actions",
    icon: Workflow,
  },
  {
    label: "Assurance",
    to: "/hub/assurance",
    icon: ShieldCheck,
  },
  {
    label: "Investissement",
    to: "/hub/investissement",
    icon: Activity,
  },
  {
    label: "Technologies",
    to: "/hub/technologies",
    icon: Sparkles,
  },
]

export function AppShell() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">K</div>

          <div>
            <strong>KEMS</strong>
            <span>Concept</span>
          </div>
        </div>

        <div className="brand-signature">
          <span />
          <span />
          <span />
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/hub"}
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <NavLink
            to="/hub/settings"
            className="nav-item"
          >
            <Settings size={18} />
            <span>Administration</span>
          </NavLink>

          <div className="sidebar-user">
            <div className="avatar small">PA</div>

            <div>
              <strong>Parfait ADJANOR</strong>
              <span>Technologies</span>
            </div>

            <LogOut size={16} />
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
            <Link
              to="/client"
              className="experience-switch client-switch"
            >
              <span className="experience-dot" />

              <div>
                <strong>Client 360°</strong>
                <span>Voir le portail client</span>
              </div>

              <ExternalLink size={14} />
            </Link>

            <span className="environment-pill">
              <BadgeCheck size={15} />
              KEMS Core
            </span>

            <div className="topbar-profile">
              <CircleUserRound size={19} />

              <div>
                <strong>Parfait</strong>
                <span>Technologies</span>
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
