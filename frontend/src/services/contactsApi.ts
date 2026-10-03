export type CoreContact = {
  id: string

  organization_id: string | null
  merged_into_contact_id: string | null

  first_name: string
  last_name: string

  job_title: string | null

  email: string | null
  phone: string | null
  linkedin_url: string | null

  decision_role: string

  source_type: string
  source_reference: string | null

  verification_status: string

  is_primary: boolean
  is_verified: boolean
  is_active: boolean

  notes: string | null

  collected_at: string | null
  last_verified_at: string | null

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
    // Response non JSON.
  }

  return (
    "Impossible de charger "
    + "le Contact Registry."
  )
}


export async function listContactsRequest(
  token: string,
  search?: string,
): Promise<CoreContact[]> {
  const params =
    new URLSearchParams()

  params.set(
    "active_only",
    "true",
  )

  if (search?.trim()) {
    params.set(
      "search",
      search.trim(),
    )
  }

  const response =
    await fetch(
      (
        `${API_BASE_URL}`
        + "/api/v1/core/contacts"
        + `?${params.toString()}`
      ),
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
