// Socijalni dosije: lični podaci korisnika koji se ponavljaju u dokumentima, stručni dokumenti
// (prijemna procena, procena, individualni plan usluge, pregled plana) i rokovi po
// Pravilniku o bližim uslovima i standardima za pružanje usluga socijalne zaštite.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/api/api";

// ── Profil ──────────────────────────────────────────────────────────────

export interface SocialContact {
  _id?: string;
  name: string;
  relation: string;
  phone: string;
  email: string;
  address: string;
  emergency: boolean;
  note: string;
}

export type ApplicantKind = "" | "self" | "relative" | "guardian" | "other";

/** Podnosilac zahteva / obveznik ugovora (potpisuje zahtev, izjave i ugovor) */
export interface Applicant {
  kind: ApplicantKind;
  name: string;
  relation: string;
  sex: "" | "M" | "Ž";
  address: string;
  jmbg: string;
  idCardNumber: string;
  email: string;
  phone: string;
  messenger: string;
}

/** Obveznik ugovora: "" = isti kao podnosilac zahteva, "other" = drugo lice, "none" = nema obveznika */
export type ObligorSource = "" | "other" | "none";
export interface Obligor {
  source: ObligorSource;
  name: string;
  relation: string;
  address: string;
  jmbg: string;
  idCardNumber: string;
  email: string;
  phone: string;
  messenger: string;
}

/** Socijalno-zdravstveni podaci — obrazac 4 (list o socijalno-anamnestičkim podacima), delovi II–V */
export interface SocialHealth {
  /** Datum lista ("U Beogradu, ___ godine"); prazno = datum prijema */
  date: string | null;
  mobility: string;
  selfCare: string;
  communication: string;
  chronicIllness: string;
  healthOther: string;
  family: string;
  familyOther: string;
  requestedBy: string;
  reasons: string;
  userAttitude: string;
  relativesAttitude: string;
  circumstances: string;
  commission: string;
}
export const EMPTY_SOCIAL_HEALTH: SocialHealth = { date: null, mobility: "", selfCare: "", communication: "", chronicIllness: "", healthOther: "", family: "", familyOther: "", requestedBy: "", reasons: "", userAttitude: "", relativesAttitude: "", circumstances: "", commission: "" };

export interface SocialProfileInput {
  jmbg: string;
  parentName: string;
  maidenName: string;
  fatherName: string;
  motherName: string;
  motherMaidenName: string;
  spouse: { name: string; maidenName: string; address: string };
  phone: string;
  email: string;
  messenger: string;
  payerNote: string;
  socialStatus: string;
  insuranceBasis: string;
  property: string;
  diagnosis: string;
  requestDate: string | null;
  applicant: Applicant;
  obligor: Obligor;
  socialHealth: SocialHealth;
  trustee: { name: string; address: string; idCardNumber: string; phone: string };
  contract: { roomType: "" | "single" | "double" | "any"; categories: number[]; priceEUR: number | null; bankAccount: string };
  dischargeReason: number;
  birthPlace: string;
  sex: "" | "M" | "Ž";
  citizenship: string;
  nationality: string;
  language: string;
  religion: string;
  maritalStatus: "" | "single" | "married" | "partnership" | "divorced" | "widowed";
  education: string;
  occupation: string;
  idCardNumber: string;
  healthInsuranceNumber: string;
  chosenDoctor: string;
  municipality: string;
  dossierNumber: string;
  accommodation: string;
  pensionType: "" | "old_age" | "family" | "disability" | "foreign" | "none" | "other";
  incomeNote: string;
  payer: "" | "resident" | "family" | "csr" | "mixed" | "other";
  legalCapacity: "" | "full" | "partial" | "none";
  guardian: { name: string; relation: string; address: string; phone: string; decisionNumber: string; decisionDate: string | null; authority: string };
  trustedPerson: { name: string; relation: string; phone: string };
  placementBasis: "" | "contract" | "csr";
  contractNumber: string;
  contractDate: string | null;
  csrName: string;
  caseManager: string;
  csrDecisionNumber: string;
  csrDecisionDate: string | null;
  contacts: SocialContact[];
  assignedStaff: string | null;
}

export interface StaffRef {
  _id: string;
  name: string;
  lastName: string;
  role: string;
}

export interface SocialProfile extends Omit<SocialProfileInput, "assignedStaff"> {
  _id: string;
  supportLevel: number;
  assignedStaff: StaffRef | null;
  updatedAt: string;
}

