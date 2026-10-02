import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  ActionsContext,
  type AdviceRequestInput,
  type KemsAction,
} from "./actions-context"

const initialActions: KemsAction[] = [
  {
    id: "act-1",
    title: "Renouvellement Assurance",
    entity: "Jean Dupont",
    owner: "Naomie Nassara",
    priority: "Haute",
    due: "12 oct. 2026",
    source: "Assurance",
    context: "Client 720°",
    status: "todo",
  },
  {
    id: "act-2",
    title: "Doublon potentiel à contrôler",
    entity: "Marc Durand",
    owner: "Parfait ADJANOR",
    priority: "Moyenne",
    due: "Aujourd'hui",
    source: "Core",
    context: "Data Quality",
    status: "todo",
  },
  {
    id: "act-3",
    title: "Demande de conseil reçue",
    entity: "Sophie Martin",
    owner: "Euloge Santos",
    priority: "Moyenne",
    due: "Demain",
    source: "Client 360°",
    context: "Investissement",
    status: "todo",
  },
]

const STORAGE_KEY = "kems-demo-actions"

function generateReference() {
  const timestamp = Date.now()
    .toString()
    .slice(-6)

  return `KEMS-REQ-${timestamp}`
}

export function ActionsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [actions, setActions] =
    useState<KemsAction[]>(() => {
      const stored =
        localStorage.getItem(STORAGE_KEY)

      if (!stored) {
        return initialActions
      }

      try {
        return JSON.parse(stored)
      } catch {
        return initialActions
      }
    })

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(actions),
    )
  }, [actions])

  function addAdviceRequest(
    input: AdviceRequestInput,
  ) {
    const reference = generateReference()

    const priority: KemsAction["priority"] =
      input.urgency === "urgent"
        ? "Haute"
        : input.urgency === "normal"
          ? "Moyenne"
          : "Basse"

    const action: KemsAction = {
      id: `action-${Date.now()}`,
      title:
        input.subject ||
        `Demande conseil ${input.domain}`,
      entity: input.entity,
      owner: "À assigner",
      priority,
      due:
        input.urgency === "urgent"
          ? "Aujourd'hui"
          : "À planifier",
      source: "Client 360°",
      context: input.domain,
      status: "todo",
      reference,
      description: input.description,
      createdAt:
        new Date().toLocaleString("fr-CH"),
    }

    setActions((current) => [
      action,
      ...current,
    ])

    return {
      reference,
      action,
    }
  }

  function completeAction(id: string) {
    setActions((current) =>
      current.map((action) =>
        action.id === id
          ? {
              ...action,
              status: "done",
            }
          : action,
      ),
    )
  }

  const value = useMemo(
    () => ({
      actions,
      addAdviceRequest,
      completeAction,
    }),
    [actions],
  )

  return (
    <ActionsContext.Provider value={value}>
      {children}
    </ActionsContext.Provider>
  )
}
