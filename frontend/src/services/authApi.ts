import type {
  AuthContextData,
} from "../context/auth-context"

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL
  ?? "http://127.0.0.1:8020"

type LoginResponse = {
  access_token: string
  token_type: string
  expires_at: string
  context: AuthContextData
}

async function parseError(
  response: Response,
): Promise<string> {
  try {
    const payload = await response.json()

    if (
      payload
      && typeof payload.detail === "string"
    ) {
      return payload.detail
    }
  } catch {
    // réponse non JSON
  }

  return "Une erreur est survenue."
}

export async function loginRequest(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    },
  )

  if (!response.ok) {
    throw new Error(
      await parseError(response),
    )
  }

  return response.json()
}

export async function meRequest(
  token: string,
): Promise<AuthContextData> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/auth/me`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  if (!response.ok) {
    throw new Error(
      await parseError(response),
    )
  }

  return response.json()
}

export async function logoutRequest(
  token: string,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/auth/logout`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  if (
    !response.ok
    && response.status !== 401
  ) {
    throw new Error(
      await parseError(response),
    )
  }
}