export interface DossierPatient {
  _id: string;
  name: string;
  lastName: string;
  dateOfBirth: string | null;
  address: string;
  admissionDate: string;
  dischargeDate?: string | null;
  contactPerson?: string;
  previousStays?: Array<{ admissionDate: string; dischargeDate: string }>;
}

export const EMPTY_APPLICANT: Applicant = { kind: "", name: "", relation: "", sex: "", address: "", jmbg: "", idCardNumber: "", email: "", phone: "", messenger: "" };
export const EMPTY_OBLIGOR: Obligor = { source: "", name: "", relation: "", address: "", jmbg: "", idCardNumber: "", email: "", phone: "", messenger: "" };

export const EMPTY_PROFILE: SocialProfileInput = {
  jmbg: "",
  parentName: "",
  maidenName: "",
  fatherName: "",
  motherName: "",
  motherMaidenName: "",
  spouse: { name: "", maidenName: "", address: "" },
  phone: "",
  email: "",
  messenger: "",
  payerNote: "",
  socialStatus: "",
  insuranceBasis: "",
  property: "",
  diagnosis: "",
  requestDate: null,
  applicant: { ...EMPTY_APPLICANT },
  obligor: { ...EMPTY_OBLIGOR },
  socialHealth: { ...EMPTY_SOCIAL_HEALTH },
  trustee: { name: "", address: "", idCardNumber: "", phone: "" },
  contract: { roomType: "", categories: [], priceEUR: null, bankAccount: "" },
  dischargeReason: 0,
  birthPlace: "",
  sex: "",
  citizenship: "",
  nationality: "",
  language: "",
  religion: "",
  maritalStatus: "",
  education: "",
  occupation: "",
  idCardNumber: "",
  healthInsuranceNumber: "",
  chosenDoctor: "",
  municipality: "",
  dossierNumber: "",
  accommodation: "",
  pensionType: "",
  incomeNote: "",
  payer: "",
  legalCapacity: "",
  guardian: { name: "", relation: "", address: "", phone: "", decisionNumber: "", decisionDate: null, authority: "" },
  trustedPerson: { name: "", relation: "", phone: "" },
  placementBasis: "",
  contractNumber: "",
  contractDate: null,
  csrName: "",
  caseManager: "",
  csrDecisionNumber: "",
  csrDecisionDate: null,
  contacts: [],
  assignedStaff: null,
};

/** Profil iz baze → vrednosti forme (datumi kao "YYYY-MM-DD") */
export function profileToInput(p: SocialProfile | null): SocialProfileInput {
  if (!p) return structuredClone(EMPTY_PROFILE);
  const d = (v: string | null | undefined) => (v ? v.slice(0, 10) : null);
  return {
    ...structuredClone(EMPTY_PROFILE),
    ...p,
    guardian: { ...EMPTY_PROFILE.guardian, ...p.guardian, decisionDate: d(p.guardian?.decisionDate) },
    trustedPerson: { ...EMPTY_PROFILE.trustedPerson, ...p.trustedPerson },
    contractDate: d(p.contractDate),
    csrDecisionDate: d(p.csrDecisionDate),
    requestDate: d(p.requestDate),
    spouse: { ...EMPTY_PROFILE.spouse, ...p.spouse },
    applicant: { ...EMPTY_APPLICANT, ...p.applicant },
    obligor: { ...EMPTY_OBLIGOR, ...p.obligor },
    socialHealth: { ...EMPTY_SOCIAL_HEALTH, ...p.socialHealth, date: d(p.socialHealth?.date) },
    trustee: { ...EMPTY_PROFILE.trustee, ...p.trustee },
    contract: { ...EMPTY_PROFILE.contract, ...p.contract, categories: [...(p.contract?.categories ?? [])] },
    contacts: (p.contacts ?? []).map((c) => ({ ...c })),
    assignedStaff: p.assignedStaff?._id ?? null,
  };
}

