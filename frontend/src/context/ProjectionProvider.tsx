import {
  useCallback,
  useMemo,
  useState,
} from "react"
import type {
  ReactNode,
} from "react"
import {
  ProjectionContext,
} from "./projection-context"
import type {
  ProjectionKey,
} from "./projection-context"
import { useAuth } from "../hooks/useAuth"

type Props = {
  children: ReactNode
}

const VALID_CONTEXTS:
  ProjectionKey[] = [
    "direction",
    "commercial",
    "assurance",
    "investissement",
    "fiduciaire",
    "technologies",
  ]

function isProjectionKey(
  value: string | null | undefined,
): value is ProjectionKey {
  return Boolean(
    value
    && VALID_CONTEXTS.includes(
      value as ProjectionKey,
    ),
  )
}

export function ProjectionProvider({
  children,
}: Props) {
  const {
    auth,
  } = useAuth()

  const authProjection =
    isProjectionKey(
      auth?.projection,
    )
      ? auth.projection
      : "direction"

  const canSwitchContext =
    auth?.account_type === "internal"
    && authProjection === "direction"

  const storageKey =
    auth?.account_id
      ? `kems-projection-${auth.account_id}`
      : null

  const initialContext = (() => {
    if (!auth) {
      return "direction" as ProjectionKey
    }

    if (!canSwitchContext) {
      return authProjection
    }

    if (!storageKey) {
      return "direction" as ProjectionKey
    }

    const stored =
      sessionStorage.getItem(
        storageKey,
      )

    return isProjectionKey(stored)
      ? stored
      : "direction"
  })()

  const [
    selectedContext,
    setSelectedContext,
  ] = useState<ProjectionKey>(
    initialContext,
  )

  const activeContext =
    !auth
      ? "direction"
      : canSwitchContext
        ? selectedContext
        : authProjection

  const setActiveContext =
    useCallback(
      (
        context: ProjectionKey,
      ) => {
        if (
          !canSwitchContext
          && context
            !== authProjection
        ) {
          return
        }

        setSelectedContext(
          context,
        )

        if (
          canSwitchContext
          && storageKey
        ) {
          sessionStorage.setItem(
            storageKey,
            context,
          )
        }
      },
      [
        authProjection,
        canSwitchContext,
        storageKey,
      ],
    )

  const value =
    useMemo(
      () => ({
        activeContext,
        canSwitchContext,
        setActiveContext,
      }),
      [
        activeContext,
        canSwitchContext,
        setActiveContext,
      ],
    )

  return (
    <ProjectionContext.Provider
      value={value}
    >
      {children}
    </ProjectionContext.Provider>
  )
}
