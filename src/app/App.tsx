import { lazy, Suspense } from "react";
import { pages } from "@app/routeLoaders";
import { BrowserRouter, Outlet, Route, Routes, useLocation } from "react-router";
import ErrorBoundary from "@shared/ui/feedback/ErrorBoundary";
import AppShell from "@widgets/shell/AppShell";
import { PageLoader } from "@shared/ui/feedback/Spinner";
import { ACTIVITY_ROLES, CARE_ROLES, CLINICAL_ROLES, MANAGER_ROLES, paths, PERIOD_SCHEDULE_ROLES, REPORT_READ_ROLES, SOCIAL_READ_ROLES, STAFF_ROLES, PHYSIO_ROLES } from "@app/paths";
import { LegacyRedirect, RequireAuth, RequireRole } from "@app/routing/guards";
import SignInPage from "@pages/auth/SignInPage";
import AcceptLinkPage from "@pages/auth/AcceptLinkPage";
import ForgotPasswordPage from "@pages/auth/ForgotPasswordPage";
import { NotFoundPage } from "@pages/system/StatusPage";
import { useFacilityDocumentTitle } from "@entities/facility/facility";

// Stranice se učitavaju po potrebi (manji početni paket)
const HomePage = lazy(pages.HomePage);
const PatientsPage = lazy(pages.PatientsPage);
const PatientPage = lazy(pages.PatientPage);
const PatientSpecificationsPage = lazy(pages.PatientSpecificationsPage);
const PatientSchedulePage = lazy(pages.PatientSchedulePage);
const SpecificationPage = lazy(pages.SpecificationPage);
const InventoryListPage = lazy(pages.InventoryListPage);
const InventoryItemPage = lazy(pages.InventoryItemPage);
const FamilyStockPage = lazy(pages.FamilyStockPage);
const ReservePage = lazy(pages.ReservePage);
const AnalysesPage = lazy(pages.AnalysesPage);
const CombinationsPage = lazy(pages.CombinationsPage);
const UsersPage = lazy(pages.UsersPage);
const ActivityPage = lazy(pages.ActivityPage);
const NotificationsPage = lazy(pages.NotificationsPage);
const CalendarPage = lazy(pages.CalendarPage);
const FacilitySettingsPage = lazy(pages.FacilitySettingsPage);
const PhysioPage = lazy(pages.PhysioPage);
const ApprovalsPage = lazy(pages.ApprovalsPage);
const CareLogPage = lazy(pages.CareLogPage);
const ReportsPage = lazy(pages.ReportsPage);
const ReportPage = lazy(pages.ReportPage);
const SocialPage = lazy(pages.SocialPage);
const CatalogPage = lazy(pages.CatalogPage);

const managers = (el: React.ReactNode) => <RequireRole roles={MANAGER_ROLES}>{el}</RequireRole>;
const staff = (el: React.ReactNode) => <RequireRole roles={STAFF_ROLES}>{el}</RequireRole>;
const care = (el: React.ReactNode) => <RequireRole roles={CARE_ROLES}>{el}</RequireRole>;
const clinical = (el: React.ReactNode) => <RequireRole roles={CLINICAL_ROLES}>{el}</RequireRole>;
const admins = (el: React.ReactNode) => <RequireRole roles={["admin"]}>{el}</RequireRole>;

const LEGACY: Array<[string, Parameters<typeof LegacyRedirect>[0]["to"]]> = [
  // Ranije posebne stranice, sada sekcije "Šabloni i cene"
  ["/diagnosis-templates", paths.diagnosisTemplates],
  ["/care-tasks", paths.careTasks],
  ["/physio-prices", paths.physioPrices],
  ["/lodging-prices", paths.lodgingPrices],
  ["/professional-services", paths.professionalServices],
  ["/extra-costs", paths.extraCosts],
  ["/nurseDashboard", paths.home],
  // Unos nege je na profilu korisnika (kartica "Nega")
  ["/care", paths.patients],
  ["/patient-list", paths.patients],
  ["/patient-page", paths.patients],
  ["/patient/:patientId", (p) => paths.patient(p.patientId!)],
  ["/patient-profile-nurse/:patientId", (p) => paths.patient(p.patientId!)],
  ["/patient/:patientId/specification", (p) => paths.patient(p.patientId!)],
  ["/patient/:patientId/specification-history", (p) => paths.patientSpecifications(p.patientId!)],
  ["/patient/:patientId/future-specifications", (p) => paths.patientSchedule(p.patientId!)],
  ["/specification-view/:id", (p) => paths.specification(p.id!)],
  ["/medicine-new", paths.medicines],
  ["/medicine/addMedicine", paths.medicines],
  ["/medicine/:id", (p) => paths.medicine(p.id!)],
  ["/articlesNew", paths.articles],
  ["/analyses-list", paths.analyses],
  ["/add-Analysis", paths.analyses],
  ["/analysisDetail/:id", paths.analyses],
  ["/add-diagnosisTemplate", paths.diagnosisTemplates],
  ["/users-list", paths.users],
  ["/signup", paths.users],
  ["/nurse-actions", paths.activity],
  ["/nurse-activity", paths.activity],
  ["/adding-to-reserve-list", paths.reserve],
  ["/reserve-list", paths.reserve],
  ["/patient-medicines", paths.familyStock],
  ["/familyMedicine", paths.familyStock],
  ["/family-articles", paths.familyStock],
];

