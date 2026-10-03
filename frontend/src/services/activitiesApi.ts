export type ApiActivity = {
  id: string

  event_type: string
  title: string
  description: string | null

  context: string

  actor_type: string
  actor_profile_id: string | null
  actor_contact_id: string | null

  contact_id: string | null
  organization_id: string | null
  action_id: string | null

  source_type: string
  source_entity_type: string | null
  source_entity_id: string | null

  created_at: string
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

  return "Impossible de charger les activités."
}


export async function listActivitiesRequest(
  token: string,
  options?: {
    contactId?: string
    organizationId?: string
    context?: string
    actionId?: string
    eventType?: string
    limit?: number
  },
): Promise<ApiActivity[]> {
  const params =
    new URLSearchParams()

  if (
    options?.contactId
  ) {
    params.set(
      "contact_id",
      options.contactId,
    )
  }

  if (
    options?.organizationId
  ) {
    params.set(
      "organization_id",
      options.organizationId,
    )
  }

  if (
    options?.context
  ) {
    params.set(
      "context",
      options.context,
    )
  }

  if (
    options?.actionId
  ) {
    params.set(
      "action_id",
      options.actionId,
    )
  }

  if (
    options?.eventType
  ) {
    params.set(
      "event_type",
      options.eventType,
    )
  }

  if (
    options?.limit
  ) {
    params.set(
      "limit",
      String(
        options.limit,
      ),
    )
  }

  const query =
    params.toString()

  const response =
    await fetch(
      `${API_BASE_URL}/api/v1/core/activities${
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
