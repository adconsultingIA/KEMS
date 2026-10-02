export type Client720Contact = {
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


export type Client720Organization = {
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


export type Client720DataQuality = {
  verification_status: string
  is_verified: boolean

  has_email: boolean
  has_phone: boolean
  has_job_title: boolean
  has_organization: boolean

  completeness_score: number
}


export type Client720Projection = {
  contact: Client720Contact
  organization: Client720Organization | null
  data_quality: Client720DataQuality
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
    + "le Client 720°."
  )
}


export async function getClient720Request(
  token: string,
  contactId: string,
): Promise<Client720Projection> {
  const response =
    await fetch(
      (
        `${API_BASE_URL}`
        + `/api/v1/core/contacts/${contactId}/720`
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
