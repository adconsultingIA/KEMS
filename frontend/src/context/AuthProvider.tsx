import {
  useEffect,
  useState,
} from "react"
import type {
  ReactNode,
} from "react"
import {
  AuthContext,
} from "./auth-context"
import type {
  AuthContextData,
} from "./auth-context"
import {
  loginRequest,
  logoutRequest,
  meRequest,
} from "../services/authApi"

const STORAGE_KEY =
  "kems-auth-token"

type Props = {
  children: ReactNode
}

export function AuthProvider({
  children,
}: Props) {
  const [auth, setAuth] =
    useState<AuthContextData | null>(
      null,
    )

  const [token, setToken] =
    useState<string | null>(
      () =>
        localStorage.getItem(
          STORAGE_KEY,
        ),
    )

  const [loading, setLoading] =
    useState(true)

  useEffect(() => {
    let active = true

    async function restoreSession() {
      if (!token) {
        if (active) {
          setAuth(null)
          setLoading(false)
        }

        return
      }

      try {
        const context =
          await meRequest(token)

        if (active) {
          setAuth(context)
        }
      } catch {
        localStorage.removeItem(
          STORAGE_KEY,
        )

        if (active) {
          setToken(null)
          setAuth(null)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    restoreSession()

    return () => {
      active = false
    }
  }, [token])

  async function login(
    email: string,
    password: string,
  ) {
    const result =
      await loginRequest(
        email,
        password,
      )

    localStorage.setItem(
      STORAGE_KEY,
      result.access_token,
    )

    setToken(
      result.access_token,
    )

    setAuth(
      result.context,
    )

    return result.context
  }

  async function logout() {
    if (token) {
      try {
        await logoutRequest(token)
      } catch {
        // La session locale doit être
        // supprimée même si l'API échoue.
      }
    }

    localStorage.removeItem(
      STORAGE_KEY,
    )

    setToken(null)
    setAuth(null)
  }

  return (
    <AuthContext.Provider
      value={{
        auth,
        token,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
