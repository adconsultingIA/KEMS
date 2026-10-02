import { createContext } from "react"

export type AuthRole = {
  id: string
  code: string
  name: string
}

export type AuthUnit = {
  id: string
  code: string
  name: string
}

export type AuthMembership = {
  id: string
  role: AuthRole
  unit: AuthUnit
  is_primary: boolean
}

export type AuthProfile = {
  id: string
  full_name: string
  email: string
}

export type AuthContact = {
  id: string
  first_name: string
  last_name: string
  email: string | null
}

export type AuthContextData = {
  account_id: string
  account_type: "internal" | "client"
  email: string
  projection: string
  profile: AuthProfile | null
  contact: AuthContact | null
  role: AuthRole | null
  primary_unit: AuthUnit | null
  memberships: AuthMembership[]
}

export type AuthContextValue = {
  auth: AuthContextData | null
  token: string | null
  loading: boolean
  login: (
    email: string,
    password: string,
  ) => Promise<AuthContextData>
  logout: () => Promise<void>
}

export const AuthContext =
  createContext<AuthContextValue | null>(
    null,
  )
