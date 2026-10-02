import type {
  ReactNode,
} from "react"
import {
  Navigate,
  useLocation,
} from "react-router-dom"
import { useAuth } from "../../hooks/useAuth"

type Props = {
  children: ReactNode
  accountType?: "internal" | "client"
}

export function ProtectedRoute({
  children,
  accountType,
}: Props) {
  const {
    auth,
    loading,
  } = useAuth()

  const location = useLocation()

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-mark">
          K
        </div>

        <span>
          Chargement de KEMS…
        </span>
      </div>
    )
  }

  if (!auth) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    )
  }

  if (
    accountType
    && auth.account_type
      !== accountType
  ) {
    return (
      <Navigate
        to={
          auth.account_type
            === "client"
            ? "/client"
            : "/hub"
        }
        replace
      />
    )
  }

  return children
}