export default function App() {
  useFacilityDocumentTitle();
  return (
    <BrowserRouter>
      <Routes>
        <Route path={paths.signIn} element={<SignInPage />} />
        <Route path="/invite/:token" element={<AcceptLinkPage />} />
        <Route path="/reset-password/:token" element={<AcceptLinkPage />} />
        <Route path={paths.forgotPassword} element={<ForgotPasswordPage />} />

        <Route
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route
            element={
              <Suspense fallback={<PageLoader />}>
                <OutletBoundary />
              </Suspense>
            }
          >
            <Route index element={staff(<HomePage />)} />

            <Route path="/patients" element={staff(<PatientsPage />)} />
            <Route path="/patients/:patientId" element={staff(<PatientPage />)} />
            <Route path="/patients/:patientId/specifications" element={managers(<PatientSpecificationsPage />)} />
            <Route path="/patients/:patientId/schedule" element={<RequireRole roles={PERIOD_SCHEDULE_ROLES}><PatientSchedulePage /></RequireRole>} />
            <Route path="/specifications/:specificationId" element={managers(<SpecificationPage />)} />

            <Route path="/medicines" element={managers(<InventoryListPage kind="medicine" />)} />
            <Route path="/medicines/:id" element={managers(<InventoryItemPage kind="medicine" />)} />
            <Route path="/articles" element={care(<InventoryListPage kind="article" />)} />
            <Route path="/articles/:id" element={care(<InventoryItemPage kind="article" />)} />
            <Route path="/family-stock" element={care(<FamilyStockPage />)} />
            <Route path="/reserve" element={managers(<ReservePage />)} />

            <Route path="/analyses" element={managers(<AnalysesPage />)} />
            <Route path="/combinations" element={managers(<CombinationsPage />)} />

            <Route path="/users" element={managers(<UsersPage />)} />
            <Route path="/activity" element={<RequireRole roles={ACTIVITY_ROLES}><ActivityPage /></RequireRole>} />
            <Route path="/notifications" element={managers(<NotificationsPage />)} />
            <Route path="/calendar" element={staff(<CalendarPage />)} />
            <Route path="/settings" element={admins(<FacilitySettingsPage />)} />
            <Route path="/approvals" element={managers(<ApprovalsPage />)} />
            <Route path="/care-log" element={managers(<CareLogPage />)} />
            <Route path="/reports" element={<RequireRole roles={REPORT_READ_ROLES}><ReportsPage /></RequireRole>} />
            <Route path="/reports/:reportId" element={clinical(<ReportPage />)} />
            <Route path="/physio" element={<RequireRole roles={PHYSIO_ROLES}><PhysioPage /></RequireRole>} />
            {/* Šabloni i cene: sekcije unutar jedne stranice; dozvole po sekciji proverava stranica */}
            <Route path="/templates/:section?" element={managers(<CatalogPage />)} />
            <Route path="/social" element={<RequireRole roles={SOCIAL_READ_ROLES}><SocialPage /></RequireRole>} />

            {LEGACY.map(([from, to]) => (
              <Route key={from} path={from} element={<LegacyRedirect to={to} />} />
            ))}

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

// Suspense granica unutar okvira: meni i gornja traka ostaju dok se stranica učitava
function OutletBoundary() {
  const { pathname } = useLocation();
  return (
    <ErrorBoundary resetKey={pathname}>
      <Outlet />
    </ErrorBoundary>
  );
}
