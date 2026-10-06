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


export type Client720RelationLink = {
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


export type Client720Relation = {
  relationship: Client720RelationLink
  organization: Client720Organization
}


export type Client720CommercialSummary = {
  leads: number
  qualified_leads: number

  opportunities: number
  active_opportunities: number

  pipeline_by_currency: Record<
    string,
    number
  >
}


export type Client720BusinessContextSummary = {
  context: string

  active_actions: number
  total_actions: number

  module_connected: boolean
}


export type Client720BusinessSummary = {
  commercial: Client720CommercialSummary

  assurance: Client720BusinessContextSummary
  investissement: Client720BusinessContextSummary
  fiduciaire: Client720BusinessContextSummary
  technologies: Client720BusinessContextSummary
}


export type Client720AffiliationSummary = {
  total_relations: number
  active_relations: number
  historical_relations: number

  primary_organization_id: string | null

  has_multiple_active_affiliations: boolean
}


export type Client720DataQuality = {
  verification_status: string
  is_verified: boolean

  has_email: boolean
  has_phone: boolean
  has_job_title: boolean
  has_organization: boolean

  completeness_score: number
  missing_fields: string[]
}


export type Client720Provenance = {
  contact_source_type: string
  contact_source_reference: string | null

  contact_collected_at: string | null
  contact_last_verified_at: string | null

  organization_source_type: string | null
  organization_source_reference: string | null

  organization_collected_at: string | null
  organization_last_verified_at: string | null
}


export type Client720Projection = {
  contact: Client720Contact
  organization: Client720Organization | null
  relations: Client720Relation[]
  affiliation_summary: Client720AffiliationSummary
  business_summary: Client720BusinessSummary

  data_quality: Client720DataQuality
  provenance: Client720Provenance
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
