export type CoreOrganization = {
  id: string

  name: string
  legal_name: string | null

  organization_type: string
  industry: string | null

  website: string | null
  domain: string | null

  email: string | null
  phone: string | null

  country: string | null
  city: string | null
  address: string | null

  source_type: string
  source_reference: string | null

  verification_status: string
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
    + "les organisations."
  )
}


export async function listOrganizationsRequest(
  token: string,
): Promise<CoreOrganization[]> {
  const response =
    await fetch(
      (
        `${API_BASE_URL}`
        + "/api/v1/core/organizations"
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
