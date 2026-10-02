import { useContext } from "react"
import { ActionsContext } from "../context/actions-context"

export function useActions() {
  const context = useContext(
    ActionsContext,
  )

  if (!context) {
    throw new Error(
      "useActions must be used inside ActionsProvider",
    )
  }

  return context
}
