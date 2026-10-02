import {
  Download,
  Filter,
  Plus,
  Search,
  ShieldCheck,
} from "lucide-react"
import { Link } from "react-router-dom"
import { MetricCard } from "../../components/ui/MetricCard"
import { StatusBadge } from "../../components/ui/StatusBadge"
import { contacts } from "../../data/demo"

export function ContactsPage() {
  return (
    <div className="page-stack">
      <div className="page-header with-actions">
        <div>
          <span className="eyebrow">KEMS Core</span>
          <h1>Contact Registry</h1>
          <p>
            Référentiel relationnel central de KEMS.
          </p>
        </div>

        <div className="button-group">
          <button className="button secondary">
            <Download size={17} />
            Importer
          </button>
          <button className="button secondary">
            <ShieldCheck size={17} />
            Déduplication
          </button>
          <button className="button primary">
            <Plus size={17} />
            Nouveau contact
          </button>
        </div>
      </div>

      <section className="metric-grid five">
        <MetricCard label="Contacts" value="2 481" />
        <MetricCard label="Organizations" value="326" />
        <MetricCard label="Data Quality" value="94%" />
        <MetricCard label="Doublons" value="17" />
        <MetricCard label="Nouveaux ce mois" value="128" />
      </section>

      <section className="panel">
        <div className="registry-toolbar">
          <div className="tabs">
            <button className="tab active">Tous</button>
            <button className="tab">Vérifiés</button>
            <button className="tab">À compléter</button>
            <button className="tab">À revoir</button>
            <button className="tab">Récents</button>
          </div>

          <div className="toolbar-actions">
            <div className="inline-search">
              <Search size={16} />
              <input placeholder="Rechercher un contact..." />
            </div>

            <button className="button ghost">
              <Filter size={16} />
              Filtres
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Contact</th>
                <th>Organisation</th>
                <th>Fonction</th>
                <th>Source</th>
                <th>Qualité</th>
                <th>Statut</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id}>
                  <td>
                    <div className="entity-cell">
                      <div className="avatar">
                        {contact.initials}
                      </div>
                      <div>
                        <strong>{contact.name}</strong>
                        <span>{contact.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>{contact.organization}</td>
                  <td>{contact.jobTitle}</td>
                  <td>
                    <StatusBadge tone="info">
                      {contact.source}
                    </StatusBadge>
                  </td>
                  <td>
                    <div className="quality">
                      <div className="quality-bar">
                        <span
                          style={{
                            width: `${contact.quality}%`,
                          }}
                        />
                      </div>
                      <strong>{contact.quality}%</strong>
                    </div>
                  </td>
                  <td>
                    <StatusBadge
                      tone={
                        contact.verified
                          ? "success"
                          : "warning"
                      }
                    >
                      {contact.verified
                        ? "Vérifié"
                        : "À vérifier"}
                    </StatusBadge>
                  </td>
                  <td>
                    <Link
                      className="row-link"
                      to={`/hub/contacts/${contact.id}`}
                    >
                      Voir 720°
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
