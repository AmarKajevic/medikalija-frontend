// Sve putanje aplikacije na jednom mestu — linkovi se prave preko ovih funkcija,
// pa promena URL-a ne zahteva pretragu po celom kodu.
export const paths = {
  home: "/",
  signIn: "/signin",

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
  care: "/care",
  approvals: "/approvals",
  careTasks: "/care-tasks",
  careLog: "/care-log",
} as const;

export type Role = "admin" | "main-nurse" | "nurse" | "doctor";

export const MANAGER_ROLES: Role[] = ["admin", "main-nurse"];
export const STAFF_ROLES: Role[] = ["admin", "main-nurse", "nurse", "doctor"];

export const isManager = (role?: string) => MANAGER_ROLES.includes(role as Role);
