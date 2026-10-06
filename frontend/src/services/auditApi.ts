export type AuditEvent = {
  id: string

  actor_type: string

  actor_account_id: string | null
  actor_profile_id: string | null
  actor_contact_id: string | null

  actor_role_id: string | null
  actor_unit_id: string | null

  actor_name: string | null
  actor_role_name: string | null
  actor_unit_name: string | null

  effective_context: string

  action_type: string
  description: string | null

  entity_type: string
  entity_id: string | null

  contact_id: string | null
  organization_id: string | null
  action_id: string | null

  source_type: string
  source_entity_type: string | null
  source_entity_id: string | null

  before_data:
    Record<string, unknown>
    | null

  after_data:
    Record<string, unknown>
    | null

  request_id: string | null
  ip_address: string | null
  user_agent: string | null

  created_at: string
}


export type AuditFilters = {
  effectiveContext?: string
  actionType?: string
  actorType?: string
  sourceType?: string
  search?: string
  limit?: number
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

  return (
    "Impossible de charger "
    + "le journal d'audit."
  )
}


export async function listAuditEventsRequest(
  token: string,
  filters: AuditFilters = {},
): Promise<AuditEvent[]> {
  const params =
    new URLSearchParams()

  if (
    filters.effectiveContext
  ) {
    params.set(
      "effective_context",
      filters.effectiveContext,
    )
  }

  if (
    filters.actionType
  ) {
    params.set(
      "action_type",
      filters.actionType,
    )
  }

  if (
    filters.actorType
  ) {
    params.set(
      "actor_type",
      filters.actorType,
    )
  }

  if (
    filters.sourceType
  ) {
    params.set(
      "source_type",
      filters.sourceType,
    )
  }

  if (
    filters.search?.trim()
  ) {
    params.set(
      "search",
      filters.search.trim(),
    )
  }

  params.set(
    "limit",
    String(
      filters.limit
      ?? 200,
    ),
  )

  const response =
    await fetch(
      `${API_BASE_URL}/api/v1/core/audit-events?${params.toString()}`,
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


export async function getAuditEventRequest(
  token: string,
  eventId: string,
): Promise<AuditEvent> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/v1/core/audit-events/${eventId}`,
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
