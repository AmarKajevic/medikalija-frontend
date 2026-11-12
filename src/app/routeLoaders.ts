import { paths } from "@app/paths";

// Učitavanje koda stranica na jednom mestu: rute ih koriste za lazy(), a meni da
// unapred preuzme kod stranice kad korisnik pređe mišem preko linka (klik je onda trenutan).
export const pages = {
  HomePage: () => import("@pages/HomePage"),
  PatientsPage: () => import("@pages/Patients/PatientsPage"),
  PatientPage: () => import("@pages/Patients/PatientPage"),
  PatientSpecificationsPage: () => import("@pages/Patients/PatientSpecificationsPage"),
  PatientSchedulePage: () => import("@pages/Patients/PatientSchedulePage"),
  SpecificationPage: () => import("@features/specification/ui/SpecViewPage"),
  InventoryListPage: () => import("@pages/inventory/InventoryListPage"),
  InventoryItemPage: () => import("@pages/inventory/InventoryItemPage"),
  FamilyStockPage: () => import("@pages/inventory/FamilyStockPage"),
  ReservePage: () => import("@pages/inventory/ReservePage"),
  AnalysesPage: () => import("@pages/medical/AnalysesPage"),
  CombinationsPage: () => import("@pages/medical/CombinationsPage"),
  DiagnosisTemplatesPage: () => import("@pages/medical/DiagnosisTemplatesPage"),
  UsersPage: () => import("@pages/team/UsersPage"),
  ActivityPage: () => import("@pages/team/ActivityPage"),
  NotificationsPage: () => import("@pages/workspace/NotificationsPage"),
  CalendarPage: () => import("@pages/workspace/CalendarPage"),
  FacilitySettingsPage: () => import("@pages/settings/FacilitySettingsPage"),
  LodgingPricesPage: () => import("@pages/settings/LodgingPricesPage"),
  PhysioPage: () => import("@pages/physio/PhysioPage"),
  PhysioPricesPage: () => import("@pages/settings/PhysioPricesPage"),
  ProfessionalServicesPage: () => import("@pages/settings/ProfessionalServicesPage"),
  ExtraCostsPage: () => import("@pages/settings/ExtraCostsPage"),
  CarePage: () => import("@pages/care/CarePage"),
  ApprovalsPage: () => import("@pages/care/ApprovalsPage"),
  CareTasksPage: () => import("@pages/care/CareTasksPage"),
  CareLogPage: () => import("@pages/care/CareLogPage"),
  ReportsPage: () => import("@pages/reports/ReportsPage"),
  ReportPage: () => import("@pages/reports/ReportPage"),
  SocialPage: () => import("@pages/social/SocialPage"),
};

const BY_PATH: Record<string, () => Promise<unknown>> = {
  [paths.home]: pages.HomePage,
  [paths.patients]: pages.PatientsPage,
  [paths.medicines]: pages.InventoryListPage,
  [paths.articles]: pages.InventoryListPage,
  [paths.familyStock]: pages.FamilyStockPage,
  [paths.reserve]: pages.ReservePage,
  [paths.analyses]: pages.AnalysesPage,
  [paths.combinations]: pages.CombinationsPage,
  [paths.diagnosisTemplates]: pages.DiagnosisTemplatesPage,
  [paths.users]: pages.UsersPage,
  [paths.activity]: pages.ActivityPage,
  [paths.notifications]: pages.NotificationsPage,
  [paths.calendar]: pages.CalendarPage,
  [paths.settings]: pages.FacilitySettingsPage,
  [paths.lodgingPrices]: pages.LodgingPricesPage,
  [paths.care]: pages.CarePage,
  [paths.approvals]: pages.ApprovalsPage,
  [paths.careTasks]: pages.CareTasksPage,
  [paths.careLog]: pages.CareLogPage,
  [paths.reports]: pages.ReportsPage,
  [paths.social]: pages.SocialPage,
  [paths.physio]: pages.PhysioPage,
  [paths.physioPrices]: pages.PhysioPricesPage,
  [paths.professionalServices]: pages.ProfessionalServicesPage,
  [paths.extraCosts]: pages.ExtraCostsPage,
};

const started = new Set<string>();

/** Prozor specifikacije (uprava ga otvara sa profila pacijenta) */
export const loadSpecificationDialog = () => import("@features/specification/ui/workspace/SpecificationWorkspaceDialog");

// Na sporoj mreži ili uz uštedu podataka ništa se ne preuzima unapred
const connectionAllowsPrefetch = () => {
  const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return !c?.saveData && !/(^|-)2g$/.test(c?.effectiveType ?? "");
};

/** Kad browser nema šta da radi, preuzme kod datih stranica (jednu po jednu) */
export function prefetchWhenIdle(loaders: Array<() => Promise<unknown>>) {
  if (!connectionAllowsPrefetch()) return () => {};
  let cancelled = false;
  // Safari nema requestIdleCallback
  const idle = (cb: () => void) =>
    typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(cb, { timeout: 4000 }) : setTimeout(cb, 1500);
  const next = (i: number) => {
    if (cancelled || i >= loaders.length) return;
    idle(() => {
      if (cancelled) return;
      loaders[i]!()
        .catch(() => {})
        .finally(() => next(i + 1));
    });
  };
  const start = window.setTimeout(() => next(0), 1500); // posle prvog prikaza stranice
  return () => {
    cancelled = true;
    window.clearTimeout(start);
  };
}

/** Preuzima kod stranice unapred (jednom); greška (npr. bez mreže) se ignoriše — pokušaće se pri kliku */
export function prefetchRoute(to: string) {
  const load = BY_PATH[to];
  if (!load || started.has(to)) return;
  started.add(to);
  load().catch(() => started.delete(to));
}
