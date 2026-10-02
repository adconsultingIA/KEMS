export type ActionStatus =
  | "todo"
  | "in_progress"
  | "blocked"
  | "done"
  | "cancelled"

export type ActionPriority =
  | "low"
  | "medium"
  | "high"
  | "critical"

export type ApiAction = {
  id: string

  title: string
  description: string | null

  status: ActionStatus
  priority: ActionPriority
  context: string

  owner_profile_id: string | null
  unit_id: string | null

  contact_id: string | null
  organization_id: string | null

  source_type: string
  source_entity_type: string | null
  source_entity_id: string | null

  created_by_profile_id: string | null

  due_at: string | null
  completed_at: string | null

  created_at: string
  updated_at: string
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL
  ?? "http://127.0.0.1:8020"

async function parseError(
  response: Response,
): Promise<string> {
  try {
    const payload =
      await response.json()

    if (
      payload
      && typeof payload.detail
        === "string"
    ) {
      return payload.detail
    }
  } catch {
    // Réponse non JSON.
  }

  return "Une erreur est survenue."
}

export async function listActionsRequest(
  token: string,
  context?: string,
): Promise<ApiAction[]> {
  const params =
    new URLSearchParams()

  if (context) {
    params.set(
      "context",
      context,
    )
  }

  const query =
    params.toString()

  const response =
    await fetch(
      `${API_BASE_URL}/api/v1/core/actions${
        query
          ? `?${query}`
          : ""
      }`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      },
    )

  if (!response.ok) {
    throw new Error(
      await parseError(
        response,
      ),
    )
  }

  return response.json()
}

export async function updateActionRequest(
  token: string,
  actionId: string,
  payload: Partial<
    Pick<
      ApiAction,
      | "status"
      | "priority"
      | "title"
      | "description"
    >
  >,
): Promise<ApiAction> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/v1/core/actions/${actionId}`,
      {
        method: "PATCH",
        headers: {
          Authorization:
            `Bearer ${token}`,
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify(
          payload,
        ),
      },
    )

  if (!response.ok) {
    throw new Error(
      await parseError(
        response,
      ),
    )
  }

  return response.json()
}


export type ClientAdviceRequestPayload = {
  domain: string
  subject: string
  description: string
  urgency:
    | "low"
    | "normal"
    | "urgent"
}


export type ClientAdviceRequestResponse = {
  reference: string
  action: ApiAction
}


export async function createClientAdviceRequest(
  token: string,
  payload:
    ClientAdviceRequestPayload,
): Promise<ClientAdviceRequestResponse> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/v1/client/actions/advice-request`,
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${token}`,
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify(
          payload,
        ),
      },
    )

  if (!response.ok) {
    throw new Error(
      await parseError(
        response,
      ),
    )
  }

  return response.json()
}
