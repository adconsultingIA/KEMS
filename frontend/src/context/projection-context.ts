import { createContext } from "react"

export type ProjectionKey =
  | "direction"
  | "commercial"
  | "assurance"
  | "investissement"
  | "fiduciaire"
  | "technologies"

export type ProjectionContextValue = {
  activeContext: ProjectionKey
  canSwitchContext: boolean
  setActiveContext: (
    context: ProjectionKey,
  ) => void
}

export const ProjectionContext =
  createContext<
    ProjectionContextValue | null
  >(null)
