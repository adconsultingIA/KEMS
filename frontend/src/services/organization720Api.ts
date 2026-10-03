export type Organization720Organization = {
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


export type Organization720Contact = {
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


export type Organization720Relationship = {
  id: string

  contact_id: string
  organization_id: string

  relationship_type: string

  job_title: string | null
  relationship_role: string | null

  is_primary: boolean
  is_active: boolean

  started_at: string | null
  ended_at: string | null

  created_at: string
  updated_at: string
}


export type Organization720ContactRelation = {
  contact: Organization720Contact

  relationship:
    Organization720Relationship
    | null
}


export type Organization720ContactSummary = {
  total_contacts: number

  active_relations: number
  historical_relations: number

  decision_makers: number

  has_multiple_active_contacts: boolean
}


export type Organization720DataQuality = {
  verification_status: string
  is_verified: boolean

  has_legal_name: boolean
  has_industry: boolean
  has_website: boolean
  has_email: boolean
  has_phone: boolean
  has_country: boolean
  has_city: boolean
  has_address: boolean

  completeness_score: number

  missing_fields: string[]
}


export type Organization720Provenance = {
  source_type: string
  source_reference: string | null

  collected_at: string | null
  last_verified_at: string | null
}


export type Organization720CommercialSummary = {
  accessible: boolean

  leads: number
  qualified_leads: number

  opportunities: number
  active_opportunities: number

  pipeline_by_currency:
    Record<string, number>
}


export type Organization720BusinessContextSummary = {
  context: string
  accessible: boolean

  active_actions: number
  total_actions: number

  module_connected: boolean
}


export type Organization720BusinessSummary = {
  commercial:
    Organization720CommercialSummary

  assurance:
    Organization720BusinessContextSummary

  investissement:
    Organization720BusinessContextSummary

  fiduciaire:
    Organization720BusinessContextSummary

  technologies:
    Organization720BusinessContextSummary
}


export type Organization720Projection = {
  organization:
    Organization720Organization

  contacts:
    Organization720ContactRelation[]

  contact_summary:
    Organization720ContactSummary

  data_quality:
    Organization720DataQuality

  provenance:
    Organization720Provenance

  business_summary:
    Organization720BusinessSummary
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
    + "l'Organization 720°."
  )
}


export async function getOrganization720Request(
  token: string,
  organizationId: string,
): Promise<Organization720Projection> {
  const response =
    await fetch(
      (
        `${API_BASE_URL}`
        + "/api/v1/core/organizations/"
        + `${organizationId}/720`
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
