import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CircleCheck,
  Clock3,
  FileText,
  ShieldCheck,
  TrendingUp,
} from "lucide-react"
import { Link } from "react-router-dom"
import { MetricCard } from "../../components/ui/MetricCard"
import { StatusBadge } from "../../components/ui/StatusBadge"
import { timeline } from "../../data/demo"

export function Client720Page() {
  return (
    <div className="page-stack">
      <Link to="/hub/contacts" className="back-link">
        <ArrowLeft size={16} />
        Contact Registry
      </Link>

      <section className="entity-hero">
        <div className="entity-hero-main">
          <div className="avatar hero-avatar">JD</div>

          <div>
            <span className="eyebrow">Client 720°</span>
            <h1>Jean Dupont</h1>
            <p>
              Directeur — Example Consulting SA
            </p>
            <span className="muted">
              Genève, Suisse
            </span>

            <div className="badge-row">
              <StatusBadge tone="success">
                Vérifié
              </StatusBadge>
              <StatusBadge tone="info">
                Décideur
              </StatusBadge>
              <StatusBadge>Client actif</StatusBadge>
              <StatusBadge>Assurance</StatusBadge>
              <StatusBadge>
                Investissement
              </StatusBadge>
            </div>
          </div>
        </div>

        <div className="entity-contact-grid">
          <div>
            <span>Email</span>
            <strong>jean.dupont@example.ch</strong>
          </div>
          <div>
            <span>Téléphone</span>
            <strong>+41 79 123 45 67</strong>
          </div>
          <div>
            <span>Source</span>
            <strong>Legacy import</strong>
          </div>
          <div>
            <span>Qualité</span>
            <strong>94%</strong>
          </div>
        </div>
      </section>

      <div className="section-tabs">
        <button className="tab active">Overview</button>
        <button className="tab">Relations</button>
        <button className="tab">Commercial</button>
        <button className="tab">Assurance</button>
        <button className="tab">Investissement</button>
        <button className="tab">Fiduciaire</button>
        <button className="tab">Documents</button>
        <button className="tab">Historique</button>
      </div>

      <section className="metric-grid three">
        <MetricCard
          label="Relationship Health"
          value="88/100"
          hint="Relation forte"
        />
        <MetricCard
          label="Data Quality"
          value="94%"
          hint="Données fiables"
        />
        <MetricCard
          label="Activité"
          value="Active"
          hint="Dernier contact aujourd'hui"
        />
      </section>

      <section className="business-cards">
        <div className="business-card">
          <BriefcaseBusiness size={22} />
          <span>Commercial</span>
          <strong>3 opportunités</strong>
          <p>CHF 85'000 de pipeline actif</p>
        </div>

        <div className="business-card">
          <ShieldCheck size={22} />
          <span>Assurance</span>
          <strong>2 contrats actifs</strong>
          <p>1 renouvellement prochain</p>
        </div>

        <div className="business-card">
          <TrendingUp size={22} />
          <span>Investissement</span>
          <strong>1 dossier actif</strong>
          <p>Profil investisseur modéré</p>
        </div>

        <div className="business-card">
          <Building2 size={22} />
          <span>Fiduciaire</span>
          <strong>Aucun mandat</strong>
          <p>Potentiel à explorer</p>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Pilotage</span>
              <h2>À surveiller</h2>
            </div>
          </div>

          <div className="watch-list">
            <div className="watch-item warning">
              <Clock3 size={18} />
              <div>
                <strong>Renouvellement Assurance</strong>
                <span>Échéance dans 27 jours</span>
              </div>
            </div>

            <div className="watch-item">
              <BriefcaseBusiness size={18} />
              <div>
                <strong>Opportunité CHF 45'000</strong>
                <span>Sans activité depuis 8 jours</span>
              </div>
            </div>

            <div className="watch-item">
              <FileText size={18} />
              <div>
                <strong>LinkedIn non vérifié</strong>
                <span>Compléter la qualité du contact</span>
              </div>
            </div>

            <div className="watch-item success">
              <CircleCheck size={18} />
              <div>
                <strong>Dossier Investissement</strong>
                <span>À jour</span>
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">720°</span>
              <h2>Activité récente</h2>
            </div>
          </div>

          <div className="timeline">
            {timeline.map((item) => (
              <div
                className="timeline-item"
                key={`${item.date}-${item.title}`}
              >
                <div className="timeline-dot" />
                <div>
                  <span className="timeline-date">
                    {item.date}
                  </span>
                  <strong>{item.title}</strong>
                  <p>
                    {item.domain} · {item.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
