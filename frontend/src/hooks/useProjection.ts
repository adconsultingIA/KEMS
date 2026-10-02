import { useContext } from "react"
import {
  ProjectionContext,
} from "../context/projection-context"

export function useProjection() {
  const context =
    useContext(ProjectionContext)

  if (!context) {
    throw new Error(
      "useProjection doit être utilisé dans ProjectionProvider.",
    )
  }

  return context
}
