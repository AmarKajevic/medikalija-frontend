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

export interface SocialProfileInput {
  jmbg: string;
  parentName: string;
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
  pensionType: "" | "old_age" | "family" | "disability" | "foreign" | "none" | "other";
  incomeNote: string;
  payer: "" | "resident" | "family" | "csr" | "mixed" | "other";
  legalCapacity: "" | "full" | "partial" | "none";
  guardian: { name: string; relation: string; phone: string; decisionNumber: string; decisionDate: string | null; authority: string };
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
  dateOfBirth: string;
  address: string;
  admissionDate: string;
  dischargeDate?: string | null;
  contactPerson?: string;
}

export const EMPTY_PROFILE: SocialProfileInput = {
  jmbg: "",
  parentName: "",
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
  pensionType: "",
  incomeNote: "",
  payer: "",
  legalCapacity: "",
  guardian: { name: "", relation: "", phone: "", decisionNumber: "", decisionDate: null, authority: "" },
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
    contacts: (p.contacts ?? []).map((c) => ({ ...c })),
    assignedStaff: p.assignedStaff?._id ?? null,
  };
}

export const SEX_LABEL: Record<string, string> = { M: "muški", Ž: "ženski" };
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

// ── Dokumenti ───────────────────────────────────────────────────────────

export type DocType = "intake" | "assessment" | "reassessment" | "plan" | "plan_review";

export interface PlanGoal {
  _id?: string;
  goal: string;
  outcome: string;
  activities: string;
  responsible: string;
  due: string | null;
  status: "" | "achieved" | "partial" | "not_achieved";
}

export interface SocialDocument {
  _id: string;
  type: DocType;
  date: string;
  status: "draft" | "final";
  sections: Record<string, string>;
  supportLevel: number;
  participants: string;
  goals: PlanGoal[];
  nextReview: string | null;
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
}

interface SectionMeta {
  key: string;
  label: string;
  hint: string;
}

// Delovi dokumenata (ključevi su isti kao na serveru i u budućim šablonima)
const S = (key: string, label: string, hint: string): SectionMeta => ({ key, label, hint });
const ASSESSMENT_SECTIONS: SectionMeta[] = [
  S("health", "Zdravstveno stanje", "Dijagnoze, terapija, pomagala — prema medicinskoj dokumentaciji i lekaru."),
  S("selfCare", "Briga o sebi", "Ishrana, higijena, oblačenje, kretanje, kontrola sfinktera; koliko pomoći je potrebno."),
  S("mental", "Kognitivno i psihičko stanje", "Orijentacija, pamćenje, raspoloženje, ponašanje."),
  S("communication", "Komunikacija", "Vid, sluh, govor, jezik; kako je najbolje razgovarati sa korisnikom."),
  S("socialTies", "Porodica i socijalne veze", "Ko su bliski ljudi, koliko često dolaze, odnosi u porodici."),
  S("interests", "Interesovanja i navike", "Šta voli da radi, dnevni ritam, hobiji."),
  S("strengths", "Snage", "Šta korisnik može sam, na šta se može osloniti."),
  S("risks", "Rizici", "Pad, lutanje, dekubitus, neuhranjenost, zanemarivanje, zloupotreba, usamljenost."),
  S("needs", "Potrebe", "Šta korisniku treba od doma i u kojoj meri."),
  S("culture", "Kulturne i lične posebnosti", "Maternji jezik, vera, običaji, ishrana — čl. 13 st. 6."),
  S("userView", "Mišljenje korisnika i porodice", "Kako korisnik vidi svoje potrebe i boravak u domu."),
  S("conclusion", "Zaključak", "Sažetak procene i preporuke za individualni plan."),
];

export const DOC_TYPES: Record<
  DocType,
  { label: string; short: string; article: string; description: string; sections: SectionMeta[]; levels?: boolean; goals?: boolean }
> = {
  intake: {
    label: "Prijemna procena",
    short: "Prijemna",
    article: "čl. 12",
    description: "Pre početka korišćenja usluge, u roku od 15 dana od zahteva: da li dom može da odgovori na potrebe korisnika.",
    sections: [
      S("request", "Zahtev", "Ko je podneo zahtev, kada i zašto se traži smeštaj."),
      S("userAttitude", "Stav korisnika", "Da li korisnik želi smeštaj i šta očekuje."),
      S("eligibility", "Podobnost", "Da li korisnik ispunjava uslove za uslugu."),
      S("capacity", "Mogućnosti doma", "Može li dom da odgovori na potrebe (nega, prostor, osoblje)."),
      S("priority", "Prioritet", "Hitnost prijema, lista čekanja."),
      S("alternatives", "Druge usluge u zajednici", "Da li bi korisniku odgovarala neka druga usluga."),
      S("outcome", "Ishod", "Prijem, lista čekanja ili razlozi za odbijanje (obaveštenje u roku od 7 dana)."),
    ],
  },
  assessment: {
    label: "Procena",
    short: "Procena",
    article: "čl. 13–15",
    description: "Počinje odmah po prijemu i završava se u roku od 10 dana: potrebe, snage, rizici, sposobnosti i interesovanja, i stepen podrške.",
    sections: ASSESSMENT_SECTIONS,
    levels: true,
  },
  reassessment: {
    label: "Ponovna procena",
    short: "Ponovna procena",
    article: "čl. 13",
    description: "Periodično, u rokovima iz individualnog plana, ili kad se stanje korisnika promeni.",
    sections: [
      S("changes", "Šta se promenilo", "Razlog za ponovnu procenu i promene od prethodne."),
      ...ASSESSMENT_SECTIONS.filter((s) => ["health", "selfCare", "mental", "socialTies", "risks", "needs", "userView", "conclusion"].includes(s.key)),
    ],
    levels: true,
  },
  plan: {
    label: "Individualni plan usluge",
    short: "Individualni plan",
    article: "čl. 16",
    description: "U roku od 10 dana od procene: ciljevi, očekivani ishodi, aktivnosti, rokovi, odgovorna lica i rok za ponovni pregled. Korisnik dobija primerak.",
    sections: [
      S("summary", "Osnov plana", "Sažetak procene na kojoj se plan zasniva."),
      S("adaptation", "Period prilagođavanja", "Aktivnosti u prvim nedeljama boravka."),
    ],
    goals: true,
  },
  plan_review: {
    label: "Pregled individualnog plana",
    short: "Pregled plana",
    article: "čl. 17",
    description: "Najkasnije jednom u 12 meseci (ili ranije, po roku iz plana): šta je ostvareno i šta se menja.",
    sections: [
      S("progress", "Šta je ostvareno", "Napredak po ciljevima plana."),
      S("changes", "Izmene plana", "Novi ili promenjeni ciljevi i aktivnosti."),
      S("conclusion", "Zaključak", ""),
    ],
    goals: true,
  },
};

export const DOC_ORDER: DocType[] = ["intake", "assessment", "plan", "plan_review", "reassessment"];

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

export function useSaveProfile(patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SocialProfileInput) => (await api.put(`/api/social/profile/${patientId}`, input)).data.profile as SocialProfile,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.profile(patientId) }),
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
    mutationFn: async ({ id, type, input }: { id?: string; type: DocType; input: DocumentInput }) =>
      (id ? await api.put(`/api/social/documents/${id}`, input) : await api.post("/api/social/documents", { ...input, patientId, type })).data.document as SocialDocument,
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
