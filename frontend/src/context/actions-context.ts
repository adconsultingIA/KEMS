import { createContext } from "react"

export type KemsAction = {
  id: string
  title: string
  entity: string
  owner: string
  priority: "Haute" | "Moyenne" | "Basse"
  due: string
  source: string
  context: string
  status: "todo" | "done"
  reference?: string
  description?: string
  createdAt?: string
}

export type AdviceRequestInput = {
  entity: string
  domain: string
  subject: string
  description: string
  urgency: string
}

export type ActionsContextValue = {
  actions: KemsAction[]
  addAdviceRequest: (
    input: AdviceRequestInput,
  ) => {
    reference: string
    action: KemsAction
  }
  completeAction: (id: string) => void
}

export const ActionsContext =
  createContext<ActionsContextValue | null>(
    null,
  )
