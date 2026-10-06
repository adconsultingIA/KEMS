export type LeadStatus =
  | "new"
  | "contacted"
  | "qualifying"
  | "qualified"
  | "disqualified"
  | "converted_to_opportunity"


export type LeadType =
  | "b2c"
  | "b2b"


export type GrowthLead = {
  id: string

  lead_type: LeadType

  first_name: string | null
  last_name: string | null
  company_name: string | null

  email: string | null
  phone: string | null

  city: string | null
  country: string | null

  organization_id: string | null
  contact_id: string | null
  owner_id: string | null

  source: string
  source_detail: string | null

  status: LeadStatus

  need_summary: string | null
  estimated_value: number | null
  currency: string
  urgency: string

  fit_score: number
  intent_score: number
  engagement_score: number
  potential_score: number

  growth_score: number

  qualification_notes: string | null

  contacted_at: string | null
  qualification_started_at: string | null
  qualified_at: string | null
  disqualified_at: string | null
  core_converted_at: string | null

  disqualified_reason: string | null

  created_at: string
  updated_at: string
}


export type OpportunityStage =
  | "qualified"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost"


export type GrowthOpportunity = {
  id: string

  lead_id: string
  organization_id: string | null
  primary_contact_id: string | null
  owner_id: string | null

  name: string
  description: string | null

  stage: OpportunityStage

  estimated_value: number | null
  currency: string

  probability: number
  expected_close_date: string | null

  won_at: string | null
  lost_at: string | null
  lost_reason: string | null

  created_at: string
  updated_at: string
}


export type QualificationPayload = {
  fit_score?: number
  intent_score?: number
  engagement_score?: number
  potential_score?: number

  need_summary?: string | null
  estimated_value?: number | null
  currency?: string
  urgency?: string
  qualification_notes?: string | null
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

    if (
      payload
      && Array.isArray(
        payload.detail,
      )
    ) {
      return payload.detail
        .map(
          (
            item: {
              msg?: string
            },
          ) =>
            item.msg
            ?? "Erreur de validation",
        )
        .join(", ")
    }
  } catch {
    // Non JSON response.
  }

  return "Une erreur est survenue."
}


function authHeaders(
  token: string | null,
): Record<string, string> {
  if (!token) {
    return {}
  }

  return {
    Authorization:
      `Bearer ${token}`,
  }
}