export const SEX_LABEL: Record<string, string> = { M: "muški", Ž: "ženski" };
export const APPLICANT_LABEL: Record<string, string> = { self: "sam korisnik", relative: "srodnik", guardian: "staratelj", other: "drugo lice" };
export const OBLIGOR_LABEL: Record<ObligorSource, string> = { "": "Isti kao podnosilac zahteva", other: "Drugo lice (upisati podatke)", none: "Nema obveznika — korisnik potpisuje sam" };
/** Ugovor čl. 2 */
export const ROOM_LABEL: Record<string, string> = { single: "jednokrevetna soba", double: "dvokrevetna soba", any: "nevezano za kategoriju sobe" };
/** Ugovor čl. 3 — redom kao u ugovoru (1–10) */
export const USER_CATEGORIES = ["Pokretan", "Polupokretan", "Nepokretan", "Dementan", "Dezorijentisan", "Hronično oboleo", "Orijentisan", "Zavisan", "Poluzavisan", "Nezavisan"];
/** Odluka o prestanku smeštaja — osnovi redom kao u obrascu 14 (1–7) */
export const DISCHARGE_REASONS = [
  "Neizmirena obaveza plaćanja ili druge ugovorne obaveze",
  "Nepoštovanje pravila ponašanja u Domu",
  "Namerna ili nepažnjom naneta materijalna šteta / narušen ugled Doma",
  "Pad psiho-fizičkih sposobnosti koji ugrožava korisnika i druge",
  "Nema sredstava za dalji boravak u Domu",
  "Izričita volja korisnika / zastupnika",
  "Smrt korisnika",
];
export const MARITAL_LABEL: Record<string, string> = {
  single: "neoženjen / neudata",
  married: "u braku",
  partnership: "vanbračna zajednica",
  divorced: "razveden / razvedena",
  widowed: "udovac / udovica",
};
export const LEGAL_CAPACITY_LABEL: Record<string, string> = {
  full: "poslovno sposoban",
  partial: "delimično lišen poslovne sposobnosti",
  none: "potpuno lišen poslovne sposobnosti",
};
export const PLACEMENT_LABEL: Record<string, string> = { contract: "ugovor sa korisnikom / porodicom", csr: "rešenje / uput centra za socijalni rad" };
export const PAYER_LABEL: Record<string, string> = { resident: "korisnik", family: "porodica", csr: "CSR / opština", mixed: "više platilaca", other: "drugo" };
export const PENSION_LABEL: Record<string, string> = {
  old_age: "starosna",
  family: "porodična",
  disability: "invalidska",
  foreign: "inostrana",
  none: "bez penzije",
  other: "drugo",
};
export const SUPPORT_LEVELS: Array<{ value: number; label: string; hint: string }> = [
  { value: 1, label: "I stepen", hint: "Nije sposoban da se samostalno brine o sebi; potrebna kontinuirana pomoć" },
  { value: 2, label: "II stepen", hint: "Brine o sebi uz fizičko prisustvo i pomoć drugog lica" },
  { value: 3, label: "III stepen", hint: "Potreban nadzor i podrška" },
  { value: 4, label: "IV stepen", hint: "Samostalno, odnosno uz podsećanje obavlja životne aktivnosti" },
];

/** JMBG: 13 cifara i ispravna kontrolna cifra (ista provera kao na serveru) */
export function isValidJmbg(jmbg: string): boolean {
  if (!/^\d{13}$/.test(jmbg)) return false;
  const d = [...jmbg].map(Number);
  const sum = [7, 6, 5, 4, 3, 2].reduce((s, k, i) => s + k * (d[i]! + d[i + 6]!), 0);
  let m = 11 - (sum % 11);
  if (m > 9) m = 0;
  return m === d[12];
}

/** Datum rođenja ("YYYY-MM-DD") i pol iz ispravnog JMBG-a (DDMMGGG RR BBB K; BBB < 500 = muški) */
export function jmbgInfo(jmbg: string): { birthDate: string; sex: "M" | "Ž" } | null {
  if (!isValidJmbg(jmbg)) return null;
  const day = Number(jmbg.slice(0, 2));
  const month = Number(jmbg.slice(2, 4));
  const yyy = Number(jmbg.slice(4, 7));
  const year = yyy >= 800 ? 1000 + yyy : 2000 + yyy;
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null;
  return { birthDate: d.toISOString().slice(0, 10), sex: Number(jmbg.slice(9, 12)) < 500 ? "M" : "Ž" };
}

/** Šta JMBG kaže o datumu rođenja i polu, i da li se slaže sa unetim */
export function jmbgCheck(jmbg: string, dateOfBirth: string) {
  const clean = jmbg.replace(/\s/g, "");
  if (!clean) return { invalid: false, info: null, mismatch: false };
  const info = jmbgInfo(clean);
  return { invalid: !isValidJmbg(clean) || !info, info, mismatch: !!info && !!dateOfBirth && dateOfBirth !== info.birthDate };
}

// ── Osnovni podaci (žive u kartonu korisnika — jedan izvor za celu aplikaciju) ──

