import {
  ArrowRight,
  Building2,
  DatabaseZap,
  FileSpreadsheet,
  Globe2,
  Import,
  MousePointerClick,
  Radar,
  CheckCircle2,
  CircleDollarSign,
  Filter,
  Handshake,
  Mail,
  MapPin,
  Phone,
  LayoutDashboard,
  Plus,
  RefreshCw,
  X,
  Search,
  Target,
  TrendingUp,
  UserRound,
  UsersRound,
} from "lucide-react"

import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  useAuth,
} from "../../hooks/useAuth"

import CreateOpportunityModal from "../../components/growth/CreateOpportunityModal"
import GrowthHandoffsView from "../../components/growth/GrowthHandoffsView"
import OpportunityHandoffSummary from "../../components/growth/OpportunityHandoffSummary"
import {
  changeOpportunityStageRequest,
  convertLeadToCoreRequest,
  disqualifyLeadRequest,
  reopenLeadRequest,
  returnLeadToQualificationRequest,
  updateLeadQualificationRequest,
  createLeadRequest,
  listLeadsRequest,
  listOpportunitiesRequest,
  listHandoffsRequest,
  markLeadContactedRequest,
  qualifyLeadRequest,
  startLeadQualificationRequest,
} from "../../services/growthApi"

import type {
  GrowthLead,
  GrowthOpportunity,
  OpportunityHandoff,
  LeadStatus,
  OpportunityStage,
} from "../../services/growthApi"


type GrowthView =
  | "dashboard"
  | "acquisition"
  | "leads"
  | "qualification"
  | "pipeline"
  | "opportunities"
  | "handoffs"


const PIPELINE_STAGES:
  OpportunityStage[] = [
    "qualified",
    "proposal",
    "negotiation",
  ]


function leadLabel(
  lead: GrowthLead,
) {
  if (
    lead.lead_type
    === "b2b"
  ) {
    return (
      lead.company_name
      ?? [
        lead.first_name,
        lead.last_name,
      ]
        .filter(Boolean)
        .join(" ")
      ?? "Lead B2B"
    )
  }

  const name = [
    lead.first_name,
    lead.last_name,
  ]
    .filter(Boolean)
    .join(" ")

  return (
    name
    || lead.email
    || lead.phone
    || "Lead sans nom"
  )
}


function leadStatusLabel(
  status: LeadStatus,
) {
  const labels:
    Record<
      LeadStatus,
      string
    > = {
    new: "Nouveau",
    contacted: "Contacté",
    qualifying:
      "Qualification",
    qualified: "Qualifié",
    disqualified:
      "Disqualifié",
    converted_to_opportunity:
      "Converti",
  }

  return labels[
    status
  ]
}


function stageLabel(
  stage:
    OpportunityStage,
) {
  const labels:
    Record<
      OpportunityStage,
      string
    > = {
    qualified:
      "Qualifiée",
    proposal:
      "Proposition",
    negotiation:
      "Négociation",
    won:
      "Gagnée",
    lost:
      "Perdue",
  }

  return labels[
    stage
  ]
}


function formatMoney(
  value: number | null,
  currency: string,
) {
  if (
    value === null
    || Number.isNaN(
      value,
    )
  ) {
    return "—"
  }

  try {
    return new Intl
      .NumberFormat(
        "fr-CH",
        {
          style:
            "currency",
          currency,
          maximumFractionDigits:
            0,
        },
      )
      .format(value)
  } catch {
    return (
      `${value.toLocaleString(
        "fr-CH",
      )} ${currency}`
    )
  }
}


function formatDate(
  value: string | null,
) {
  if (!value) {
    return "—"
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value
  }

  return new Intl
    .DateTimeFormat(
      "fr-CH",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      },
    )
    .format(date)
}


function scoreTone(
  score: number,
) {
  if (
    score >= 75
  ) {
    return "high"
  }

  if (
    score >= 50
  ) {
    return "medium"
  }

  return "low"
}


