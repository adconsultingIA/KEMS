import {
  Activity,
  Bot,
  Briefcase,
  Building2,
  Calculator,
  CreditCard,
  FileText,
  Folder,
  Handshake,
  LayoutDashboard,
  LifeBuoy,
  LineChart,
  Package,
  ScrollText,
  Settings,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Workflow,
  Wrench,
} from "lucide-react"
import type {
  LucideIcon,
} from "lucide-react"
import type {
  ProjectionKey,
} from "../context/projection-context"

export type NavigationItem = {
  label: string
  to: string
  icon: LucideIcon
}

export type DashboardMetric = {
  label: string
  value: string
  hint: string
}

export type ProjectionDefinition = {
  key: ProjectionKey
  label: string
  shortLabel: string
  description: string
  icon: LucideIcon
  nav: NavigationItem[]
  metrics: DashboardMetric[]
}

const actionCenter: NavigationItem = {
  label: "Action Center",
  to: "/hub/actions",
  icon: Workflow,
}

export const projectionDefinitions:
  Record<
    ProjectionKey,
    ProjectionDefinition
  > = {
    direction: {
      key: "direction",
      label: "Direction 720°",
      shortLabel: "Direction",
      description:
        "Pilotage transversal de l'ensemble des activités KEMS.",
      icon: LayoutDashboard,
      nav: [
        {
          label: "Pilotage global",
          to: "/hub",
          icon: LayoutDashboard,
        },
        {
          label: "Growth Engine",
          to: "/hub/growth",
          icon: LineChart,
        },
        {
          label: "Contacts",
          to: "/hub/contacts",
          icon: Users,
        },
        {
          label: "Organisations",
          to: "/hub/organizations",
          icon: Building2,
        },
        actionCenter,
        {
          label: "Activité / Audit",
          to: "/hub/audit",
          icon: ScrollText,
        },
        {
          label: "Administration",
          to: "/hub/settings",
          icon: Settings,
        },
      ],
      metrics: [
        {
          label: "Clients actifs",
          value: "1 482",
          hint: "+4,8% ce mois",
        },
        {
          label: "Organisations",
          value: "326",
          hint: "94% qualifiées",
        },
        {
          label: "Opportunités",
          value: "CHF 2.4 M",
          hint: "Pipeline ouvert",
        },
        {
          label: "Actions critiques",
          value: "12",
          hint: "4 à traiter aujourd'hui",
        },
        {
          label: "Data Quality",
          value: "94%",
          hint: "17 doublons à revoir",
        },
      ],
    },

    commercial: {
      key: "commercial",
      label: "Commercial",
      shortLabel: "Commercial",
      description:
        "Prospection, portefeuille commercial, opportunités et conversion.",
      icon: Handshake,
      nav: [
        {
          label: "Dashboard",
          to: "/hub",
          icon: LayoutDashboard,
        },
        {
          label: "Clients",
          to: "/hub/contacts",
          icon: Users,
        },
        {
          label: "Organisations",
          to: "/hub/organizations",
          icon: Building2,
        },
        {
          label: "Prospects",
          to: "/hub/business/commercial/prospects",
          icon: Briefcase,
        },
        {
          label: "Opportunités",
          to: "/hub/business/commercial/opportunities",
          icon: TrendingUp,
        },
        {
          label: "Growth Engine",
          to: "/hub/growth",
          icon: LineChart,
        },
        actionCenter,
      ],
      metrics: [
        {
          label: "Prospects actifs",
          value: "184",
          hint: "+23 ce mois",
        },
        {
          label: "Opportunités",
          value: "46",
          hint: "Pipeline actif",
        },
        {
          label: "Valeur pipeline",
          value: "CHF 2.4 M",
          hint: "Toutes briques",
        },
        {
          label: "Relances",
          value: "17",
          hint: "Cette semaine",
        },
        {
          label: "Conversion",
          value: "28%",
          hint: "+3 pts",
        },
      ],
    },

    assurance: {
      key: "assurance",
      label: "Assurance",
      shortLabel: "Assurance",
      description:
        "Portefeuille, contrats, renouvellements et dossiers Assurance.",
      icon: ShieldCheck,
      nav: [
        {
          label: "Dashboard",
          to: "/hub",
          icon: LayoutDashboard,
        },
        {
          label: "Clients",
          to: "/hub/contacts",
          icon: Users,
        },
        {
          label: "Organisations",
          to: "/hub/organizations",
          icon: Building2,
        },
        {
          label: "Contrats",
          to: "/hub/business/assurance/contracts",
          icon: ShieldCheck,
        },
        {
          label: "Renouvellements",
          to: "/hub/business/assurance/renewals",
          icon: Activity,
        },
        {
          label: "Opportunités",
          to: "/hub/business/assurance/opportunities",
          icon: TrendingUp,
        },
        {
          label: "Dossiers",
          to: "/hub/business/assurance/cases",
          icon: Folder,
        },
        {
          label: "Documents",
          to: "/hub/business/assurance/documents",
          icon: FileText,
        },
        actionCenter,
      ],
      metrics: [
        {
          label: "Clients Assurance",
          value: "286",
          hint: "Portefeuille actif",
        },
        {
          label: "Contrats actifs",
          value: "412",
          hint: "+8% sur 12 mois",
        },
        {
          label: "Renouvellements",
          value: "31",
          hint: "60 prochains jours",
        },
        {
          label: "Dossiers ouverts",
          value: "24",
          hint: "6 prioritaires",
        },
        {
          label: "Opportunités",
          value: "38",
          hint: "À convertir",
        },
      ],
    },

    investissement: {
      key: "investissement",
      label: "Investissement",
      shortLabel: "Investissement",
      description:
        "Portefeuilles, opportunités et suivi des dossiers Investissement.",
      icon: TrendingUp,
      nav: [
        {
          label: "Dashboard",
          to: "/hub",
          icon: LayoutDashboard,
        },
        {
          label: "Clients",
          to: "/hub/contacts",
          icon: Users,
        },
        {
          label: "Organisations",
          to: "/hub/organizations",
          icon: Building2,
        },
        {
          label: "Portefeuilles",
          to: "/hub/business/investissement/portfolios",
          icon: Activity,
        },
        {
          label: "Opportunités",
          to: "/hub/business/investissement/opportunities",
          icon: TrendingUp,
        },
        {
          label: "Dossiers",
          to: "/hub/business/investissement/cases",
          icon: Folder,
        },
        {
          label: "Documents",
          to: "/hub/business/investissement/documents",
          icon: FileText,
        },
        actionCenter,
      ],
      metrics: [
        {
          label: "Clients",
          value: "184",
          hint: "Profils actifs",
        },
        {
          label: "Dossiers actifs",
          value: "96",
          hint: "12 nouveaux",
        },
        {
          label: "Portefeuilles suivis",
          value: "71",
          hint: "Vue consolidée",
        },
        {
          label: "Opportunités",
          value: "29",
          hint: "En analyse",
        },
        {
          label: "Actions",
          value: "14",
          hint: "À traiter",
        },
      ],
    },

    fiduciaire: {
      key: "fiduciaire",
      label: "Fiduciaire",
      shortLabel: "Fiduciaire",
      description:
        "Mandats, dossiers, échéances et opérations Fiduciaire.",
      icon: Calculator,
      nav: [
        {
          label: "Dashboard",
          to: "/hub",
          icon: LayoutDashboard,
        },
        {
          label: "Clients",
          to: "/hub/contacts",
          icon: Users,
        },
        {
          label: "Organisations",
          to: "/hub/organizations",
          icon: Building2,
        },
        {
          label: "Mandats",
          to: "/hub/business/fiduciaire/mandates",
          icon: Briefcase,
        },
        {
          label: "Dossiers",
          to: "/hub/business/fiduciaire/cases",
          icon: Folder,
        },
        {
          label: "Échéances",
          to: "/hub/business/fiduciaire/deadlines",
          icon: Activity,
        },
        {
          label: "Documents",
          to: "/hub/business/fiduciaire/documents",
          icon: FileText,
        },
        actionCenter,
      ],
      metrics: [
        {
          label: "Clients",
          value: "73",
          hint: "Mandats actifs",
        },
        {
          label: "Mandats",
          value: "91",
          hint: "Tous services",
        },
        {
          label: "Échéances",
          value: "18",
          hint: "30 prochains jours",
        },
        {
          label: "Dossiers ouverts",
          value: "42",
          hint: "5 prioritaires",
        },
        {
          label: "Actions",
          value: "11",
          hint: "À traiter",
        },
      ],
    },

    technologies: {
      key: "technologies",
      label: "Technologies",
      shortLabel: "Technologies",
      description:
        "Cycle commercial et opérationnel complet des activités Technologies.",
      icon: Sparkles,
      nav: [
        {
          label: "Dashboard",
          to: "/hub",
          icon: LayoutDashboard,
        },
        {
          label: "Clients",
          to: "/hub/contacts",
          icon: Users,
        },
        {
          label: "Organisations",
          to: "/hub/organizations",
          icon: Building2,
        },
        {
          label: "Opportunités",
          to: "/hub/business/technologies/opportunities",
          icon: TrendingUp,
        },
        {
          label: "Devis",
          to: "/hub/business/technologies/quotes",
          icon: FileText,
        },
        {
          label: "Projets",
          to: "/hub/business/technologies/projects",
          icon: Folder,
        },
        {
          label: "Maintenance",
          to: "/hub/business/technologies/maintenance",
          icon: Wrench,
        },
        {
          label: "Tickets",
          to: "/hub/business/technologies/tickets",
          icon: LifeBuoy,
        },
        {
          label: "Livrables",
          to: "/hub/business/technologies/deliverables",
          icon: Package,
        },
        {
          label: "Facturation",
          to: "/hub/business/technologies/billing",
          icon: CreditCard,
        },
        {
          label: "Intégrations",
          to: "/hub/business/technologies/integrations",
          icon: Workflow,
        },
        {
          label: "Automatisations",
          to: "/hub/business/technologies/automations",
          icon: Bot,
        },
        actionCenter,
      ],
      metrics: [
        {
          label: "Clients actifs",
          value: "18",
          hint: "Portefeuille Technologies",
        },
        {
          label: "Opportunités",
          value: "7",
          hint: "Pipeline ouvert",
        },
        {
          label: "Devis ouverts",
          value: "5",
          hint: "2 à relancer",
        },
        {
          label: "Projets actifs",
          value: "6",
          hint: "1 prioritaire",
        },
        {
          label: "Tickets ouverts",
          value: "9",
          hint: "2 urgents",
        },
      ],
    },
  }


export const directionBusinessCards = [
  {
    context: "commercial" as const,
    label: "Commercial",
    value: "CHF 2.4 M",
    hint: "Pipeline ouvert",
    icon: Handshake,
  },
  {
    context: "assurance" as const,
    label: "Assurance",
    value: "412",
    hint: "Contrats actifs",
    icon: ShieldCheck,
  },
  {
    context: "investissement" as const,
    label: "Investissement",
    value: "96",
    hint: "Dossiers actifs",
    icon: TrendingUp,
  },
  {
    context: "fiduciaire" as const,
    label: "Fiduciaire",
    value: "91",
    hint: "Mandats",
    icon: Calculator,
  },
  {
    context: "technologies" as const,
    label: "Technologies",
    value: "6",
    hint: "Projets actifs",
    icon: Sparkles,
  },
]