export interface PatientBasics {
  name: string;
  lastName: string;
  /** "YYYY-MM-DD" ili "" */
  dateOfBirth: string;
  address: string;
}

export const basicsOf = (p: DossierPatient | null | undefined): PatientBasics => ({
  name: p?.name ?? "",
  lastName: p?.lastName ?? "",
  dateOfBirth: p?.dateOfBirth ? p.dateOfBirth.slice(0, 10) : "",
  address: p?.address ?? "",
});

/** Samo polja koja su se promenila (delimično čuvanje ne prepisuje tuđe izmene drugih polja) */
export function changedFields<T extends object>(before: T, after: T): Partial<T> {
  const out: Partial<T> = {};
  for (const key of Object.keys(after) as Array<keyof T>) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) out[key] = after[key];
  }
  return out;
}

/** Šta još nedostaje u dosijeu (za podsetnik i procenat popunjenosti) */
export function missingInfo(basics: PatientBasics, p: SocialProfileInput): string[] {
  const checks: Array<[boolean, string]> = [
    [!!basics.dateOfBirth, "datum rođenja"],
    [!!basics.address, "adresa"],
    [!!p.jmbg, "JMBG"],
    [!!p.healthInsuranceNumber, "LBO"],
    [!!p.placementBasis, "osnov smeštaja"],
    [!!p.legalCapacity, "poslovna sposobnost"],
    [p.contacts.length > 0, "kontakt porodice"],
    [!!p.assignedStaff, "zaduženi zaposleni"],
  ];
  return checks.filter(([ok]) => !ok).map(([, label]) => label);
}
export const DOSSIER_CHECKS = 8;

// ── Dokumenti ───────────────────────────────────────────────────────────

export type DocType = "intake" | "anamnesis" | "assessment" | "support_scale" | "plan" | "plan_review" | "reassessment";

export interface PlanGoal {
  _id?: string;
  /** Oblast, npr. Adaptacija, Socijalni kontakti, Ostvarivanje prava */
  area: string;
  goal: string;
  outcome: string;
  activities: string;
  responsible: string;
  due: string | null;
  status: "" | "achieved" | "partial" | "not_achieved";
}

export interface SocialDocument {
  _id: string;
  updatedAt: string;
  type: DocType;
  date: string;
  status: "draft" | "final";
  sections: Record<string, string>;
  supportLevel: number;
  participants: string;
  goals: PlanGoal[];
  nextReview: string | null;
  /** Skala podrške (obrazac 11): ocena stanja na prijemu i očekivanog ishoda, 1–4 */
  scale?: Record<string, ScaleScore>;
  author: StaffRef;
  finalizedBy: StaffRef | null;
  finalizedAt: string | null;
}

export interface DocumentInput {
  date: string;
  sections: Record<string, string>;
  supportLevel: number;
  participants: string;
  goals: PlanGoal[];
  nextReview: string | null;
  scale: Record<string, ScaleScore>;
}

export interface ScaleScore {
  now: number | null;
  expected: number | null;
}

interface SectionMeta {
  key: string;
  label: string;
  hint: string;
}

// Delovi dokumenata — TAČNO kao na obrascima doma (isti ključevi na serveru i u Word obrascima)
const S = (key: string, label: string, hint = ""): SectionMeta => ({ key, label, hint });

export interface DocTypeMeta {
  label: string;
  short: string;
  /** Broj obrasca doma */
  form: string;
  article: string;
  description: string;
  sections: SectionMeta[];
  /** Raniji oblik: stepen podrške se birao ručno */
  levels?: boolean;
  /** Raniji oblik plana: ciljevi kao lista */
  goals?: boolean;
  /** Datum u obrascu posle datuma dokumenta (npr. planirani datum evaluacije) */
  nextDate?: { label: string; hint: string; months: number };
  /** Skala za procenu stepena podrške (obrazac 11) */
  scale?: boolean;
  /** Ne nudi se za novi dokument (samo postojeći zapisi) */
  legacy?: boolean;
}

