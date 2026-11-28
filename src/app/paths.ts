// Sve putanje aplikacije na jednom mestu — linkovi se prave preko ovih funkcija,
// pa promena URL-a ne zahteva pretragu po celom kodu.
export const paths = {
  home: "/",
  signIn: "/signin",
  forgotPassword: "/forgot-password",
  invite: (token: string) => `/invite/${token}`,

  patients: "/patients",
  patient: (id: string) => `/patients/${id}`,
  patientSpecifications: (id: string) => `/patients/${id}/specifications`,
  patientSchedule: (id: string) => `/patients/${id}/schedule`,
  specification: (id: string) => `/specifications/${id}`,

  medicines: "/medicines",
  medicine: (id: string) => `/medicines/${id}`,
  articles: "/articles",
  article: (id: string) => `/articles/${id}`,
  familyStock: "/family-stock",
  reserve: "/reserve",

  analyses: "/analyses",
  combinations: "/combinations",

  users: "/users",
  activity: "/activity",
  notifications: "/notifications",
  calendar: "/calendar",
  settings: "/settings",
  // Šabloni i cene: jedna stranica sa sekcijama (/templates/:section)
  catalog: "/templates",
  catalogSection: (section: string) => `/templates/${section}`,
  diagnosisTemplates: "/templates/staff",
  careTasks: "/templates/care",
  physioPrices: "/templates/physio",
  lodgingPrices: "/templates/lodging",
  professionalServices: "/templates/services",
  extraCosts: "/templates/extra",
  approvals: "/approvals",
  careLog: "/care-log",

  reports: "/reports",
  newReport: (patientId?: string) => `/reports/new${patientId ? `?patient=${patientId}` : ""}`,
  report: (id: string) => `/reports/${id}`,
  social: "/social",
  physio: "/physio",
} as const;

export type Role = "admin" | "main-nurse" | "nurse" | "doctor" | "social-worker" | "physiotherapist" | "caregiver";

export const MANAGER_ROLES: Role[] = ["admin", "main-nurse"];
/** Sve uloge sa prijavom */
export const STAFF_ROLES: Role[] = ["admin", "main-nurse", "nurse", "doctor", "social-worker", "physiotherapist", "caregiver"];
/** Nega i zalihe na odeljenju */
export const CARE_ROLES: Role[] = ["admin", "main-nurse", "nurse"];
/** Vide medicinsku dokumentaciju (svi osim socijalnog radnika) */
export const CLINICAL_ROLES: Role[] = ["admin", "main-nurse", "nurse", "doctor"];
/** Zakazuju u kalendaru (uprava menja sve termine, ostali samo svoje) */
export const SCHEDULER_ROLES: Role[] = ["admin", "main-nurse", "nurse", "doctor", "social-worker", "physiotherapist", "caregiver"];
/** Beleže urađenu negu na profilu korisnika (negovateljica samo usluge nege) */
export const CARE_ENTRY_ROLES: Role[] = ["nurse", "caregiver"];
/** Lekarski izveštaji: čitaju (sestre zbog terapije), pišu doktor i admin */
export const REPORT_READ_ROLES: Role[] = ["admin", "main-nurse", "nurse", "doctor"];
export const REPORT_WRITE_ROLES: Role[] = ["admin", "doctor"];
/** Aktivnosti: uprava vidi sve, sestre i doktor rad doktora (lekarske izveštaje) */
export const ACTIVITY_ROLES: Role[] = ["admin", "main-nurse", "nurse", "doctor"];
/** Raspored obračunskih perioda (samo datumi, bez cena) */
export const PERIOD_SCHEDULE_ROLES: Role[] = ["admin", "main-nurse", "social-worker"];
/** Fizikalna terapija: fizioterapeut beleži, uprava pregleda i odobrava vanredne */
export const PHYSIO_ROLES: Role[] = ["admin", "main-nurse", "physiotherapist"];
/** Socijalni karton: čitaju */
export const SOCIAL_READ_ROLES: Role[] = ["admin", "main-nurse", "doctor", "social-worker"];
/** Socijalni karton: pišu */
export const SOCIAL_WRITE_ROLES: Role[] = ["admin", "main-nurse", "social-worker"];
/** Ispravka podataka korisnika i brisanje greškom/dvaput unetih korisnika */
export const PATIENT_EDIT_ROLES: Role[] = ["admin", "main-nurse", "social-worker"];
/** Trajno brisanje korisnika sa svim podacima (uz ukucano ime i prezime) */
export const PATIENT_PURGE_ROLES: Role[] = ["admin", "social-worker"];

export const isManager = (role?: string) => MANAGER_ROLES.includes(role as Role);
export const hasRole = (role: string | undefined, roles: Role[]) => roles.includes(role as Role);
