import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"

import type {
  ReactNode,
} from "react"

import {
  ActionsContext,
  type AdviceRequestInput,
} from "./actions-context"

import {
  createClientAdviceRequest,
  listActionsRequest,
  updateActionRequest,
} from "../services/actionsApi"

import type {
  ApiAction,
} from "../services/actionsApi"

import {
  useAuth,
} from "../hooks/useAuth"

import {
  useProjection,
} from "../hooks/useProjection"




export function ActionsProvider({
  children,
}: {
  children: ReactNode
}) {
  const {
    auth,
    token,
  } = useAuth()

  const {
    activeContext,
  } = useProjection()

  const [
    actions,
    setActions,
  ] =
    useState<ApiAction[]>([])

  const [
    loading,
    setLoading,
  ] =
    useState(false)

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    )


  const refreshActions =
    useCallback(
      async () => {
        if (
          !token
          || auth?.account_type
            !== "internal"
        ) {
          setActions([])
          setError(null)

          return
        }

        try {
          setLoading(true)
          setError(null)

          const context =
            activeContext
              === "direction"
              ? undefined
              : activeContext

          const result =
            await listActionsRequest(
              token,
              context,
            )

          setActions(
            result,
          )
        } catch (
          caught
        ) {
          setError(
            caught instanceof Error
              ? caught.message
              : (
                "Impossible de charger "
                + "les actions."
              ),
          )
        } finally {
          setLoading(false)
        }
      },
      [
        activeContext,
        auth?.account_type,
        token,
      ],
    )


  useEffect(
    () => {
      if (
        !token
        || auth?.account_type
          !== "internal"
      ) {
        return
      }

      let cancelled = false

      const context =
        activeContext
          === "direction"
          ? undefined
          : activeContext

      void listActionsRequest(
        token,
        context,
      )
        .then(
          (
            result,
          ) => {
            if (cancelled) {
              return
            }

            setActions(
              result,
            )

            setError(null)
          },
        )
        .catch(
          (
            caught,
          ) => {
            if (cancelled) {
              return
            }

            setError(
              caught instanceof Error
                ? caught.message
                : (
                  "Impossible de charger "
                  + "les actions."
                ),
            )
          },
        )
        .finally(
          () => {
            if (!cancelled) {
              setLoading(false)
            }
          },
        )

      return () => {
        cancelled = true
      }
    },
    [
      activeContext,
      auth?.account_type,
      token,
    ],
  )


  const completeAction =
    useCallback(
      async (
        id: string,
      ) => {
        if (!token) {
          return
        }

        const updated =
          await updateActionRequest(
            token,
            id,
            {
              status: "done",
            },
          )

        setActions(
          (
            current,
          ) =>
            current.map(
              (
                action,
              ) =>
                action.id
                  === updated.id
                  ? updated
                  : action,
            ),
        )
      },
      [
        token,
      ],
    )


  const addAdviceRequest =
    useCallback(
      async (
        input:
          AdviceRequestInput,
      ) => {
        if (
          !token
          || auth?.account_type
            !== "client"
        ) {
          throw new Error(
            "Session client invalide.",
          )
        }

        const result =
          await createClientAdviceRequest(
            token,
            {
              domain:
                input.domain,
              subject:
                input.subject,
              description:
                input.description,
              urgency:
                input.urgency
                  === "urgent"
                  ? "urgent"
                  : input.urgency
                      === "low"
                    ? "low"
                    : "normal",
            },
          )

        return {
          reference:
            result.reference,
        }
      },
      [
        auth?.account_type,
        token,
      ],
    )


  const value =
    useMemo(
      () => ({
        actions,
        loading,
        error,
        refreshActions,
        completeAction,
        addAdviceRequest,
      }),
      [
        actions,
        loading,
        error,
        refreshActions,
        completeAction,
        addAdviceRequest,
      ],
    )


  return (
    <ActionsContext.Provider
      value={value}
    >
      {children}
    </ActionsContext.Provider>
  )
}