export const DOC_TYPES: Record<DocType, DocTypeMeta> = {
  intake: {
    label: "Prijemna procena",
    short: "Prijemna procena",
    form: "2",
    article: "čl. 12",
    description: "Pre početka korišćenja usluge: da li dom može da odgovori na potrebe korisnika.",
    sections: [
      S("attitude", "Stav korisnika i drugih značajnih lica i njihova očekivanja od usluge", "npr. Stav srodnice prema prijemu: saglasna. Očekivanja: nega i nadzor medicinskog osoblja."),
      S("eligibility", "Podobnost korisnika za korišćenje usluge", "npr. Korisnik se smatra podobnim za korišćenje usluge domskog smeštaja."),
      S("priority", "Prioritet za prijem — datum korišćenja usluge", "npr. Bez liste čekanja, prijem realizovan … godine."),
      S("abilities", "Sposobnosti i prioritetne potrebe potencijalnog korisnika"),
      S("capacity", "Kapacitet pružaoca usluge da zadovolji potrebe korisnika", "npr. Po obavljenom intervjuu i uvidu u spise… Dom trenutno ispunjava tražene uslove."),
    ],
  },
  anamnesis: {
    label: "Socijalno-anamnestički list",
    short: "Anamnestički list",
    form: "4",
    article: "DS-2",
    description: "Raniji zapis. List se sada popunjava u kartonu (kartica „Socijalno-zdravstveni podaci“).",
    legacy: true,
    sections: [
      S("mobility", "II.1 Pokretljivost"),
      S("selfCare", "II.2 Sposobnost za brigu o sebi"),
      S("communication", "II.3 Sposobnost komunikacije"),
      S("chronicIllness", "II.4 Hronične bolesti"),
      S("healthOther", "II.5 Ostalo (zdravstveno stanje)"),
      S("family", "III.1 Porodica i porodični odnosi"),
      S("familyOther", "III.7 Ostalo (porodično stanje)"),
      S("requestedBy", "IV.1 Po čijem zahtevu je tražen smeštaj"),
      S("reasons", "IV.2 Razlozi smeštaja"),
      S("userAttitude", "IV.3 Stav stare osobe o smeštaju"),
      S("relativesAttitude", "IV.4 Stav najbližih srodnika o smeštaju"),
      S("circumstances", "IV.5 Posebne okolnosti (lečenje, režim života, navike)"),
      S("commission", "V. Mišljenje i odluka komisije za prijem"),
    ],
  },
  assessment: {
    label: "Procena",
    short: "Procena",
    form: "10",
    article: "čl. 13",
    description: "Potrebe, snage, rizici, sposobnosti i interesovanja korisnika — u roku od 10 dana od prijema.",
    sections: [S("needs", "Potrebe korisnika"), S("priorityNeeds", "Prioritetne potrebe"), S("strengths", "Snage"), S("risks", "Rizici"), S("abilities", "Sposobnosti"), S("interests", "Interesovanja")],
  },
  support_scale: {
    label: "Određivanje stepena potrebne podrške",
    short: "Stepen podrške",
    form: "11",
    article: "čl. 14",
    description: "Skala od 25 stavki; zbirove i stepen podrške aplikacija računa sama. Zaključen stepen prelazi u karton.",
    sections: [S("duration", "Vremensko trajanje usluge", "npr. neodređeno"), S("otherProblems", "Drugi problemi"), S("observations", "Zapažanja")],
    scale: true,
    nextDate: { label: "Datum ponovne procene", hint: "Obično za 12 meseci.", months: 12 },
  },
  plan: {
    label: "Individualni plan usluge",
    short: "Individualni plan",
    form: "12",
    article: "čl. 16",
    description: "U roku od 10 dana od procene. Korisnik dobija primerak.",
    sections: [
      S("otherProblems", "Drugi problemi"),
      S("goals", "Ciljevi koji se žele postići pružanjem usluge", "Svaki cilj u novom redu: 1. … 2. …"),
      S("activities", "Aktivnosti, usluge i mere"),
      S("outcomes", "Očekivani ishodi"),
      S("timeframe", "Vremenski okvir u kojem se realizuje plan usluge", "npr. Godinu dana."),
      S("evaluationMethod", "Način evaluacije", "npr. Izveštaj — ponovni pregled, evaluacija."),
      S("responsible", "Odgovorna osoba zadužena za korisnika", "npr. socijalni radnik"),
      S("implementers", "Imena lica odgovornih za realizaciju plana usluge", "npr. Svi zaposleni iz delokruga svog posla."),
    ],
    nextDate: { label: "Planirani datum evaluacije", hint: "Najkasnije 12 meseci (čl. 17).", months: 12 },
  },
  plan_review: {
    label: "Ponovni pregled individualnog plana",
    short: "Ponovni pregled",
    form: "13",
    article: "čl. 17",
    description: "Evaluacija — procena uspešnosti realizacije individualnog plana usluge.",
    sections: [
      S("otherProblems", "Drugi problemi"),
      S("selfCare", "Sposobnosti neposredne brige o sebi i kretanja u objektu doma i spoljnoj sredini"),
      S("communication", "Komunikacija i orijentacija"),
      S("social", "Socijalni odnosi u domu i učešće u organizovanim aktivnostima"),
      S("family", "Odnos sa porodicom, srodnicima i drugim licima značajnim za korisnika"),
      S("satisfaction", "Zadovoljstvo korisnika i srodnika smeštajem i uslugama"),
      S("progress", "Oblasti u kojima jeste/nije postignut napredak"),
      S("adjustments", "Prilagođavanje aktivnosti potrebama korisnika, ciljevima i ostvarenim efektima usluge"),
    ],
  },
  reassessment: {
    label: "Ponovna procena (raniji oblik)",
    short: "Ponovna procena",
    form: "",
    article: "čl. 13",
    description: "Raniji oblik ponovne procene — nova procena se radi kao Procena (obrazac 10).",
    sections: [
      S("changes", "Šta se promenilo"),
      S("socialHistory", "Socijalna anamneza"),
      S("health", "Zdravstveno stanje"),
      S("selfCare", "Briga o sebi"),
      S("mental", "Kognitivno i psihičko stanje"),
      S("socialTies", "Porodica i socijalne veze"),
      S("risks", "Rizici"),
      S("needs", "Potrebe"),
      S("userView", "Mišljenje korisnika i porodice"),
      S("conclusion", "Zaključak"),
    ],
    levels: true,
    legacy: true,
  },
};

