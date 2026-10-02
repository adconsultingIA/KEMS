import {
  createContext,
} from "react"

import type {
  ApiAction,
} from "../services/actionsApi"


export type AdviceRequestInput = {
  entity: string
  domain: string
  subject: string
  description: string
  urgency: string
}


export type AdviceRequestResult = {
  reference: string
}


export type ActionsContextValue = {
  actions: ApiAction[]

  loading: boolean
  error: string | null

  refreshActions:
    () => Promise<void>

  completeAction:
    (
      id: string,
    ) => Promise<void>

  addAdviceRequest:
    (
      input:
        AdviceRequestInput,
    ) => Promise<
      AdviceRequestResult
    >
}


export const ActionsContext =
  createContext<
    ActionsContextValue | null
  >(null)