export function GrowthEnginePage() {
  const {
    token,
  } = useAuth()

  const [
    leads,
    setLeads,
  ] =
    useState<
      GrowthLead[]
    >([])

  const [
    opportunities,
    setOpportunities,
  ] =
    useState<
      GrowthOpportunity[]
    >([])

  const [
    activeView,
    setActiveView,
  ] =
    useState<
      GrowthView
    >(
      "dashboard",
    )

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null)

  const [
    search,
    setSearch,
  ] =
    useState("")

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<
      "all"
      | LeadStatus
    >(
      "all",
    )

  const [
    busyId,
    setBusyId,
  ] =
    useState<
      string | null
    >(null)

  const [
    opportunityLeadId,
    setOpportunityLeadId,
  ] =
    useState<
      string | null
    >(null)


  const [
    selectedLeadId,
    setSelectedLeadId,
  ] =
    useState<
      string | null
    >(null)

  const [
    disqualifyLeadId,
    setDisqualifyLeadId,
  ] =
    useState<
      string | null
    >(null)

  const [
    disqualifyReason,
    setDisqualifyReason,
  ] =
    useState("")

  const [
    disqualifySaving,
    setDisqualifySaving,
  ] =
    useState(false)


  const [
    qualificationLeadId,
    setQualificationLeadId,
  ] =
    useState<
      string | null
    >(null)

  const [
    qualificationSaving,
    setQualificationSaving,
  ] =
    useState(false)

  const [
    qualificationFit,
    setQualificationFit,
  ] =
    useState(0)

  const [
    qualificationIntent,
    setQualificationIntent,
  ] =
    useState(0)

  const [
    qualificationEngagement,
    setQualificationEngagement,
  ] =
    useState(0)

  const [
    qualificationPotential,
    setQualificationPotential,
  ] =
    useState(0)

  const [
    qualificationNotes,
    setQualificationNotes,
  ] =
    useState("")

  const [
    createLeadOpen,
    setCreateLeadOpen,
  ] =
    useState(false)

  const [
    createLeadLoading,
    setCreateLeadLoading,
  ] =
    useState(false)

  const [
    leadType,
    setLeadType,
  ] =
    useState<
      "b2c"
      | "b2b"
    >(
      "b2c",
    )

  const [
    firstName,
    setFirstName,
  ] =
    useState("")

  const [
    lastName,
    setLastName,
  ] =
    useState("")

  const [
    companyName,
    setCompanyName,
  ] =
    useState("")

  const [
    email,
    setEmail,
  ] =
    useState("")

  const [
    phone,
    setPhone,
  ] =
    useState("")

  const [
    city,
    setCity,
  ] =
    useState("")

  const [
    country,
    setCountry,
  ] =
    useState("CH")

  const [
    source,
    setSource,
  ] =
    useState("manual")

  const [
    sourceDetail,
    setSourceDetail,
  ] =
    useState("")

  const [
    needSummary,
    setNeedSummary,
  ] =
    useState("")

  const [
    estimatedValue,
    setEstimatedValue,
  ] =
    useState("")

  const [
    currency,
    setCurrency,
  ] =
    useState("CHF")

  const [
    urgency,
    setUrgency,
  ] =
    useState("medium")


  const [
    handoffs,
    setHandoffs,
  ] =
    useState<
      OpportunityHandoff[]
    >([])


  async function loadData() {
    setLoading(
      true,
    )

    setError(
      null,
    )

    try {
      const [
        leadData,
        opportunityData,
        handoffData,
      ] =
        await Promise.all([
          listLeadsRequest(
            token,
          ),
          listOpportunitiesRequest(
            token,
          ),
          listHandoffsRequest(
            token,
          ),
        ])

      setLeads(
        leadData,
      )

      setOpportunities(
        opportunityData,
      )

      setHandoffs(
        handoffData,
      )
    } catch (
      requestError
    ) {
      setError(
        requestError
          instanceof Error
          ? requestError.message
          : (
            "Impossible de charger "
            + "Growth Engine."
          ),
      )
    } finally {
      setLoading(
        false,
      )
    }
  }


  useEffect(
    () => {
      void loadData()
    },
    // Load once for the current
    // authenticated session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token],
  )


  useEffect(
    () => {
      if (
        activeView
        !== "pipeline"
      ) {
        return
      }

      let cancelled =
        false

      async function refreshHandoffs() {
        try {
          const data =
            await listHandoffsRequest(
              token,
            )

          if (!cancelled) {
            setHandoffs(
              data,
            )
          }
        } catch {
          // Le chargement général affiche déjà
          // les erreurs API pertinentes.
        }
      }

      void refreshHandoffs()

      return () => {
        cancelled =
          true
      }
    },
    [
      activeView,
      token,
    ],
  )


  const transmittedOpportunityIds =
    useMemo(
      () =>
        new Set(
          handoffs.map(
            handoff =>
              handoff.opportunity_id,
          ),
        ),
      [
        handoffs,
      ],
    )


  const visibleLeads =
    useMemo(
      () => {
        const term =
          search
            .trim()
            .toLowerCase()

        return leads
          .filter(
            (
              lead,
            ) =>
              statusFilter
                === "all"
              || lead.status
                === statusFilter,
          )
          .filter(
            (
              lead,
            ) => {
              if (!term) {
                return true
              }

              return [
                leadLabel(
                  lead,
                ),
                lead.email,
                lead.phone,
                lead.company_name,
                lead.source,
                lead.need_summary,
              ]
                .filter(Boolean)
                .some(
                  (
                    value,
                  ) =>
                    String(
                      value,
                    )
                      .toLowerCase()
                      .includes(
                        term,
                      ),
                )
            },
          )
      },
      [
        leads,
        search,
        statusFilter,
      ],
    )


  const disqualifyLead =
    disqualifyLeadId
      ? (
        leads.find(
          lead =>
            lead.id
            === disqualifyLeadId,
        )
        ?? null
      )
      : null


  const qualificationLead =
    qualificationLeadId
      ? (
        leads.find(
          lead =>
            lead.id
            === qualificationLeadId,
        )
        ?? null
      )
      : null

  const qualificationTotal =
    qualificationFit
    + qualificationIntent
    + qualificationEngagement
    + qualificationPotential


  const opportunityLead =
    opportunityLeadId
      ? (
        leads.find(
          lead =>
            lead.id
            === opportunityLeadId,
        )
        ?? null
      )
      : null


  const selectedLead =
    selectedLeadId
      ? (
        leads.find(
          lead =>
            lead.id
            === selectedLeadId,
        )
        ?? null
      )
      : null


  const qualificationLeads =
    leads.filter(
      (
        lead,
      ) =>
        [
          "contacted",
          "qualifying",
          "qualified",
        ].includes(
          lead.status,
        ),
    )


  const activeOpportunities =
    opportunities.filter(
      (
        opportunity,
      ) =>
        ![
          "won",
          "lost",
        ].includes(
          opportunity.stage,
        ),
    )


  const wonOpportunities =
    opportunities.filter(
      opportunity =>
        opportunity.stage
        === "won",
    )


  const lostOpportunities =
    opportunities.filter(
      opportunity =>
        opportunity.stage
        === "lost",
    )


  const wonOpportunityValue =
    wonOpportunities.reduce(
      (
        total,
        opportunity,
      ) =>
        total
        + (
          opportunity
            .estimated_value
          ?? 0
        ),
      0,
    )


  const lostOpportunityValue =
    lostOpportunities.reduce(
      (
        total,
        opportunity,
      ) =>
        total
        + (
          opportunity
            .estimated_value
          ?? 0
        ),
      0,
    )


  const qualifiedLeadCount =
    leads.filter(
      (
        lead,
      ) =>
        lead.status
          === "qualified",
    ).length


  const openPipelineValue =
    activeOpportunities
      .reduce(
        (
          total,
          opportunity,
        ) =>
          total
          + (
            opportunity
              .estimated_value
            ?? 0
          ),
        0,
      )


  const wonValue =
    opportunities
      .filter(
        (
          opportunity,
        ) =>
          opportunity.stage
            === "won",
      )
      .reduce(
        (
          total,
          opportunity,
        ) =>
          total
          + (
            opportunity
              .estimated_value
            ?? 0
          ),
        0,
      )


  function openDisqualification(
    leadId: string,
  ) {
    setDisqualifyLeadId(
      leadId,
    )

    setDisqualifyReason(
      "",
    )

    setError(
      null,
    )
  }


  function closeDisqualification() {
    if (
      disqualifySaving
    ) {
      return
    }

    setDisqualifyLeadId(
      null,
    )

    setDisqualifyReason(
      "",
    )
  }


  async function confirmDisqualification() {
    if (
      !disqualifyLead
    ) {
      return
    }

    const reason =
      disqualifyReason.trim()

    if (!reason) {
      setError(
        "Le motif de disqualification est obligatoire.",
      )

      return
    }

    setDisqualifySaving(
      true,
    )

    setError(
      null,
    )

    try {
      await disqualifyLeadRequest(
        token,
        disqualifyLead.id,
        reason,
      )

      await loadData()

      setDisqualifyLeadId(
        null,
      )

      setDisqualifyReason(
        "",
      )
    } catch (
      requestError
    ) {
      setError(
        requestError
          instanceof Error
          ? requestError.message
          : "Impossible de disqualifier le lead.",
      )
    } finally {
      setDisqualifySaving(
        false,
      )
    }
  }


  function clampQualificationScore(
    value: number,
  ) {
    if (
      Number.isNaN(
        value,
      )
    ) {
      return 0
    }

    return Math.min(
      25,
      Math.max(
        0,
        value,
      ),
    )
  }


  function openQualificationEditor(
    leadId: string,
  ) {
    const lead =
      leads.find(
        item =>
          item.id === leadId,
      )

    if (!lead) {
      return
    }

    setQualificationLeadId(
      lead.id,
    )

    setQualificationFit(
      lead.fit_score ?? 0,
    )

    setQualificationIntent(
      lead.intent_score ?? 0,
    )

    setQualificationEngagement(
      lead.engagement_score ?? 0,
    )

    setQualificationPotential(
      lead.potential_score ?? 0,
    )

    setQualificationNotes(
      lead.qualification_notes
      ?? "",
    )

    setError(
      null,
    )
  }


  function closeQualificationEditor() {
    if (
      qualificationSaving
    ) {
      return
    }

    setQualificationLeadId(
      null,
    )
  }


  async function saveQualification() {
    if (
      !qualificationLead
    ) {
      return
    }

    setQualificationSaving(
      true,
    )

    setError(
      null,
    )

    try {
      await updateLeadQualificationRequest(
        token,
        qualificationLead.id,
        {
          fit_score:
            qualificationFit,

          intent_score:
            qualificationIntent,

          engagement_score:
            qualificationEngagement,

          potential_score:
            qualificationPotential,

          qualification_notes:
            qualificationNotes.trim()
            || null,
        },
      )

      await loadData()

      setQualificationLeadId(
        null,
      )
    } catch (
      requestError
    ) {
      setError(
        requestError
          instanceof Error
          ? requestError.message
          : (
            "Impossible d'enregistrer "
            + "la qualification."
          ),
      )
    } finally {
      setQualificationSaving(
        false,
      )
    }
  }


  function openOpportunityCreation(
    leadId: string,
  ) {
    setOpportunityLeadId(
      leadId,
    )

    setError(
      null,
    )
  }


  function closeOpportunityCreation() {
    setOpportunityLeadId(
      null,
    )
  }


  async function handleOpportunityCreated() {
    setOpportunityLeadId(
      null,
    )

    setSelectedLeadId(
      null,
    )

    await loadData()

    setActiveView(
      "pipeline",
    )
  }


  function openLeadDetail(
    leadId: string,
  ) {
    setSelectedLeadId(
      leadId,
    )

    setError(
      null,
    )
  }


  function closeLeadDetail() {
    setSelectedLeadId(
      null,
    )
  }


  function resetLeadForm() {
    setLeadType(
      "b2c",
    )

    setFirstName("")
    setLastName("")
    setCompanyName("")

    setEmail("")
    setPhone("")

    setCity("")
    setCountry("CH")

    setSource("manual")
    setSourceDetail("")

    setNeedSummary("")
    setEstimatedValue("")

    setCurrency("CHF")
    setUrgency("medium")
  }


  function openCreateLead() {
    resetLeadForm()

    setError(
      null,
    )

    setCreateLeadOpen(
      true,
    )
  }


  function closeCreateLead() {
    if (
      createLeadLoading
    ) {
      return
    }

    setCreateLeadOpen(
      false,
    )
  }


  async function submitLead(
    event:
      React.FormEvent<
        HTMLFormElement
      >,
  ) {
    event.preventDefault()

    setError(
      null,
    )

    if (
      leadType === "b2c"
      && !(
        firstName.trim()
        || lastName.trim()
        || email.trim()
        || phone.trim()
      )
    ) {
      setError(
        "Un lead B2C doit avoir au moins un nom, un email ou un téléphone.",
      )

      return
    }

    if (
      leadType === "b2b"
      && !(
        companyName.trim()
        || email.trim()
        || phone.trim()
      )
    ) {
      setError(
        "Un lead B2B doit avoir au moins une entreprise, un email ou un téléphone.",
      )

      return
    }

    setCreateLeadLoading(
      true,
    )

    try {
      await createLeadRequest(
        token,
        {
          lead_type:
            leadType,

          first_name:
            firstName.trim()
            || null,

          last_name:
            lastName.trim()
            || null,

          company_name:
            companyName.trim()
            || null,

          email:
            email.trim()
            || null,

          phone:
            phone.trim()
            || null,

          city:
            city.trim()
            || null,

          country:
            country.trim()
            || null,

          source:
            source,

          source_detail:
            sourceDetail.trim()
            || null,

          need_summary:
            needSummary.trim()
            || null,

          estimated_value:
            estimatedValue.trim()
              ? Number(
                  estimatedValue,
                )
              : null,

          currency:
            currency,

          urgency:
            urgency,
        },
      )

      setCreateLeadOpen(
        false,
      )

      resetLeadForm()

      setActiveView(
        "leads",
      )

      await loadData()
    } catch (
      requestError
    ) {
      setError(
        requestError
          instanceof Error
          ? requestError.message
          : (
            "Impossible de créer "
            + "le lead."
          ),
      )
    } finally {
      setCreateLeadLoading(
        false,
      )
    }
  }


  async function runLeadAction(
    leadId: string,
    action:
      "contact"
      | "start"
      | "qualify"
      | "reopen"
      | "return_to_qualification"
      | "core",
  ) {
    setBusyId(
      leadId,
    )

    setError(
      null,
    )

    try {
      if (
        action
        === "contact"
      ) {
        await markLeadContactedRequest(
          token,
          leadId,
        )
      }

      if (
        action
        === "start"
      ) {
        await startLeadQualificationRequest(
          token,
          leadId,
        )
      }

      if (
        action
        === "qualify"
      ) {
        await qualifyLeadRequest(
          token,
          leadId,
        )
      }

      if (
        action
        === "reopen"
      ) {
        await reopenLeadRequest(
          token,
          leadId,
        )
      }


      if (
        action
        === "return_to_qualification"
      ) {
        await returnLeadToQualificationRequest(
          token,
          leadId,
        )
      }


      if (
        action
        === "core"
      ) {
        await convertLeadToCoreRequest(
          token,
          leadId,
        )
      }

      await loadData()
    } catch (
      requestError
    ) {
      setError(
        requestError
          instanceof Error
          ? requestError.message
          : (
            "Action impossible."
          ),
      )
    } finally {
      setBusyId(
        null,
      )
    }
  }


  async function advanceStage(
    opportunity:
      GrowthOpportunity,
    nextStage:
      OpportunityStage,
  ) {
    let lostReason:
      string | undefined

    if (
      nextStage
      === "lost"
    ) {
      lostReason =
        window.prompt(
          "Motif de perte",
        )
        ?? undefined

      if (
        !lostReason
        || !lostReason.trim()
      ) {
        return
      }
    }

    setBusyId(
      opportunity.id,
    )

    try {
      await changeOpportunityStageRequest(
        token,
        opportunity.id,
        nextStage,
        lostReason,
      )

      await loadData()
    } catch (
      requestError
    ) {
      setError(
        requestError
          instanceof Error
          ? requestError.message
          : (
            "Impossible de modifier "
            + "l'opportunité."
          ),
      )
    } finally {
      setBusyId(
        null,
      )
    }
  }


  function nextStage(
    stage:
      OpportunityStage,
  ):
    OpportunityStage | null {
    if (
      stage
      === "qualified"
    ) {
      return "proposal"
    }

    if (
      stage
      === "proposal"
    ) {
      return "negotiation"
    }

    if (
      stage
      === "negotiation"
    ) {
      return "won"
    }

    return null
  }


  return (
    <div className="page-stack growth-engine-page">

      <header className="page-header with-actions growth-header">
        <div>
          <span className="eyebrow">
            Commercial · Growth Engine
          </span>

          <h1>
            Growth Engine
          </h1>

          <p>
            Acquisition, qualification,
            conversion Core et pilotage
            des opportunités commerciales.
          </p>
        </div>

        <button
          type="button"
          className="button secondary"
          onClick={
            () =>
              void loadData()
          }
          disabled={
            loading
          }
        >
          <RefreshCw
            size={17}
          />

          Actualiser
        </button>
      </header>


      <nav className="growth-tabs">

        <button
          type="button"
          className={
            activeView
              === "dashboard"
              ? "active"
              : ""
          }
          onClick={
            () =>
              setActiveView(
                "dashboard",
              )
          }
        >
          <LayoutDashboard
            size={17}
          />
          Dashboard
        </button>

        <button
          type="button"
          className={
            activeView
              === "acquisition"
              ? "active"
              : ""
          }
          onClick={
            () =>
              setActiveView(
                "acquisition",
              )
          }
        >
          <Radar
            size={17}
          />
          Acquisition
        </button>

        <button
          type="button"
          className={
            activeView
              === "leads"
              ? "active"
              : ""
          }
          onClick={
            () =>
              setActiveView(
                "leads",
              )
          }
        >
          <UsersRound
            size={17}
          />
          Leads
        </button>

        <button
          type="button"
          className={
            activeView
              === "qualification"
              ? "active"
              : ""
          }
          onClick={
            () =>
              setActiveView(
                "qualification",
              )
          }
        >
          <Target
            size={17}
          />
          Qualification
        </button>

        <button
          type="button"
          className={
            activeView
              === "pipeline"
              ? "active"
              : ""
          }
          onClick={
            () =>
              setActiveView(
                "pipeline",
              )
          }
        >
          <TrendingUp
            size={17}
          />
          Pipeline
        </button>

        <button
          type="button"
          className={
            activeView
              === "opportunities"
              ? "active"
              : ""
          }
          onClick={
            () =>
              setActiveView(
                "opportunities",
              )
          }
        >
          <Handshake
            size={17}
          />
          Opportunités
        </button>


        <button
          type="button"
          className={
            activeView
              === "handoffs"
              ? "active"
              : ""
          }
          onClick={
            () =>
              setActiveView(
                "handoffs",
              )
          }
        >
          <Building2
            size={17}
          />
          Handoffs
        </button>

      </nav>


      {error ? (
        <section className="panel growth-error">
          <strong>
            Une action nécessite
            votre attention.
          </strong>

          <span>
            {error}
          </span>
        </section>
      ) : null}


      {loading ? (
        <section className="panel empty-panel">
          <RefreshCw
            size={28}
          />

          <strong>
            Chargement du
            Growth Engine...
          </strong>
        </section>
      ) : null}


      {!loading
      && activeView
        === "dashboard" ? (
        <>
          <section className="growth-kpi-grid">

            <article className="growth-kpi-card">
              <span>
                Leads
              </span>

              <strong>
                {leads.length}
              </strong>

              <small>
                Base commerciale active
              </small>
            </article>

            <article className="growth-kpi-card">
              <span>
                Qualifiés
              </span>

              <strong>
                {qualifiedLeadCount}
              </strong>

              <small>
                Prêts pour Core
              </small>
            </article>

            <article className="growth-kpi-card">
              <span>
                Opportunités
              </span>

              <strong>
                {
                  activeOpportunities
                    .length
                }
              </strong>

              <small>
                Pipeline ouvert
              </small>
            </article>

            <article className="growth-kpi-card highlight">
              <span>
                Pipeline
              </span>

              <strong>
                {
                  formatMoney(
                    openPipelineValue,
                    "CHF",
                  )
                }
              </strong>

              <small>
                Valeur ouverte
              </small>
            </article>

          </section>


          <section className="growth-dashboard-grid">

            <article className="panel growth-dashboard-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">
                    Qualification
                  </span>

                  <h2>
                    Leads à travailler
                  </h2>
                </div>

                <button
                  type="button"
                  className="button ghost"
                  onClick={
                    () =>
                      setActiveView(
                        "qualification",
                      )
                  }
                >
                  Voir tout
                  <ArrowRight
                    size={16}
                  />
                </button>
              </div>

              <div className="growth-mini-list">
                {
                  qualificationLeads
                    .slice(
                      0,
                      5,
                    )
                    .map(
                      (
                        lead,
                      ) => (
                        <div
                          key={
                            lead.id
                          }
                          className="growth-mini-row"
                        >
                          <div className="growth-avatar">
                            {
                              lead.lead_type
                                === "b2b"
                              ? (
                                <Building2
                                  size={17}
                                />
                              )
                              : (
                                <UserRound
                                  size={17}
                                />
                              )
                            }
                          </div>

                          <div>
                            <strong>
                              {
                                leadLabel(
                                  lead,
                                )
                              }
                            </strong>

                            <span>
                              {
                                leadStatusLabel(
                                  lead.status,
                                )
                              }
                            </span>
                          </div>

                          <div
                            className={
                              `growth-score ${scoreTone(
                                lead.growth_score,
                              )}`
                            }
                          >
                            {
                              lead
                                .growth_score
                            }
                          </div>
                        </div>
                      ),
                    )
                }

                {
                  !qualificationLeads
                    .length
                  ? (
                    <div className="growth-empty">
                      Aucun lead en
                      qualification.
                    </div>
                  )
                  : null
                }
              </div>
            </article>


            <article className="panel growth-dashboard-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">
                    Performance
                  </span>

                  <h2>
                    Opportunités
                  </h2>
                </div>

                <CircleDollarSign
                  size={21}
                />
              </div>

              <div className="growth-performance-number">
                {
                  formatMoney(
                    wonValue,
                    "CHF",
                  )
                }
              </div>

              <p>
                Valeur des opportunités
                gagnées.
              </p>

              <div className="growth-stage-summary">
                {
                  PIPELINE_STAGES
                    .map(
                      (
                        stage,
                      ) => (
                        <div
                          key={
                            stage
                          }
                        >
                          <span>
                            {
                              stageLabel(
                                stage,
                              )
                            }
                          </span>

                          <strong>
                            {
                              opportunities
                                .filter(
                                  (
                                    opportunity,
                                  ) =>
                                    opportunity.stage
                                      === stage,
                                )
                                .length
                            }
                          </strong>
                        </div>
                      ),
                    )
                }
              </div>
            </article>

          </section>
        </>
      ) : null}


      {!loading
      && activeView
        === "acquisition" ? (
        <>
          <section className="growth-acquisition-hero">
            <div>
              <span className="eyebrow">
                Entrée Growth Engine
              </span>

              <h2>
                Acquisition de prospects
              </h2>

              <p>
                Centraliser les différentes sources
                de leads avant qualification,
                normalisation et conversion Core.
              </p>
            </div>

            <div className="growth-acquisition-flow">
              <span>
                Sources
              </span>

              <ArrowRight
                size={16}
              />

              <span>
                Leads
              </span>

              <ArrowRight
                size={16}
              />

              <span>
                Qualification
              </span>
            </div>
          </section>


          <section className="growth-acquisition-grid">

            <article className="panel growth-acquisition-card available">
              <div className="growth-acquisition-icon">
                <MousePointerClick
                  size={21}
                />
              </div>

              <div>
                <span className="growth-capability-state available">
                  Disponible
                </span>

                <h3>
                  Saisie manuelle
                </h3>

                <p>
                  Création directe d’un prospect
                  dans le Lead Registry.
                </p>
              </div>

              <button
                type="button"
                className="button primary"
                onClick={
                  openCreateLead
                }
              >
                <Plus
                  size={15}
                />
                Créer un lead
              </button>
            </article>


            <article className="panel growth-acquisition-card">
              <div className="growth-acquisition-icon">
                <FileSpreadsheet
                  size={21}
                />
              </div>

              <div>
                <span className="growth-capability-state">
                  À connecter
                </span>

                <h3>
                  Import CSV
                </h3>

                <p>
                  Import en lot, mapping des colonnes
                  et normalisation des données.
                </p>
              </div>
            </article>


            <article className="panel growth-acquisition-card">
              <div className="growth-acquisition-icon">
                <Globe2
                  size={21}
                />
              </div>

              <div>
                <span className="growth-capability-state">
                  À connecter
                </span>

                <h3>
                  Sources externes
                </h3>

                <p>
                  Annuaire, partenaires, bases B2B/B2C
                  et autres sources commerciales.
                </p>
              </div>
            </article>


            <article className="panel growth-acquisition-card">
              <div className="growth-acquisition-icon">
                <DatabaseZap
                  size={21}
                />
              </div>

              <div>
                <span className="growth-capability-state">
                  À connecter
                </span>

                <h3>
                  Scraping
                </h3>

                <p>
                  Collecte automatisée depuis
                  sites web et annuaires ciblés.
                </p>
              </div>
            </article>


            <article className="panel growth-acquisition-card">
              <div className="growth-acquisition-icon">
                <Import
                  size={21}
                />
              </div>

              <div>
                <span className="growth-capability-state">
                  À connecter
                </span>

                <h3>
                  Formulaires / site web
                </h3>

                <p>
                  Leads entrants issus des formulaires
                  KEMS ou de campagnes digitales.
                </p>
              </div>
            </article>


            <article className="panel growth-acquisition-card">
              <div className="growth-acquisition-icon">
                <Radar
                  size={21}
                />
              </div>

              <div>
                <span className="growth-capability-state">
                  À connecter
                </span>

                <h3>
                  Historique d’ingestion
                </h3>

                <p>
                  Suivi des imports, volumes,
                  erreurs et provenance des leads.
                </p>
              </div>
            </article>

          </section>
        </>
      ) : null}


      {!loading
      && activeView
        === "leads" ? (
        <>
          <section className="panel growth-filter-bar">

            <div className="growth-search">
              <Search
                size={17}
              />

              <input
                type="search"
                placeholder="Rechercher un lead..."
                value={search}
                onChange={
                  (
                    event,
                  ) =>
                    setSearch(
                      event
                        .target
                        .value,
                    )
                }
              />
            </div>

            <div className="growth-lead-toolbar-actions">

              <div className="growth-status-filter">
                <Filter
                  size={16}
                />

              <select
                value={
                  statusFilter
                }
                onChange={
                  (
                    event,
                  ) =>
                    setStatusFilter(
                      event
                        .target
                        .value as
                        | "all"
                        | LeadStatus,
                    )
                }
              >
                <option value="all">
                  Tous les statuts
                </option>

                <option value="new">
                  Nouveaux
                </option>

                <option value="contacted">
                  Contactés
                </option>

                <option value="qualifying">
                  Qualification
                </option>

                <option value="qualified">
                  Qualifiés
                </option>

                <option value="disqualified">
                  Disqualifiés
                </option>

                <option value="converted_to_opportunity">
                  Convertis
                </option>
              </select>
              </div>

              <button
                type="button"
                className="button primary"
                onClick={
                  openCreateLead
                }
              >
                <Plus
                  size={16}
                />
                Nouveau lead
              </button>

            </div>

          </section>


          <section className="panel growth-table-panel">

            <div className="growth-table">
              <div className="growth-table-head">
                <span>
                  Prospect
                </span>

                <span>
                  Source
                </span>

                <span>
                  Statut
                </span>

                <span>
                  Score
                </span>

                <span>
                  Potentiel
                </span>

                <span>
                  Action
                </span>
              </div>

              {
                visibleLeads.map(
                  (
                    lead,
                  ) => (
                    <div
                      className="growth-table-row"
                      key={
                        lead.id
                      }
                    >
                      <button
                        type="button"
                        className="growth-person-cell growth-lead-link"
                        onClick={
                          () =>
                            openLeadDetail(
                              lead.id,
                            )
                        }
                      >
                        <div className="growth-avatar">
                          {
                            lead.lead_type
                              === "b2b"
                            ? (
                              <Building2
                                size={16}
                              />
                            )
                            : (
                              <UserRound
                                size={16}
                              />
                            )
                          }
                        </div>

                        <div>
                          <strong>
                            {
                              leadLabel(
                                lead,
                              )
                            }
                          </strong>

                          <span>
                            {
                              lead.email
                              ?? lead.phone
                              ?? (
                                lead.lead_type
                                  .toUpperCase()
                              )
                            }
                          </span>
                        </div>
                      </button>

                      <span>
                        {lead.source}
                      </span>

                      <span
                        className={
                          `growth-status status-${lead.status}`
                        }
                      >
                        {
                          leadStatusLabel(
                            lead.status,
                          )
                        }
                      </span>

                      <span
                        className={
                          `growth-score ${scoreTone(
                            lead.growth_score,
                          )}`
                        }
                      >
                        {
                          lead
                            .growth_score
                        }
                      </span>

                      <strong>
                        {
                          formatMoney(
                            lead
                              .estimated_value,
                            lead.currency,
                          )
                        }
                      </strong>

                      <div className="growth-row-actions">

                      {
                        (
                          lead.status
                          === "qualifying"
                          || lead.status
                          === "qualified"
                        )
                        ? (
                          <button
                            type="button"
                            className="button compact secondary"
                            onClick={
                              () =>
                                openQualificationEditor(
                                  lead.id,
                                )
                            }
                          >
                            Évaluer
                          </button>
                        )
                        : null
                      }

                        <button
                          type="button"
                          className="button compact secondary"
                          onClick={
                            () =>
                              openLeadDetail(
                                lead.id,
                              )
                          }
                        >
                          Voir
                        </button>

                        {
                          lead.status
                            === "new"
                          ? (
                            <button
                              type="button"
                              className="button compact secondary"
                              disabled={
                                busyId
                                  === lead.id
                              }
                              onClick={
                                () =>
                                  void runLeadAction(
                                    lead.id,
                                    "contact",
                                  )
                              }
                            >
                              Contacter
                            </button>
                          )
                          : null
                        }

                        {
                          lead.status
                            === "contacted"
                          ? (
                            <button
                              type="button"
                              className="button compact secondary"
                              disabled={
                                busyId
                                  === lead.id
                              }
                              onClick={
                                () =>
                                  void runLeadAction(
                                    lead.id,
                                    "start",
                                  )
                              }
                            >
                              Qualifier
                            </button>
                          )
                          : null
                        }

                        {
                          lead.status
                            === "qualifying"
                          ? (
                            <button
                              type="button"
                              className="button compact secondary"
                              disabled={
                                busyId
                                  === lead.id
                              }
                              onClick={
                                () =>
                                  openDisqualification(
                                    lead.id,
                                  )
                              }
                            >
                              Disqualifier
                            </button>
                          )
                          : null
                        }

                        {
                          lead.status
                            === "qualifying"
                          ? (
                            <button
                              type="button"
                              className="button compact primary"
                              disabled={
                                busyId
                                  === lead.id
                              }
                              onClick={
                                () =>
                                  void runLeadAction(
                                    lead.id,
                                    "qualify",
                                  )
                              }
                            >
                              Qualifier
                            </button>
                          )
                          : null
                        }

                        {
                          lead.status
                            === "qualified"
                          ? (
                            <button
                              type="button"
                              className="button compact secondary"
                              disabled={
                                busyId
                                  === lead.id
                              }
                              onClick={
                                () =>
                                  void runLeadAction(
                                    lead.id,
                                    "return_to_qualification",
                                  )
                              }
                            >
                              Revenir en qualification
                            </button>
                          )
                          : null
                        }

                        {
                          lead.status
                            === "qualified"
                          ? (
                            lead.core_converted_at
                              ? (
                                <span className="growth-core-linked">
                                  <CheckCircle2
                                    size={14}
                                  />
                                  Core lié
                                </span>
                              )
                              : (
                                <button
                                  type="button"
                                  className="button compact primary"
                                  disabled={
                                    busyId
                                      === lead.id
                                  }
                                  onClick={
                                    () =>
                                      void runLeadAction(
                                        lead.id,
                                        "core",
                                      )
                                  }
                                >
                                  Vers Core
                                </button>
                              )
                          )
                          : null
                        }

                        {
                          lead.status
                            === "qualified"
                          && lead.core_converted_at
                          ? (
                            <button
                              type="button"
                              className="button compact primary"
                              onClick={
                                () =>
                                  openOpportunityCreation(
                                    lead.id,
                                  )
                              }
                            >
                              Créer opportunité
                            </button>
                          )
                          : null
                        }

                        {
                          lead.status
                            === "converted_to_opportunity"
                          ? (
                            <span className="growth-opportunity-created">
                              <CheckCircle2
                                size={14}
                              />
                              Opportunité créée
                            </span>
                          )
                          : null
                        }

                        {
                          lead.status
                            === "disqualified"
                          ? (
                            <button
                              type="button"
                              className="button compact secondary"
                              disabled={
                                busyId
                                  === lead.id
                              }
                              onClick={
                                () =>
                                  void runLeadAction(
                                    lead.id,
                                    "reopen",
                                  )
                              }
                            >
                              Réouvrir
                            </button>
                          )
                          : null
                        }

                      </div>
                    </div>
                  ),
                )
              }

              {
                !visibleLeads
                  .length
                ? (
                  <div className="growth-empty">
                    Aucun lead pour
                    ces critères.
                  </div>
                )
                : null
              }

            </div>

          </section>
        </>
      ) : null}


      {!loading
      && activeView
        === "qualification" ? (
        <section className="growth-qualification-grid">

          {
            qualificationLeads
              .map(
                (
                  lead,
                ) => (
                  <article
                    className="panel growth-qualification-card"
                    key={
                      lead.id
                    }
                  >
                    <div className="growth-qualification-top">
                      <div>
                        <span
                          className={
                            `growth-status status-${lead.status}`
                          }
                        >
                          {
                            leadStatusLabel(
                              lead.status,
                            )
                          }
                        </span>

                        <h3>
                          {
                            leadLabel(
                              lead,
                            )
                          }
                        </h3>

                        <p>
                          {
                            lead.need_summary
                            ?? (
                              "Besoin à préciser."
                            )
                          }
                        </p>
                      </div>

                      <div
                        className={
                          `growth-score large ${scoreTone(
                            lead.growth_score,
                          )}`
                        }
                      >
                        {
                          lead
                            .growth_score
                        }
                        <small>
                          /100
                        </small>
                      </div>
                    </div>

                    <div className="growth-score-grid">

                      <div>
                        <span>
                          Fit
                        </span>
                        <strong>
                          {
                            lead.fit_score
                          }/25
                        </strong>
                      </div>

                      <div>
                        <span>
                          Intent
                        </span>
                        <strong>
                          {
                            lead.intent_score
                          }/25
                        </strong>
                      </div>

                      <div>
                        <span>
                          Engagement
                        </span>
                        <strong>
                          {
                            lead
                              .engagement_score
                          }/25
                        </strong>
                      </div>

                      <div>
                        <span>
                          Potentiel
                        </span>
                        <strong>
                          {
                            lead
                              .potential_score
                          }/25
                        </strong>
                      </div>

                    </div>

                    <div className="growth-qualification-meta">
                      <span>
                        {
                          formatMoney(
                            lead
                              .estimated_value,
                            lead.currency,
                          )
                        }
                      </span>

                      <span>
                        {
                          lead
                            .urgency
                        }
                      </span>

                      <span>
                        {
                          lead
                            .source
                        }
                      </span>
                    </div>

                    {
                      lead.status
                        === "qualifying"
                      ? (
                        <button
                          type="button"
                          className="button primary"
                          disabled={
                            busyId
                              === lead.id
                          }
                          onClick={
                            () =>
                              void runLeadAction(
                                lead.id,
                                "qualify",
                              )
                          }
                        >
                          <CheckCircle2
                            size={16}
                          />
                          Qualifier
                        </button>
                      )
                      : null
                    }

                    {
                      lead.status
                        === "qualifying"
                      ? (
                        <button
                          type="button"
                          className="button secondary"
                          disabled={
                            busyId
                              === lead.id
                          }
                          onClick={
                            () =>
                              openDisqualification(
                                lead.id,
                              )
                          }
                        >
                          Disqualifier
                        </button>
                      )
                      : null
                    }

                    {
                      lead.status
                        === "qualified"
                      ? (
                        <button
                          type="button"
                          className="button secondary"
                          disabled={
                            busyId
                              === lead.id
                          }
                          onClick={
                            () =>
                              void runLeadAction(
                                lead.id,
                                "return_to_qualification",
                              )
                          }
                        >
                          Revenir en qualification
                        </button>
                      )
                      : null
                    }

                    {
                      lead.status
                        === "qualified"
                      && lead.core_converted_at
                      ? (
                        <button
                          type="button"
                          className="button primary"
                          onClick={
                            () =>
                              openOpportunityCreation(
                                lead.id,
                              )
                          }
                        >
                          Créer l'opportunité
                          <ArrowRight
                            size={16}
                          />
                        </button>
                      )
                      : null
                    }

                    {
                      lead.status
                        === "converted_to_opportunity"
                      ? (
                        <div className="growth-opportunity-created">
                          <CheckCircle2
                            size={16}
                          />
                          Opportunité créée
                        </div>
                      )
                      : null
                    }

                    {
                      lead.status
                        === "qualified"
                      ? (
                        lead.core_converted_at
                          ? (
                            <div className="growth-core-linked">
                              <CheckCircle2
                                size={16}
                              />
                              KEMS Core lié
                            </div>
                          )
                          : (
                            <button
                              type="button"
                              className="button secondary"
                              disabled={
                                busyId
                                  === lead.id
                              }
                              onClick={
                                () =>
                                  void runLeadAction(
                                    lead.id,
                                    "core",
                                  )
                              }
                            >
                              Convertir vers Core
                              <ArrowRight
                                size={16}
                              />
                            </button>
                          )
                      )
                      : null
                    }

                  </article>
                ),
              )
          }

          {
            !qualificationLeads
              .length
            ? (
              <section className="panel growth-empty">
                Aucun lead actuellement
                en qualification.
              </section>
            )
            : null
          }

        </section>
      ) : null}


      {!loading
      && activeView
        === "pipeline" ? (
        <div className="growth-pipeline-view">
          <section className="growth-pipeline">

          {
            PIPELINE_STAGES.map(
              (
                stage,
              ) => {
                const stageItems =
                  opportunities.filter(
                    (
                      opportunity,
                    ) =>
                      opportunity.stage
                        === stage
                      && !transmittedOpportunityIds
                        .has(
                          opportunity.id,
                        ),
                  )

                return (
                  <div
                    className={
                      `growth-pipeline-column pipeline-${stage}`
                    }
                    key={
                      stage
                    }
                  >
                    <div className="growth-pipeline-heading">
                      <div>
                        <span>
                          {
                            stageLabel(
                              stage,
                            )
                          }
                        </span>

                        <strong>
                          {
                            stageItems.length
                          }
                        </strong>
                      </div>

                      <small>
                        {
                          formatMoney(
                            stageItems
                              .reduce(
                                (
                                  total,
                                  item,
                                ) =>
                                  total
                                  + (
                                    item
                                      .estimated_value
                                    ?? 0
                                  ),
                                0,
                              ),
                            "CHF",
                          )
                        }
                      </small>
                    </div>

                    <div className="growth-pipeline-stack">
                      {
                        stageItems.map(
                          (
                            opportunity,
                          ) => {
                            const next =
                              nextStage(
                                opportunity.stage,
                              )

                            return (
                              <article
                                className="growth-opportunity-card"
                                key={
                                  opportunity.id
                                }
                              >
                                <strong>
                                  {
                                    opportunity.name
                                  }
                                </strong>

                                <span>
                                  {
                                    formatMoney(
                                      opportunity
                                        .estimated_value,
                                      opportunity
                                        .currency,
                                    )
                                  }
                                </span>

                                <div className="growth-probability">
                                  <div
                                    style={{
                                      width:
                                        `${opportunity.probability}%`,
                                    }}
                                  />

                                  <small>
                                    {
                                      opportunity.probability
                                    }%
                                  </small>
                                </div>

                                <small>
                                  Échéance · {
                                    formatDate(
                                      opportunity
                                        .expected_close_date,
                                    )
                                  }
                                </small>

                                <OpportunityHandoffSummary
                                  opportunity={
                                    opportunity
                                  }
                                  token={
                                    token
                                  }
                                  compact
                                />


                                {
                                  next
                                  ? (
                                    <button
                                      type="button"
                                      className="button compact secondary"
                                      disabled={
                                        busyId
                                          === opportunity.id
                                      }
                                      onClick={
                                        () =>
                                          void advanceStage(
                                            opportunity,
                                            next,
                                          )
                                      }
                                    >
                                      {
                                        stageLabel(
                                          next,
                                        )
                                      }
                                      <ArrowRight
                                        size={14}
                                      />
                                    </button>
                                  )
                                  : null
                                }

                                {
                                  ![
                                    "won",
                                    "lost",
                                  ].includes(
                                    opportunity.stage,
                                  )
                                  ? (
                                    <button
                                      type="button"
                                      className="growth-lost-action"
                                      disabled={
                                        busyId
                                          === opportunity.id
                                      }
                                      onClick={
                                        () =>
                                          void advanceStage(
                                            opportunity,
                                            "lost",
                                          )
                                      }
                                    >
                                      Marquer perdue
                                    </button>
                                  )
                                  : null
                                }

                              </article>
                            )
                          },
                        )
                      }

                      {
                        !stageItems
                          .length
                        ? (
                          <div className="growth-pipeline-empty">
                            Aucune opportunité
                          </div>
                        )
                        : null
                      }
                    </div>
                  </div>
                )
              },
            )
          }

          </section>

          <section className="panel growth-pipeline-results">
            <div className="growth-pipeline-results-heading">
              <div>
                <span className="eyebrow">
                  Résultats commerciaux
                </span>

                <h2>
                  Opportunités clôturées
                </h2>

                <p>
                  Les opportunités gagnées ou perdues
                  quittent le pipeline actif tout en
                  restant disponibles dans l'historique.
                </p>
              </div>

              <button
                type="button"
                className="text-link"
                onClick={
                  () =>
                    setActiveView(
                      "opportunities",
                    )
                }
              >
                Voir les opportunités
                <ArrowRight
                  size={16}
                />
              </button>
            </div>

            <div className="growth-pipeline-result-grid">
              <article className="growth-pipeline-result-card won">
                <div>
                  <CheckCircle2
                    size={18}
                  />

                  <span>
                    Gagnées
                  </span>
                </div>

                <strong>
                  {
                    wonOpportunities
                      .length
                  }
                </strong>

                <small>
                  {
                    formatMoney(
                      wonOpportunityValue,
                      "CHF",
                    )
                  }
                  {" · valeur cumulée"}
                </small>
              </article>

              <article className="growth-pipeline-result-card lost">
                <div>
                  <X
                    size={18}
                  />

                  <span>
                    Perdues
                  </span>
                </div>

                <strong>
                  {
                    lostOpportunities
                      .length
                  }
                </strong>

                <small>
                  {
                    formatMoney(
                      lostOpportunityValue,
                      "CHF",
                    )
                  }
                  {" · valeur cumulée"}
                </small>
              </article>
            </div>
          </section>
        </div>
      ) : null}


      {!loading
      && activeView
        === "opportunities" ? (
        <section className="panel growth-table-panel">

          <div className="growth-table opportunity-table">

            <div className="growth-table-head">
              <span>
                Opportunité
              </span>

              <span>
                Étape
              </span>

              <span>
                Valeur
              </span>

              <span>
                Probabilité
              </span>

              <span>
                Échéance
              </span>

              <span>
                Résultat
              </span>

              <span>
                Handoff
              </span>
            </div>

            {
              opportunities.map(
                (
                  opportunity,
                ) => (
                  <div
                    className={
                      `growth-table-row opportunity-row opportunity-row-${opportunity.stage}`
                    }
                    key={
                      opportunity.id
                    }
                  >
                    <div>
                      <strong>
                        {
                          opportunity.name
                            .split(" · ")[0]
                        }
                      </strong>

                      <span>
                        {
                          opportunity.description
                          ?? (
                            opportunity.name
                              .includes(" · ")
                              ? opportunity.name
                                  .split(" · ")
                                  .slice(1)
                                  .join(" · ")
                              : "Sans description"
                          )
                        }
                      </span>

                    </div>

                    <span
                      className={
                        `growth-stage stage-${opportunity.stage}`
                      }
                    >
                      {
                        stageLabel(
                          opportunity.stage,
                        )
                      }
                    </span>

                    <strong>
                      {
                        formatMoney(
                          opportunity
                            .estimated_value,
                          opportunity
                            .currency,
                        )
                      }
                    </strong>

                    <span>
                      {
                        opportunity
                          .probability
                      }%
                    </span>

                    <span>
                      {
                        formatDate(
                          opportunity
                            .expected_close_date,
                        )
                      }
                    </span>

                    <span
                      className={
                        `growth-result-badge result-${
                          opportunity.stage
                            === "lost"
                            ? "lost"
                            : opportunity.stage
                                === "won"
                              ? "won"
                              : "active"
                        }`
                      }
                    >
                      {
                        opportunity.stage
                          === "lost"
                        ? (
                          opportunity
                            .lost_reason
                          ?? "Perdue"
                        )
                        : opportunity.stage
                            === "won"
                          ? "Gagnée"
                          : "En cours"
                      }
                    </span>

                    <div className="growth-handoff-table-cell">
                      <OpportunityHandoffSummary
                        opportunity={
                          opportunity
                        }
                        token={
                          token
                        }
                      />
                    </div>
                  </div>
                ),
              )
            }

            {
              !opportunities.length
              ? (
                <div className="growth-empty">
                  Aucune opportunité.
                </div>
              )
              : null
            }

          </div>

        </section>
      ) : null}

      {!loading
      && activeView
        === "handoffs" ? (
        <GrowthHandoffsView
          opportunities={
            opportunities
          }
          token={
            token
          }
        />
      ) : null}


      {opportunityLead ? (
        <CreateOpportunityModal
          lead={
            opportunityLead
          }
          token={
            token
          }
          onClose={
            closeOpportunityCreation
          }
          onCreated={
            handleOpportunityCreated
          }
        />
      ) : null}


      {disqualifyLead ? (
        <div
          className="growth-modal-backdrop"
          role="presentation"
          onMouseDown={
            event => {
              if (
                event.target
                === event.currentTarget
              ) {
                closeDisqualification()
              }
            }
          }
        >
          <section
            className="growth-modal growth-disqualify-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="disqualify-title"
          >

            <header className="growth-modal-header">

              <div>
                <span className="eyebrow">
                  Décision de qualification
                </span>

                <h2
                  id="disqualify-title"
                >
                  Disqualifier {
                    leadLabel(
                      disqualifyLead,
                    )
                  }
                </h2>

                <p>
                  Le prospect sort du flux actif,
                  mais peut être réouvert ultérieurement.
                </p>
              </div>

              <button
                type="button"
                className="growth-modal-close"
                aria-label="Fermer"
                onClick={
                  closeDisqualification
                }
              >
                <X
                  size={19}
                />
              </button>

            </header>


            <div className="growth-disqualify-body">

              <label className="growth-field full">
                <span>
                  Motif de disqualification *
                </span>

                <textarea
                  rows={5}
                  autoFocus
                  value={
                    disqualifyReason
                  }
                  onChange={
                    event =>
                      setDisqualifyReason(
                        event.target.value,
                      )
                  }
                  placeholder={
                    "Ex. budget insuffisant, "
                    + "besoin hors périmètre, "
                    + "projet reporté..."
                  }
                />
              </label>

            </div>


            <footer className="growth-modal-footer">

              <button
                type="button"
                className="button secondary"
                disabled={
                  disqualifySaving
                }
                onClick={
                  closeDisqualification
                }
              >
                Annuler
              </button>

              <button
                type="button"
                className="button danger"
                disabled={
                  disqualifySaving
                  || !disqualifyReason.trim()
                }
                onClick={
                  () =>
                    void confirmDisqualification()
                }
              >
                {
                  disqualifySaving
                    ? "Disqualification..."
                    : "Confirmer la disqualification"
                }
              </button>

            </footer>

          </section>
        </div>
      ) : null}


      {qualificationLead ? (
        <div
          className="growth-modal-backdrop"
          role="presentation"
          onMouseDown={
            event => {
              if (
                event.target
                === event.currentTarget
              ) {
                closeQualificationEditor()
              }
            }
          }
        >
          <section
            className="growth-modal growth-qualification-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="qualification-editor-title"
          >

            <header className="growth-modal-header">

              <div>
                <span className="eyebrow">
                  Qualification commerciale
                </span>

                <h2
                  id="qualification-editor-title"
                >
                  {
                    leadLabel(
                      qualificationLead,
                    )
                  }
                </h2>

                <p>
                  Évaluer le prospect sur quatre
                  dimensions. Le score reste une
                  aide à la décision.
                </p>
              </div>

              <button
                type="button"
                className="growth-modal-close"
                aria-label="Fermer"
                onClick={
                  closeQualificationEditor
                }
              >
                <X
                  size={19}
                />
              </button>

            </header>


            <div className="growth-qualification-body">

              <section className="growth-qualification-summary">

                <div>
                  <span>
                    Growth Score
                  </span>

                  <strong>
                    {
                      qualificationTotal
                    }
                    <small>
                      /100
                    </small>
                  </strong>
                </div>

                <div className="growth-qualification-scorebar">
                  <span
                    style={{
                      width:
                        `${qualificationTotal}%`,
                    }}
                  />
                </div>

                <p>
                  Le score n'entraîne aucune
                  qualification automatique.
                  La décision reste explicite.
                </p>

              </section>


              <section className="growth-qualification-editor-grid">

                <label className="growth-score-editor">

                  <div>
                    <span>
                      Fit
                    </span>

                    <strong>
                      {
                        qualificationFit
                      }/25
                    </strong>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="25"
                    step="1"
                    value={
                      qualificationFit
                    }
                    onChange={
                      event =>
                        setQualificationFit(
                          clampQualificationScore(
                            Number(
                              event.target
                                .value,
                            ),
                          ),
                        )
                    }
                  />

                  <input
                    type="number"
                    min="0"
                    max="25"
                    value={
                      qualificationFit
                    }
                    onChange={
                      event =>
                        setQualificationFit(
                          clampQualificationScore(
                            Number(
                              event.target
                                .value,
                            ),
                          ),
                        )
                    }
                  />

                  <small>
                    Correspondance avec la cible,
                    le profil et le besoin KEMS.
                  </small>

                </label>


                <label className="growth-score-editor">

                  <div>
                    <span>
                      Intent
                    </span>

                    <strong>
                      {
                        qualificationIntent
                      }/25
                    </strong>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="25"
                    step="1"
                    value={
                      qualificationIntent
                    }
                    onChange={
                      event =>
                        setQualificationIntent(
                          clampQualificationScore(
                            Number(
                              event.target
                                .value,
                            ),
                          ),
                        )
                    }
                  />

                  <input
                    type="number"
                    min="0"
                    max="25"
                    value={
                      qualificationIntent
                    }
                    onChange={
                      event =>
                        setQualificationIntent(
                          clampQualificationScore(
                            Number(
                              event.target
                                .value,
                            ),
                          ),
                        )
                    }
                  />

                  <small>
                    Niveau d'intérêt et intention
                    réelle d'avancer.
                  </small>

                </label>


                <label className="growth-score-editor">

                  <div>
                    <span>
                      Engagement
                    </span>

                    <strong>
                      {
                        qualificationEngagement
                      }/25
                    </strong>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="25"
                    step="1"
                    value={
                      qualificationEngagement
                    }
                    onChange={
                      event =>
                        setQualificationEngagement(
                          clampQualificationScore(
                            Number(
                              event.target
                                .value,
                            ),
                          ),
                        )
                    }
                  />

                  <input
                    type="number"
                    min="0"
                    max="25"
                    value={
                      qualificationEngagement
                    }
                    onChange={
                      event =>
                        setQualificationEngagement(
                          clampQualificationScore(
                            Number(
                              event.target
                                .value,
                            ),
                          ),
                        )
                    }
                  />

                  <small>
                    Réactivité, échanges et
                    implication du prospect.
                  </small>

                </label>


                <label className="growth-score-editor">

                  <div>
                    <span>
                      Potentiel
                    </span>

                    <strong>
                      {
                        qualificationPotential
                      }/25
                    </strong>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="25"
                    step="1"
                    value={
                      qualificationPotential
                    }
                    onChange={
                      event =>
                        setQualificationPotential(
                          clampQualificationScore(
                            Number(
                              event.target
                                .value,
                            ),
                          ),
                        )
                    }
                  />

                  <input
                    type="number"
                    min="0"
                    max="25"
                    value={
                      qualificationPotential
                    }
                    onChange={
                      event =>
                        setQualificationPotential(
                          clampQualificationScore(
                            Number(
                              event.target
                                .value,
                            ),
                          ),
                        )
                    }
                  />

                  <small>
                    Valeur commerciale et potentiel
                    de développement.
                  </small>

                </label>

              </section>


              <section className="growth-qualification-notes">

                <label className="growth-field full">
                  <span>
                    Notes de qualification
                  </span>

                  <textarea
                    rows={5}
                    value={
                      qualificationNotes
                    }
                    onChange={
                      event =>
                        setQualificationNotes(
                          event.target.value,
                        )
                    }
                    placeholder={
                      "Contexte, besoin, objections, "
                      + "prochaines étapes..."
                    }
                  />
                </label>

              </section>

            </div>


            <footer className="growth-modal-footer">

              <button
                type="button"
                className="button secondary"
                disabled={
                  qualificationSaving
                }
                onClick={
                  closeQualificationEditor
                }
              >
                Annuler
              </button>

              <button
                type="button"
                className="button primary"
                disabled={
                  qualificationSaving
                }
                onClick={
                  () =>
                    void saveQualification()
                }
              >
                {
                  qualificationSaving
                    ? "Enregistrement..."
                    : "Enregistrer le scoring"
                }
              </button>

            </footer>

          </section>
        </div>
      ) : null}


      {selectedLead ? (
        <div
          className="growth-detail-backdrop"
          role="presentation"
          onMouseDown={
            event => {
              if (
                event.target
                === event.currentTarget
              ) {
                closeLeadDetail()
              }
            }
          }
        >
          <aside
            className="growth-lead-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lead-detail-title"
          >

            <header className="growth-lead-drawer-header">

              <div className="growth-lead-drawer-identity">

                <div className="growth-lead-detail-avatar">
                  {
                    selectedLead.lead_type
                      === "b2b"
                    ? (
                      <Building2
                        size={23}
                      />
                    )
                    : (
                      <UserRound
                        size={23}
                      />
                    )
                  }
                </div>

                <div>
                  <span className="eyebrow">
                    {
                      selectedLead.lead_type
                        === "b2b"
                      ? "Prospect B2B"
                      : "Prospect B2C"
                    }
                  </span>

                  <h2
                    id="lead-detail-title"
                  >
                    {
                      leadLabel(
                        selectedLead,
                      )
                    }
                  </h2>

                  <div className="growth-lead-detail-header-meta">

                    <span
                      className={
                        `growth-status status-${selectedLead.status}`
                      }
                    >
                      {
                        leadStatusLabel(
                          selectedLead.status,
                        )
                      }
                    </span>

                    <span>
                      Score {
                        selectedLead.growth_score
                      }/100
                    </span>

                  </div>
                </div>

              </div>

              <button
                type="button"
                className="growth-modal-close"
                aria-label="Fermer"
                onClick={
                  closeLeadDetail
                }
              >
                <X
                  size={19}
                />
              </button>

            </header>


            <div className="growth-lead-drawer-body">


              <section className="growth-detail-section">

                <div className="growth-detail-section-title">
                  <span className="eyebrow">
                    Identité
                  </span>

                  <h3>
                    Prospect
                  </h3>
                </div>


                <div className="growth-detail-info-grid">

                  {
                    selectedLead.lead_type
                      === "b2b"
                    ? (
                      <div className="growth-detail-info-item">
                        <Building2
                          size={16}
                        />

                        <div>
                          <span>
                            Entreprise
                          </span>

                          <strong>
                            {
                              selectedLead.company_name
                              ?? "Non renseignée"
                            }
                          </strong>
                        </div>
                      </div>
                    )
                    : null
                  }


                  <div className="growth-detail-info-item">
                    <UserRound
                      size={16}
                    />

                    <div>
                      <span>
                        Contact
                      </span>

                      <strong>
                        {
                          [
                            selectedLead.first_name,
                            selectedLead.last_name,
                          ]
                            .filter(Boolean)
                            .join(" ")
                          || "Non renseigné"
                        }
                      </strong>
                    </div>
                  </div>


                  <div className="growth-detail-info-item">
                    <Mail
                      size={16}
                    />

                    <div>
                      <span>
                        Email
                      </span>

                      <strong>
                        {
                          selectedLead.email
                          ?? "Non renseigné"
                        }
                      </strong>
                    </div>
                  </div>


                  <div className="growth-detail-info-item">
                    <Phone
                      size={16}
                    />

                    <div>
                      <span>
                        Téléphone
                      </span>

                      <strong>
                        {
                          selectedLead.phone
                          ?? "Non renseigné"
                        }
                      </strong>
                    </div>
                  </div>


                  <div className="growth-detail-info-item">
                    <MapPin
                      size={16}
                    />

                    <div>
                      <span>
                        Localisation
                      </span>

                      <strong>
                        {
                          [
                            selectedLead.city,
                            selectedLead.country,
                          ]
                            .filter(Boolean)
                            .join(", ")
                          || "Non renseignée"
                        }
                      </strong>
                    </div>
                  </div>

                </div>

              </section>


              <section className="growth-detail-section">

                <div className="growth-detail-section-title">
                  <span className="eyebrow">
                    Acquisition
                  </span>

                  <h3>
                    Provenance
                  </h3>
                </div>


                <div className="growth-detail-inline">

                  <div>
                    <span>
                      Source
                    </span>

                    <strong>
                      {
                        selectedLead.source
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Détail
                    </span>

                    <strong>
                      {
                        selectedLead.source_detail
                        ?? "—"
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Créé le
                    </span>

                    <strong>
                      {
                        formatDate(
                          selectedLead.created_at,
                        )
                      }
                    </strong>
                  </div>

                </div>

              </section>


              <section className="growth-detail-section">

                <div className="growth-detail-section-title">
                  <span className="eyebrow">
                    Potentiel commercial
                  </span>

                  <h3>
                    Besoin
                  </h3>
                </div>


                <div className="growth-detail-need">
                  {
                    selectedLead.need_summary
                    ?? (
                      "Aucun besoin détaillé "
                      + "n'a encore été renseigné."
                    )
                  }
                </div>


                <div className="growth-detail-inline">

                  <div>
                    <span>
                      Valeur estimée
                    </span>

                    <strong>
                      {
                        formatMoney(
                          selectedLead.estimated_value,
                          selectedLead.currency,
                        )
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Urgence
                    </span>

                    <strong>
                      {
                        selectedLead.urgency
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Devise
                    </span>

                    <strong>
                      {
                        selectedLead.currency
                      }
                    </strong>
                  </div>

                </div>

              </section>


              <section className="growth-detail-section">

                <div className="growth-detail-score-header">

                  <div className="growth-detail-section-title">
                    <span className="eyebrow">
                      Qualification
                    </span>

                    <h3>
                      Growth Score
                    </h3>

                    {
                      (
                        selectedLead.status
                        === "qualifying"
                        || selectedLead.status
                        === "qualified"
                      )
                      ? (
                        <button
                          type="button"
                          className="button compact secondary growth-score-edit"
                          onClick={
                            () =>
                              openQualificationEditor(
                                selectedLead.id,
                              )
                          }
                        >
                          Modifier le scoring
                        </button>
                      )
                      : null
                    }
                  </div>

                  <div
                    className={
                      `growth-score large ${scoreTone(
                        selectedLead.growth_score,
                      )}`
                    }
                  >
                    {
                      selectedLead.growth_score
                    }

                    <small>
                      /100
                    </small>
                  </div>

                </div>


                <div className="growth-score-grid">

                  <div>
                    <span>
                      Fit
                    </span>

                    <strong>
                      {
                        selectedLead.fit_score
                      }/25
                    </strong>
                  </div>

                  <div>
                    <span>
                      Intent
                    </span>

                    <strong>
                      {
                        selectedLead.intent_score
                      }/25
                    </strong>
                  </div>

                  <div>
                    <span>
                      Engagement
                    </span>

                    <strong>
                      {
                        selectedLead.engagement_score
                      }/25
                    </strong>
                  </div>

                  <div>
                    <span>
                      Potentiel
                    </span>

                    <strong>
                      {
                        selectedLead.potential_score
                      }/25
                    </strong>
                  </div>

                </div>


                {
                  selectedLead.qualification_notes
                  ? (
                    <div className="growth-detail-note">
                      {
                        selectedLead.qualification_notes
                      }
                    </div>
                  )
                  : null
                }

              </section>


              <section className="growth-detail-section">

                <div className="growth-detail-section-title">
                  <span className="eyebrow">
                    Parcours
                  </span>

                  <h3>
                    Cycle commercial
                  </h3>
                </div>


                <div className="growth-lead-timeline">

                  <div className="done">
                    <span />

                    <div>
                      <strong>
                        Lead créé
                      </strong>

                      <small>
                        {
                          formatDate(
                            selectedLead.created_at,
                          )
                        }
                      </small>
                    </div>
                  </div>


                  <div
                    className={
                      selectedLead.contacted_at
                        ? "done"
                        : ""
                    }
                  >
                    <span />

                    <div>
                      <strong>
                        Contacté
                      </strong>

                      <small>
                        {
                          formatDate(
                            selectedLead.contacted_at,
                          )
                        }
                      </small>
                    </div>
                  </div>


                  <div
                    className={
                      selectedLead.qualification_started_at
                        ? "done"
                        : ""
                    }
                  >
                    <span />

                    <div>
                      <strong>
                        Qualification
                      </strong>

                      <small>
                        {
                          formatDate(
                            selectedLead.qualification_started_at,
                          )
                        }
                      </small>
                    </div>
                  </div>


                  <div
                    className={
                      selectedLead.qualified_at
                        ? "done"
                        : ""
                    }
                  >
                    <span />

                    <div>
                      <strong>
                        Qualifié
                      </strong>

                      <small>
                        {
                          formatDate(
                            selectedLead.qualified_at,
                          )
                        }
                      </small>
                    </div>
                  </div>


                  <div
                    className={
                      selectedLead.core_converted_at
                        ? "done"
                        : ""
                    }
                  >
                    <span />

                    <div>
                      <strong>
                        KEMS Core
                      </strong>

                      <small>
                        {
                          formatDate(
                            selectedLead.core_converted_at,
                          )
                        }
                      </small>
                    </div>
                  </div>

                </div>

              </section>


              <section className="growth-detail-section">

                <div className="growth-detail-section-title">
                  <span className="eyebrow">
                    Core
                  </span>

                  <h3>
                    Liens de référence
                  </h3>
                </div>


                <div className="growth-core-links">

                  <div>
                    <span>
                      Contact Core
                    </span>

                    <strong>
                      {
                        selectedLead.contact_id
                          ? "Lié"
                          : "Non lié"
                      }
                    </strong>

                    {
                      selectedLead.contact_id
                      ? (
                        <small>
                          {
                            selectedLead.contact_id
                          }
                        </small>
                      )
                      : null
                    }
                  </div>

                  <div>
                    <span>
                      Organisation Core
                    </span>

                    <strong>
                      {
                        selectedLead.organization_id
                          ? "Liée"
                          : "Non liée"
                      }
                    </strong>

                    {
                      selectedLead.organization_id
                      ? (
                        <small>
                          {
                            selectedLead.organization_id
                          }
                        </small>
                      )
                      : null
                    }
                  </div>

                </div>

              </section>

            </div>


            <footer className="growth-lead-drawer-footer">

              {
                selectedLead.status
                  === "new"
                ? (
                  <button
                    type="button"
                    className="button primary"
                    disabled={
                      busyId
                        === selectedLead.id
                    }
                    onClick={
                      () =>
                        void runLeadAction(
                          selectedLead.id,
                          "contact",
                        )
                    }
                  >
                    Marquer comme contacté
                    <ArrowRight
                      size={16}
                    />
                  </button>
                )
                : null
              }


              {
                selectedLead.status
                  === "contacted"
                ? (
                  <button
                    type="button"
                    className="button primary"
                    disabled={
                      busyId
                        === selectedLead.id
                    }
                    onClick={
                      () =>
                        void runLeadAction(
                          selectedLead.id,
                          "start",
                        )
                    }
                  >
                    Démarrer la qualification
                    <ArrowRight
                      size={16}
                    />
                  </button>
                )
                : null
              }


              {
                selectedLead.status
                  === "qualifying"
                ? (
                  <>
                    <button
                      type="button"
                      className="button primary"
                      onClick={
                        () =>
                          openQualificationEditor(
                            selectedLead.id,
                          )
                      }
                    >
                      Évaluer
                    </button>

                    <button
                      type="button"
                      className="button primary"
                      disabled={
                        busyId
                          === selectedLead.id
                      }
                      onClick={
                        () =>
                          void runLeadAction(
                            selectedLead.id,
                            "qualify",
                          )
                      }
                    >
                      Qualifier
                    </button>

                    <button
                      type="button"
                      className="button secondary"
                      onClick={
                        () =>
                          openDisqualification(
                            selectedLead.id,
                          )
                      }
                    >
                      Disqualifier
                    </button>
                  </>
                )
                : null
              }


              {
                selectedLead.status
                  === "qualified"
                ? (
                  <button
                    type="button"
                    className="button secondary"
                    disabled={
                      busyId
                        === selectedLead.id
                    }
                    onClick={
                      () =>
                        void runLeadAction(
                          selectedLead.id,
                          "return_to_qualification",
                        )
                    }
                  >
                    Revenir en qualification
                  </button>
                )
                : null
              }


              {
                selectedLead.status
                  === "qualified"
                ? (
                  selectedLead.core_converted_at
                    ? (
                      <div className="growth-detail-complete">
                        <CheckCircle2
                          size={17}
                        />
                        KEMS Core lié
                      </div>
                    )
                    : (
                      <button
                        type="button"
                        className="button primary"
                        disabled={
                          busyId
                            === selectedLead.id
                        }
                        onClick={
                          () =>
                            void runLeadAction(
                              selectedLead.id,
                              "core",
                            )
                        }
                      >
                        Convertir vers Core
                        <ArrowRight
                          size={16}
                        />
                      </button>
                    )
                )
                : null
              }


              {
                selectedLead.status
                  === "disqualified"
                ? (
                  <>
                    <div className="growth-disqualified-summary">
                      <strong>
                        Lead disqualifié
                      </strong>

                      <span>
                        {
                          selectedLead.disqualified_reason
                          ?? "Motif non renseigné"
                        }
                      </span>
                    </div>

                    <button
                      type="button"
                      className="button primary"
                      disabled={
                        busyId
                          === selectedLead.id
                      }
                      onClick={
                        () =>
                          void runLeadAction(
                            selectedLead.id,
                            "reopen",
                          )
                      }
                    >
                      Réouvrir la qualification
                    </button>
                  </>
                )
                : null
              }


              {
                selectedLead.status
                  === "qualified"
                && selectedLead.core_converted_at
                ? (
                  <button
                    type="button"
                    className="button primary"
                    onClick={
                      () =>
                        openOpportunityCreation(
                          selectedLead.id,
                        )
                    }
                  >
                    Créer l'opportunité
                    <ArrowRight
                      size={16}
                    />
                  </button>
                )
                : null
              }


              {
                selectedLead.status
                  === "converted_to_opportunity"
                ? (
                  <div className="growth-detail-complete">
                    <CheckCircle2
                      size={17}
                    />

                    Lead converti en opportunité
                  </div>
                )
                : null
              }


              <button
                type="button"
                className="button secondary"
                onClick={
                  closeLeadDetail
                }
              >
                Fermer
              </button>

            </footer>

          </aside>
        </div>
      ) : null}


      {createLeadOpen ? (
        <div
          className="growth-modal-backdrop"
          role="presentation"
          onMouseDown={
            (
              event,
            ) => {
              if (
                event.target
                === event.currentTarget
              ) {
                closeCreateLead()
              }
            }
          }
        >
          <section
            className="growth-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-lead-title"
          >

            <header className="growth-modal-header">

              <div>
                <span className="eyebrow">
                  Growth Engine
                </span>

                <h2
                  id="create-lead-title"
                >
                  Nouveau lead
                </h2>

                <p>
                  Enregistrer un prospect
                  avant qualification.
                </p>
              </div>

              <button
                type="button"
                className="growth-modal-close"
                aria-label="Fermer"
                onClick={
                  closeCreateLead
                }
              >
                <X
                  size={19}
                />
              </button>

            </header>


            <form
              className="growth-lead-form"
              onSubmit={
                event =>
                  void submitLead(
                    event,
                  )
              }
            >

              <div className="growth-form-section">

                <div className="growth-form-section-heading">
                  <strong>
                    Type de prospect
                  </strong>

                  <span>
                    B2C personne ou
                    B2B entreprise
                  </span>
                </div>

                <div className="growth-lead-type-switch">

                  <button
                    type="button"
                    className={
                      leadType
                        === "b2c"
                        ? "active"
                        : ""
                    }
                    onClick={
                      () =>
                        setLeadType(
                          "b2c",
                        )
                    }
                  >
                    <UserRound
                      size={17}
                    />
                    B2C · Personne
                  </button>

                  <button
                    type="button"
                    className={
                      leadType
                        === "b2b"
                        ? "active"
                        : ""
                    }
                    onClick={
                      () =>
                        setLeadType(
                          "b2b",
                        )
                    }
                  >
                    <Building2
                      size={17}
                    />
                    B2B · Entreprise
                  </button>

                </div>

              </div>


              <div className="growth-form-section">

                <div className="growth-form-section-heading">
                  <strong>
                    Identité
                  </strong>
                </div>

                {leadType
                  === "b2b"
                  ? (
                    <label className="growth-field full">
                      <span>
                        Entreprise
                      </span>

                      <input
                        value={
                          companyName
                        }
                        onChange={
                          event =>
                            setCompanyName(
                              event.target
                                .value,
                            )
                        }
                        placeholder="Ex. Example SA"
                        autoFocus
                      />
                    </label>
                  )
                  : null}

                <div className="growth-form-grid">

                  <label className="growth-field">
                    <span>
                      Prénom
                    </span>

                    <input
                      value={
                        firstName
                      }
                      onChange={
                        event =>
                          setFirstName(
                            event.target
                              .value,
                          )
                      }
                      placeholder="Prénom"
                      autoFocus={
                        leadType
                          === "b2c"
                      }
                    />
                  </label>

                  <label className="growth-field">
                    <span>
                      Nom
                    </span>

                    <input
                      value={
                        lastName
                      }
                      onChange={
                        event =>
                          setLastName(
                            event.target
                              .value,
                          )
                      }
                      placeholder="Nom"
                    />
                  </label>

                  <label className="growth-field">
                    <span>
                      Email
                    </span>

                    <input
                      type="email"
                      value={
                        email
                      }
                      onChange={
                        event =>
                          setEmail(
                            event.target
                              .value,
                          )
                      }
                      placeholder="email@exemple.ch"
                    />
                  </label>

                  <label className="growth-field">
                    <span>
                      Téléphone
                    </span>

                    <input
                      value={
                        phone
                      }
                      onChange={
                        event =>
                          setPhone(
                            event.target
                              .value,
                          )
                      }
                      placeholder="+41 ..."
                    />
                  </label>

                  <label className="growth-field">
                    <span>
                      Ville
                    </span>

                    <input
                      value={
                        city
                      }
                      onChange={
                        event =>
                          setCity(
                            event.target
                              .value,
                          )
                      }
                      placeholder="Genève"
                    />
                  </label>

                  <label className="growth-field">
                    <span>
                      Pays
                    </span>

                    <input
                      value={
                        country
                      }
                      onChange={
                        event =>
                          setCountry(
                            event.target
                              .value,
                          )
                      }
                      placeholder="CH"
                    />
                  </label>

                </div>

              </div>


              <div className="growth-form-section">

                <div className="growth-form-section-heading">
                  <strong>
                    Acquisition
                  </strong>
                </div>

                <div className="growth-form-grid">

                  <label className="growth-field">
                    <span>
                      Source
                    </span>

                    <select
                      value={
                        source
                      }
                      onChange={
                        event =>
                          setSource(
                            event.target
                              .value,
                          )
                      }
                    >
                      <option value="manual">
                        Manuel
                      </option>

                      <option value="website">
                        Site web
                      </option>

                      <option value="referral">
                        Recommandation
                      </option>

                      <option value="csv">
                        CSV
                      </option>

                      <option value="scraping">
                        Scraping
                      </option>

                      <option value="partner">
                        Partenaire
                      </option>

                      <option value="other">
                        Autre
                      </option>
                    </select>
                  </label>

                  <label className="growth-field">
                    <span>
                      Détail source
                    </span>

                    <input
                      value={
                        sourceDetail
                      }
                      onChange={
                        event =>
                          setSourceDetail(
                            event.target
                              .value,
                          )
                      }
                      placeholder="Ex. Salon, formulaire..."
                    />
                  </label>

                </div>

              </div>


              <div className="growth-form-section">

                <div className="growth-form-section-heading">
                  <strong>
                    Potentiel commercial
                  </strong>
                </div>

                <label className="growth-field full">
                  <span>
                    Besoin
                  </span>

                  <textarea
                    value={
                      needSummary
                    }
                    onChange={
                      event =>
                        setNeedSummary(
                          event.target
                            .value,
                        )
                    }
                    placeholder="Résumé du besoin identifié..."
                    rows={3}
                  />
                </label>

                <div className="growth-form-grid three">

                  <label className="growth-field">
                    <span>
                      Valeur estimée
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={
                        estimatedValue
                      }
                      onChange={
                        event =>
                          setEstimatedValue(
                            event.target
                              .value,
                          )
                      }
                      placeholder="0"
                    />
                  </label>

                  <label className="growth-field">
                    <span>
                      Devise
                    </span>

                    <select
                      value={
                        currency
                      }
                      onChange={
                        event =>
                          setCurrency(
                            event.target
                              .value,
                          )
                      }
                    >
                      <option value="CHF">
                        CHF
                      </option>

                      <option value="EUR">
                        EUR
                      </option>

                      <option value="USD">
                        USD
                      </option>
                    </select>
                  </label>

                  <label className="growth-field">
                    <span>
                      Urgence
                    </span>

                    <select
                      value={
                        urgency
                      }
                      onChange={
                        event =>
                          setUrgency(
                            event.target
                              .value,
                          )
                      }
                    >
                      <option value="low">
                        Basse
                      </option>

                      <option value="medium">
                        Moyenne
                      </option>

                      <option value="high">
                        Haute
                      </option>

                      <option value="critical">
                        Critique
                      </option>
                    </select>
                  </label>

                </div>

              </div>


              <footer className="growth-modal-footer">

                <button
                  type="button"
                  className="button secondary"
                  onClick={
                    closeCreateLead
                  }
                  disabled={
                    createLeadLoading
                  }
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="button primary"
                  disabled={
                    createLeadLoading
                  }
                >
                  {createLeadLoading
                    ? "Création..."
                    : (
                      <>
                        <Plus
                          size={16}
                        />
                        Créer le lead
                      </>
                    )}
                </button>

              </footer>

            </form>

          </section>
        </div>
      ) : null}

    </div>
  )
}