/** Nazivi delova iz ranijeg oblika dokumenata (prikazuju se samo za čitanje) */
export const LEGACY_SECTION_LABEL: Record<string, string> = {
  request: "Zahtev",
  userAttitude: "Stav korisnika",
  outcome: "Ishod",
  alternatives: "Druge usluge u zajednici",
  socialHistory: "Socijalna anamneza",
  health: "Zdravstveno stanje",
  selfCare: "Briga o sebi",
  mental: "Kognitivno i psihičko stanje",
  communication: "Komunikacija",
  socialTies: "Porodica i socijalne veze",
  culture: "Kulturne i lične posebnosti",
  userView: "Mišljenje korisnika i porodice",
  conclusion: "Zaključak",
  summary: "Osnov plana",
  adaptation: "Period prilagođavanja",
  changes: "Izmene",
};

export const DOC_ORDER: DocType[] = ["intake", "anamnesis", "assessment", "support_scale", "plan", "plan_review"];

// ── Skala podrške (obrazac 11) ──────────────────────────────────────────
// Isto kao na serveru (services/social/supportScale.ts): ocena 1–4 (4 = potpuno zavisan),
// stepen iz proseka stanja na prijemu: I = najviše podrške, IV = samostalno.
export const SCALE_GROUPS: Array<{ key: string; label: string; items: Array<[string, string]> }> = [
  {
    key: "daily",
    label: "Svakodnevne životne aktivnosti",
    items: [["toilet", "Upotreba toaleta"], ["hygiene", "Održavanje lične higijene"], ["dressing", "Oblačenje i svlačenje odeće"], ["footwear", "Obuvanje i izuvanje obuće"], ["meals", "Uzimanje obroka"], ["medication", "Uzimanje propisane terapije"]],
  },
  {
    key: "instrumental",
    label: "Instrumentalne životne veštine",
    items: [["transport", "Korišćenje javnog prevoza"], ["services", "Korišćenje javnih službi"], ["shopping", "Kupovina (namirnice i ostalo)"], ["money", "Raspolaganje novcem"], ["housekeeping", "Održavanje higijene ličnog i zajedničkog prostora"], ["cooking", "Pripremanje hrane i napitaka"], ["phone", "Korišćenje telefona"], ["orientationSpace", "Orijentacija u prostoru"]],
  },
  {
    key: "social",
    label: "Funkcionisanje u socijalnom okruženju",
    items: [["rules", "Odnos prema pravilima"], ["peers", "Odnos prema vršnjacima"], ["others", "Odnos prema drugim osobama"], ["family", "Održavanje porodičnih odnosa"], ["groups", "Grupne aktivnosti — učešće u zajednici"], ["danger", "Izbegavanje opasnosti"], ["orientationTime", "Orijentacija u vremenu"], ["communication", "Komunikacija"], ["aggression", "Agresivnost"]],
  },
  { key: "mobility", label: "Mobilnost", items: [["indoor", "Mobilnost unutar ustanove"], ["outdoor", "Mobilnost u spoljnoj sredini"]] },
];
export const SCALE_POINTS: Array<{ value: number; label: string }> = [
  { value: 1, label: "samostalno" },
  { value: 2, label: "uz povremenu pomoć / nadzor" },
  { value: 3, label: "uz stalnu pomoć" },
  { value: 4, label: "potpuno zavisan" },
];

