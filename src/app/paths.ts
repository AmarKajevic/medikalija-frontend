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
  diagnosisTemplates: "/diagnosis-templates",

  users: "/users",
  nurseActivity: "/nurse-activity",
  notifications: "/notifications",
  calendar: "/calendar",
  settings: "/settings",
  lodgingPrices: "/lodging-prices",
  care: "/care",
  approvals: "/approvals",
  careTasks: "/care-tasks",
  careLog: "/care-log",

  reports: "/reports",
  newReport: (patientId?: string) => `/reports/new${patientId ? `?patient=${patientId}` : ""}`,
  report: (id: string) => `/reports/${id}`,
  social: "/social",
  physio: "/physio",
} as const;

export type Role = "admin" | "main-nurse" | "nurse" | "doctor" | "social-worker" | "physiotherapist";

export const MANAGER_ROLES: Role[] = ["admin", "main-nurse"];
/** Sve uloge sa prijavom */
export const STAFF_ROLES: Role[] = ["admin", "main-nurse", "nurse", "doctor", "social-worker", "physiotherapist"];
/** Nega i zalihe na odeljenju */
export const CARE_ROLES: Role[] = ["admin", "main-nurse", "nurse"];
/** Vide medicinsku dokumentaciju (svi osim socijalnog radnika) */
export const CLINICAL_ROLES: Role[] = ["admin", "main-nurse", "nurse", "doctor"];
/** Zakazuju u kalendaru (uprava menja sve termine, ostali samo svoje) */
export const SCHEDULER_ROLES: Role[] = ["admin", "main-nurse", "nurse", "doctor", "social-worker", "physiotherapist"];
/** Fizikalna terapija: fizioterapeut beleži, uprava pregleda i odobrava vanredne */
export const PHYSIO_ROLES: Role[] = ["admin", "main-nurse", "physiotherapist"];
/** Socijalni karton: čitaju */
export const SOCIAL_READ_ROLES: Role[] = ["admin", "main-nurse", "doctor", "social-worker"];
/** Socijalni karton: pišu */
export const SOCIAL_WRITE_ROLES: Role[] = ["admin", "main-nurse", "social-worker"];

export const isManager = (role?: string) => MANAGER_ROLES.includes(role as Role);
export const hasRole = (role: string | undefined, roles: Role[]) => roles.includes(role as Role);
