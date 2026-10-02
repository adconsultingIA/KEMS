import {
  CheckCircle2,
  CircleCheck,
  Clock3,
  Filter,
  Workflow,
} from "lucide-react"
import { StatusBadge } from "../../components/ui/StatusBadge"
import { useActions } from "../../hooks/useActions"

export function ActionCenterPage() {
  const {
    actions,
    completeAction,
  } = useActions()

  const openActions = actions.filter(
    (action) =>
      action.status === "todo",
  )

  return (
    <div className="page-stack">
      <div className="page-header with-actions">
        <div>
          <span className="eyebrow">
            Transversal
          </span>

          <h1>Action Center</h1>

          <p>
            Toutes les actions importantes,
            quel que soit leur domaine d'origine.
          </p>
        </div>

        <button className="button secondary">
          <Filter size={17} />
          Filtrer
        </button>
      </div>

      <div className="action-center-summary">
        <div>
          <span>À traiter</span>
          <strong>
            {openActions.length}
          </strong>
        </div>

        <div>
          <span>Haute priorité</span>
          <strong>
            {
              openActions.filter(
                (action) =>
                  action.priority === "Haute",
              ).length
            }
          </strong>
        </div>

        <div>
          <span>Demandes clients</span>
          <strong>
            {
              openActions.filter(
                (action) =>
                  action.source ===
                  "Client 360°",
              ).length
            }
          </strong>
        </div>
      </div>

      <div className="section-tabs">
        <button className="tab active">
          À faire
        </button>
        <button className="tab">
          À valider
        </button>
        <button className="tab">
          À relancer
        </button>
        <button className="tab">
          À vérifier
        </button>
        <button className="tab">
          À renouveler
        </button>
      </div>

      {openActions.length ? (
        <section className="action-board">
          {openActions.map((action) => (
            <article
              className="action-card"
              key={action.id}
            >
              <div className="action-card-top">
                <div className="action-icon large">
                  <Workflow size={19} />
                </div>

                <StatusBadge
                  tone={
                    action.priority === "Haute"
                      ? "warning"
                      : "info"
                  }
                >
                  {action.priority}
                </StatusBadge>
              </div>

              <h3>{action.title}</h3>
              <p>{action.entity}</p>

              {action.reference ? (
                <div className="request-reference">
                  {action.reference}
                </div>
              ) : null}

              <div className="action-details">
                <div>
                  <span>Responsable</span>
                  <strong>
                    {action.owner}
                  </strong>
                </div>

                <div>
                  <span>Échéance</span>
                  <strong>
                    {action.due}
                  </strong>
                </div>

                <div>
                  <span>Source</span>
                  <strong>
                    {action.source}
                  </strong>
                </div>

                <div>
                  <span>Contexte</span>
                  <strong>
                    {action.context}
                  </strong>
                </div>
              </div>

              {action.description ? (
                <div className="action-description">
                  {action.description}
                </div>
              ) : null}

              <div className="action-card-footer">
                <button className="button ghost">
                  <Clock3 size={16} />
                  Reporter
                </button>

                <button
                  className="button primary"
                  onClick={() =>
                    completeAction(
                      action.id,
                    )
                  }
                >
                  <CircleCheck size={16} />
                  Traiter
                </button>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="panel empty-panel">
          <CheckCircle2 size={34} />

          <strong>
            Aucune action en attente
          </strong>

          <p>
            Toutes les actions KEMS ont été
            traitées.
          </p>
        </section>
      )}
    </div>
  )
}