export function scaleSummary(scale: Record<string, ScaleScore>) {
  const sum = (keys: string[], col: keyof ScaleScore) => keys.reduce((s, k) => s + (Number(scale[k]?.[col]) || 0), 0);
  const groups = SCALE_GROUPS.map((g) => {
    const keys = g.items.map(([k]) => k);
    return { key: g.key, label: g.label, now: sum(keys, "now"), expected: sum(keys, "expected") };
  });
  const all = SCALE_GROUPS.flatMap((g) => g.items.map(([k]) => k));
  const rated = all.filter((k) => Number(scale[k]?.now) >= 1).length;
  const totalNow = sum(all, "now");
  const avg = rated ? totalNow / rated : 0;
  // Veća zavisnost = niži stepen (I = najviše podrške, IV = samostalno)
  const level = !rated ? 0 : avg <= 1.75 ? 4 : avg <= 2.5 ? 3 : avg <= 3.25 ? 2 : 1;
  return { groups, totalNow, totalExpected: sum(all, "expected"), rated, of: all.length, level };
}

export const GOAL_STATUS_LABEL: Record<string, string> = { achieved: "ostvaren", partial: "delimično", not_achieved: "nije ostvaren" };

// ── Rokovi ──────────────────────────────────────────────────────────────

export interface SocialDeadline {
  patient: { _id: string; name: string; lastName: string };
  kind: "assessment" | "plan" | "review";
  due: string;
  basis: string;
}

export const DEADLINE_LABEL: Record<SocialDeadline["kind"], string> = {
  assessment: "Procena",
  plan: "Individualni plan",
  review: "Ponovni pregled plana",
};

/** Koliko dana do roka (negativno = kasni) */
export const daysUntil = (iso: string) => {
  const d = new Date(iso);
  const due = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((due - today) / 86_400_000);
};

export function deadlineState(iso: string): { label: string; tone: "error" | "warning" | "light" } {
  const days = daysUntil(iso);
  if (days < 0) return { label: `kasni ${-days} ${-days === 1 ? "dan" : "dana"}`, tone: "error" };
  if (days === 0) return { label: "danas", tone: "warning" };
  if (days <= 14) return { label: days === 1 ? "sutra" : `za ${days} dana`, tone: "warning" };
  return { label: `za ${days} dana`, tone: "light" };
}

// ── Upiti ───────────────────────────────────────────────────────────────

const keys = {
  profile: (patientId: string) => ["social", "profile", patientId] as const,
  documents: (patientId: string) => ["social", "documents", patientId] as const,
  deadlines: ["social", "deadlines"] as const,
  staff: ["social", "staff"] as const,
};

export function useSocialProfile(patientId: string) {
  return useQuery({
    queryKey: keys.profile(patientId),
    queryFn: async () => (await api.get(`/api/social/profile/${patientId}`)).data as { patient: DossierPatient; profile: SocialProfile | null },
    enabled: !!patientId,
  });
}

export interface ProfilePatch {
  patient?: Partial<PatientBasics>;
  profile?: Partial<SocialProfileInput>;
  /** updatedAt profila kad je forma otvorena — server odbija ako ga je neko u međuvremenu promenio */
  expectedUpdatedAt?: string;
}

/** Osnovni podaci se vide i u listi korisnika, zaglavlju i svim ostalim stranama */
function useInvalidatePatient(patientId?: string) {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ["patients"] }),
      patientId ? qc.invalidateQueries({ queryKey: ["patient", patientId] }) : undefined,
      qc.invalidateQueries({ queryKey: ["social"] }),
    ]);
}

export function useSaveProfile(patientId: string) {
  const invalidate = useInvalidatePatient(patientId);
  return useMutation({
    mutationFn: async (patch: ProfilePatch) => (await api.patch(`/api/social/profile/${patientId}`, patch)).data as { patient: DossierPatient; profile: SocialProfile },
    onSuccess: invalidate,
  });
}

export interface NewResidentInput {
  patient: PatientBasics & { admissionDate: string };
  profile?: Partial<SocialProfileInput>;
}

export function useCreateResident() {
  const invalidate = useInvalidatePatient();
  return useMutation({
    mutationFn: async (input: NewResidentInput) => (await api.post("/api/social/residents", input)).data as { patient: DossierPatient; profile: SocialProfile },
    onSuccess: invalidate,
  });
}