export async function listLeadsRequest(
  token: string | null,
): Promise<GrowthLead[]> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/v1/leads`,
      {
        headers:
          authHeaders(
            token,
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


export async function markLeadContactedRequest(
  token: string | null,
  leadId: string,
): Promise<GrowthLead> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/v1/leads/${leadId}/contacted`,
      {
        method: "POST",
        headers:
          authHeaders(
            token,
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


export async function startLeadQualificationRequest(
  token: string | null,
  leadId: string,
): Promise<GrowthLead> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/v1/leads/${leadId}/qualification/start`,
      {
        method: "POST",
        headers:
          authHeaders(
            token,
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


export async function updateLeadQualificationRequest(
  token: string | null,
  leadId: string,
  payload:
    QualificationPayload,
): Promise<GrowthLead> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/v1/leads/${leadId}/qualification`,
      {
        method: "PATCH",
        headers: {
          ...authHeaders(
            token,
          ),
          "Content-Type":
            "application/json",
        },
        body:
          JSON.stringify(
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


export async function qualifyLeadRequest(
  token: string | null,
  leadId: string,
  payload:
    QualificationPayload = {},
): Promise<GrowthLead> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/v1/leads/${leadId}/qualify`,
      {
        method: "POST",
        headers: {
          ...authHeaders(
            token,
          ),
          "Content-Type":
            "application/json",
        },
        body:
          JSON.stringify(
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


export async function convertLeadToCoreRequest(
  token: string | null,
  leadId: string,
) {
  const response =
    await fetch(
      `${API_BASE_URL}/api/v1/leads/${leadId}/convert-to-core`,
      {
        method: "POST",
        headers:
          authHeaders(
            token,
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


export async function listOpportunitiesRequest(
  token: string | null,
): Promise<
  GrowthOpportunity[]
> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/v1/opportunities`,
      {
        headers:
          authHeaders(
            token,
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


export async function changeOpportunityStageRequest(
  token: string | null,
  opportunityId: string,
  stage: OpportunityStage,
  lostReason?: string,
): Promise<GrowthOpportunity> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/v1/opportunities/${opportunityId}/stage`,
      {
        method: "POST",
        headers: {
          ...authHeaders(
            token,
          ),
          "Content-Type":
            "application/json",
        },
        body:
          JSON.stringify({
            stage,
            lost_reason:
              lostReason
              ?? null,
          }),
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


export type CreateLeadPayload = {
  lead_type: LeadType

  first_name?: string | null
  last_name?: string | null
  company_name?: string | null

  email?: string | null
  phone?: string | null

  city?: string | null
  country?: string | null

  source: string
  source_detail?: string | null

  need_summary?: string | null

  estimated_value?: number | null
  currency?: string
  urgency?: string
}


export async function createLeadRequest(
  token: string | null,
  payload: CreateLeadPayload,
): Promise<GrowthLead> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/v1/leads`,
      {
        method: "POST",
        headers: {
          ...authHeaders(
            token,
          ),
          "Content-Type":
            "application/json",
        },
        body:
          JSON.stringify(
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


export async function disqualifyLeadRequest(
  token: string | null,
  leadId: string,
  reason: string,
): Promise<GrowthLead> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/v1/leads/${leadId}/disqualify`,
      {
        method: "POST",
        headers: {
          ...authHeaders(
            token,
          ),
          "Content-Type":
            "application/json",
        },
        body:
          JSON.stringify({
            reason,
          }),
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


export async function reopenLeadRequest(
  token: string | null,
  leadId: string,
): Promise<GrowthLead> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/v1/leads/${leadId}/reopen`,
      {
        method: "POST",
        headers:
          authHeaders(
            token,
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


export async function returnLeadToQualificationRequest(
  token: string | null,
  leadId: string,
): Promise<GrowthLead> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/v1/leads/${leadId}/return-to-qualification`,
      {
        method: "POST",
        headers:
          authHeaders(
            token,
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


export type CreateOpportunityPayload = {
  lead_id: string
  name: string

  description?: string | null

  estimated_value?: number | null
  currency?: string | null

  probability?: number

  expected_close_date?: string | null
}


export async function createOpportunityRequest(
  token: string | null,
  payload: CreateOpportunityPayload,
): Promise<GrowthOpportunity> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/v1/opportunities`,
      {
        method: "POST",
        headers: {
          ...authHeaders(
            token,
          ),
          "Content-Type":
            "application/json",
        },
        body:
          JSON.stringify(
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


export type HandoffTargetUnit = {
  id: string
  name: string
  code: string
  unit_type: string
}


export type OpportunityHandoff = {
  id: string

  opportunity_id: string
  target_unit_id: string

  status:
    | "handed_off"
    | "accepted"
    | "in_progress"
    | "completed"

  handed_off_at: string
  handed_off_by_profile_id: string | null

  accepted_at: string | null
  accepted_by_profile_id: string | null

  started_at: string | null
  completed_at: string | null

  notes: string | null

  created_at: string
  updated_at: string

  target_unit: HandoffTargetUnit
}


export async function listHandoffTargetsRequest(
  token: string | null,
): Promise<HandoffTargetUnit[]> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/v1/handoff-targets`,
      {
        headers:
          authHeaders(
            token,
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

  const payload = await response.json()

  return payload.items ?? []
}


export async function getOpportunityHandoffRequest(
  token: string | null,
  opportunityId: string,
): Promise<OpportunityHandoff | null> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/v1/opportunities/${opportunityId}/handoff`,
      {
        headers:
          authHeaders(
            token,
          ),
      },
    )

  if (
    response.status
    === 404
  ) {
    return null
  }

  if (!response.ok) {
    throw new Error(
      await parseError(
        response,
      ),
    )
  }

  return response.json()
}


export async function createOpportunityHandoffRequest(
  token: string | null,
  opportunityId: string,
  payload: {
    target_unit_id: string
    notes?: string | null
  },
): Promise<OpportunityHandoff> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/v1/opportunities/${opportunityId}/handoff`,
      {
        method: "POST",
        headers: {
          ...authHeaders(
            token,
          ),
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


export async function listHandoffsRequest(
  token: string | null,
): Promise<OpportunityHandoff[]> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/v1/handoffs`,
      {
        headers:
          authHeaders(
            token,
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

  const payload =
    await response.json()

  if (
    Array.isArray(
      payload,
    )
  ) {
    return payload
  }

  return payload.items ?? []
}


export type OpportunityHandoffStatus =
  | "handed_off"
  | "accepted"
  | "in_progress"
  | "completed"


export async function updateOpportunityHandoffStatusRequest(
  token: string | null,
  opportunityId: string,
  status: OpportunityHandoffStatus,
): Promise<OpportunityHandoff> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/v1/opportunities/${opportunityId}/handoff/status`,
      {
        method: "POST",
        headers: {
          ...authHeaders(
            token,
          ),
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          status,
        }),
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

