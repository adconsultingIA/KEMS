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


const CLIENT_REQUEST_KEY =
  "kems-client-demo-requests"


function generateReference() {
  const timestamp =
    Date.now()
      .toString()
      .slice(-6)

  return `KEMS-REQ-${timestamp}`
}


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


  function addAdviceRequest(
    input:
      AdviceRequestInput,
  ) {
    const reference =
      generateReference()

    const stored =
      localStorage.getItem(
        CLIENT_REQUEST_KEY,
      )

    let current:
      unknown[] = []

    if (stored) {
      try {
        current =
          JSON.parse(
            stored,
          )
      } catch {
        current = []
      }
    }

    localStorage.setItem(
      CLIENT_REQUEST_KEY,
      JSON.stringify(
        [
          {
            reference,
            ...input,
            createdAt:
              new Date()
                .toISOString(),
          },
          ...current,
        ],
      ),
    )

    return {
      reference,
    }
  }


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
