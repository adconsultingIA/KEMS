export type Contact = {
  id: string
  initials: string
  name: string
  email: string
  phone: string
  organization: string
  jobTitle: string
  source: string
  quality: number
  verified: boolean
  decisionMaker: boolean
  city: string
  country: string
}

export const contacts: Contact[] = [
  {
    id: "jean-dupont",
    initials: "JD",
    name: "Jean Dupont",
    email: "jean.dupont@example.ch",
    phone: "+41 79 123 45 67",
    organization: "Example Consulting SA",
    jobTitle: "Directeur",
    source: "Legacy import",
    quality: 94,
    verified: true,
    decisionMaker: true,
    city: "Genève",
    country: "Suisse",
  },
  {
    id: "sophie-martin",
    initials: "SM",
    name: "Sophie Martin",
    email: "sophie.martin@acme.ch",
    phone: "+41 79 555 12 34",
    organization: "ACME SA",
    jobTitle: "Responsable RH",
    source: "CSV",
    quality: 84,
    verified: false,
    decisionMaker: true,
    city: "Lausanne",
    country: "Suisse",
  },
  {
    id: "marc-durand",
    initials: "MD",
    name: "Marc Durand",
    email: "marc.durand@example.com",
    phone: "+33 6 22 18 40 12",
    organization: "Durand Partners",
    jobTitle: "CEO",
    source: "Growth Engine",
    quality: 76,
    verified: false,
    decisionMaker: true,
    city: "Lyon",
    country: "France",
  },
]

export const actions = [
  {
    id: "act-1",
    title: "Renouvellement Assurance",
    entity: "Jean Dupont",
    owner: "Naomie Nassara",
    priority: "Haute",
    due: "12 oct. 2026",
    source: "Assurance",
    context: "Client 720°",
  },
  {
    id: "act-2",
    title: "Doublon potentiel à contrôler",
    entity: "Marc Durand",
    owner: "Parfait ADJANOR",
    priority: "Moyenne",
    due: "Aujourd'hui",
    source: "Core",
    context: "Data Quality",
  },
  {
    id: "act-3",
    title: "Demande de conseil reçue",
    entity: "Sophie Martin",
    owner: "Euloge Santos",
    priority: "Moyenne",
    due: "Demain",
    source: "Client 360°",
    context: "Investissement",
  },
]

export const timeline = [
  {
    date: "Aujourd'hui",
    domain: "Commercial",
    title: "Appel enregistré",
    detail: "Échange avec Jean Dupont",
  },
  {
    date: "Hier",
    domain: "Assurance",
    title: "Document ajouté",
    detail: "Contrat entreprise",
  },
  {
    date: "24 sept.",
    domain: "Core",
    title: "Email vérifié",
    detail: "jean.dupont@example.ch",
  },
  {
    date: "18 sept.",
    domain: "Investissement",
    title: "Profil actualisé",
    detail: "Profil investisseur modéré",
  },
]