export interface HistoryEntry {
  _id: string;
  action: string;
  fields: string[];
  summary: string;
  createdAt: string;
  user: StaffRef | null;
}

export function useSocialHistory(patientId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["social", "history", patientId],
    queryFn: async () => (await api.get(`/api/social/history/${patientId}`)).data.history as HistoryEntry[],
    enabled: enabled && !!patientId,
  });
}

// ── Word šabloni ────────────────────────────────────────────────────────

export interface MergeField {
  key: string;
  label: string;
  group: string;
}
export interface MergeList {
  key: string;
  label: string;
  fields: MergeField[];
}
export interface MergeData {
  /** Izbor u obrascu (soba, kategorija, osnov prestanka) */
  flags?: Record<string, boolean>;
  fields: Record<string, string>;
  lists: Record<string, Array<Record<string, string>>>;
}
export interface DocumentTemplate {
  _id: string;
  name: string;
  description: string;
  fileName: string;
  size: number;
  updatedAt: string;
  uploadedBy: StaffRef | null;
}

export function useMergeFields() {
  return useQuery({
    queryKey: ["social", "merge-fields"],
    queryFn: async () => (await api.get("/api/social/merge-fields")).data as { fields: MergeField[]; lists: MergeList[] },
    staleTime: Infinity,
  });
}

export const fetchMergeData = async (patientId: string, templateName?: string) =>
  (await api.get(`/api/social/merge-data/${patientId}`, { params: templateName ? { template: templateName } : undefined })).data as MergeData;

export const fetchTemplateFile = async (id: string) => (await api.get(`/api/social/templates/${id}/file`, { responseType: "arraybuffer" })).data as ArrayBuffer;

export function useTemplates() {
  return useQuery({ queryKey: ["social", "templates"], queryFn: async () => (await api.get("/api/social/templates")).data.templates as DocumentTemplate[] });
}

export interface TemplateUpload {
  name: string;
  description: string;
  fileName?: string;
  /** base64 sadržaj .docx fajla */
  data?: string;
}

export function useSaveTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: TemplateUpload }) =>
      (id ? await api.put(`/api/social/templates/${id}`, input) : await api.post("/api/social/templates", input)).data.template as DocumentTemplate,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["social", "templates"] }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/api/social/templates/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["social", "templates"] }),
  });
}

export function useSocialStaff(enabled = true) {
  return useQuery({ queryKey: keys.staff, queryFn: async () => (await api.get("/api/social/staff")).data.staff as StaffRef[], enabled, staleTime: 5 * 60_000 });
}

export function useSocialDocuments(patientId: string) {
  return useQuery({
    queryKey: keys.documents(patientId),
    queryFn: async () => (await api.get(`/api/social/documents?patientId=${patientId}`)).data.documents as SocialDocument[],
    enabled: !!patientId,
  });
}

export function useSocialDeadlines(enabled = true) {
  return useQuery({ queryKey: keys.deadlines, queryFn: async () => (await api.get("/api/social/deadlines")).data.deadlines as SocialDeadline[], enabled });
}

function useInvalidateDocs(patientId: string) {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: keys.documents(patientId) }),
      qc.invalidateQueries({ queryKey: keys.deadlines }),
      qc.invalidateQueries({ queryKey: keys.profile(patientId) }),
    ]);
}

export function useSaveDocument(patientId: string) {
  const invalidate = useInvalidateDocs(patientId);
  return useMutation({
    mutationFn: async ({ id, type, input, expectedUpdatedAt }: { id?: string; type: DocType; input: DocumentInput; expectedUpdatedAt?: string }) =>
      (id ? await api.put(`/api/social/documents/${id}`, { ...input, expectedUpdatedAt }) : await api.post("/api/social/documents", { ...input, patientId, type })).data.document as SocialDocument,
    onSuccess: invalidate,
  });
}

export function useFinalizeDocument(patientId: string) {
  const invalidate = useInvalidateDocs(patientId);
  return useMutation({
    mutationFn: async (id: string) => (await api.post(`/api/social/documents/${id}/finalize`)).data.document as SocialDocument,
    onSuccess: invalidate,
  });
}

export function useDeleteDocument(patientId: string) {
  const invalidate = useInvalidateDocs(patientId);
  return useMutation({ mutationFn: async (id: string) => api.delete(`/api/social/documents/${id}`), onSuccess: invalidate });
}
