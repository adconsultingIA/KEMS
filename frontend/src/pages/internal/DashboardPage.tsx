import {
  ArrowRight,
  Building2,
  ShieldAlert,
  TrendingUp,
  Users,
} from "lucide-react"
import { Link } from "react-router-dom"
import { MetricCard } from "../../components/ui/MetricCard"
import { actions } from "../../data/demo"

export function DashboardPage() {
  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">KEMS 720°</span>
          <h1>Pilotage global</h1>
          <p>
            Voir selon son rôle. Comprendre selon son contexte.
            Agir depuis un seul endroit.
          </p>
        </div>
      </div>

      <section className="metric-grid five">
        <MetricCard
          label="Clients actifs"
          value="1 482"
          hint="+4,8% ce mois"
        />
        <MetricCard
          label="Organizations"
          value="326"
          hint="94% qualifiées"
        />
        <MetricCard
          label="Opportunités"
          value="CHF 2.4 M"
          hint="Pipeline ouvert"
        />
        <MetricCard
          label="Contrats Assurance"
          value="1 126"
          hint="31 renouvellements"
        />
        <MetricCard
          label="Data Quality"
          value="94%"
          hint="17 doublons à revoir"
        />
      </section>

      <section className="dashboard-grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Priorités</span>
              <h2>À traiter aujourd'hui</h2>
            </div>

            <Link to="/hub/actions" className="text-link">
              Tout voir
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="action-list">
            {actions.map((action) => (
              <div className="action-row" key={action.id}>
                <div className="action-icon">
                  <ShieldAlert size={18} />
                </div>

                <div className="action-main">
                  <strong>{action.title}</strong>
                  <span>
                    {action.entity} · {action.source}
                  </span>
                </div>

                <div className="action-meta">
                  <strong>{action.priority}</strong>
                  <span>{action.due}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Activité</span>
              <h2>Par pôle</h2>
            </div>
          </div>

          <div className="business-list">
            <div className="business-row">
              <Users size={18} />
              <span>Commercial</span>
              <strong>+18%</strong>
            </div>
            <div className="business-row">
              <ShieldAlert size={18} />
              <span>Assurance</span>
              <strong>+8%</strong>
            </div>
            <div className="business-row">
              <TrendingUp size={18} />
              <span>Investissement</span>
              <strong>+12%</strong>
            </div>
            <div className="business-row">
              <Building2 size={18} />
              <span>Fiduciaire</span>
              <strong>+2%</strong>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
