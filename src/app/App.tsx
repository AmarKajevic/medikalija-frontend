import { lazy, Suspense } from "react";
import { pages } from "@app/routeLoaders";
import { BrowserRouter, Outlet, Route, Routes, useLocation } from "react-router";
import ErrorBoundary from "@shared/ui/feedback/ErrorBoundary";
import AppShell from "@widgets/shell/AppShell";
import { PageLoader } from "@shared/ui/feedback/Spinner";
import { CARE_ROLES, CLINICAL_ROLES, MANAGER_ROLES, paths, PERIOD_SCHEDULE_ROLES, SOCIAL_READ_ROLES, STAFF_ROLES, PHYSIO_ROLES } from "@app/paths";
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
const DiagnosisTemplatesPage = lazy(pages.DiagnosisTemplatesPage);
const UsersPage = lazy(pages.UsersPage);
const ActivityPage = lazy(pages.ActivityPage);
const NotificationsPage = lazy(pages.NotificationsPage);
const CalendarPage = lazy(pages.CalendarPage);
const FacilitySettingsPage = lazy(pages.FacilitySettingsPage);
const LodgingPricesPage = lazy(pages.LodgingPricesPage);
const PhysioPage = lazy(pages.PhysioPage);
const PhysioPricesPage = lazy(pages.PhysioPricesPage);
const ProfessionalServicesPage = lazy(pages.ProfessionalServicesPage);
const ExtraCostsPage = lazy(pages.ExtraCostsPage);
const CarePage = lazy(pages.CarePage);
const ApprovalsPage = lazy(pages.ApprovalsPage);
const CareTasksPage = lazy(pages.CareTasksPage);
const CareLogPage = lazy(pages.CareLogPage);
const ReportsPage = lazy(pages.ReportsPage);
const ReportPage = lazy(pages.ReportPage);
const SocialPage = lazy(pages.SocialPage);

const managers = (el: React.ReactNode) => <RequireRole roles={MANAGER_ROLES}>{el}</RequireRole>;
const staff = (el: React.ReactNode) => <RequireRole roles={STAFF_ROLES}>{el}</RequireRole>;
const care = (el: React.ReactNode) => <RequireRole roles={CARE_ROLES}>{el}</RequireRole>;
const clinical = (el: React.ReactNode) => <RequireRole roles={CLINICAL_ROLES}>{el}</RequireRole>;
const admins = (el: React.ReactNode) => <RequireRole roles={["admin"]}>{el}</RequireRole>;

const LEGACY: Array<[string, Parameters<typeof LegacyRedirect>[0]["to"]]> = [
  ["/nurseDashboard", paths.home],
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
            <Route path="/diagnosis-templates" element={managers(<DiagnosisTemplatesPage />)} />

            <Route path="/users" element={managers(<UsersPage />)} />
            <Route path="/activity" element={managers(<ActivityPage />)} />
            <Route path="/notifications" element={managers(<NotificationsPage />)} />
            <Route path="/calendar" element={staff(<CalendarPage />)} />
            <Route path="/settings" element={admins(<FacilitySettingsPage />)} />
            <Route path="/lodging-prices" element={admins(<LodgingPricesPage />)} />
            <Route path="/physio-prices" element={admins(<PhysioPricesPage />)} />
            <Route path="/professional-services" element={admins(<ProfessionalServicesPage />)} />
            <Route path="/extra-costs" element={admins(<ExtraCostsPage />)} />
            <Route path="/care" element={care(<CarePage />)} />
            <Route path="/approvals" element={managers(<ApprovalsPage />)} />
            <Route path="/care-tasks" element={managers(<CareTasksPage />)} />
            <Route path="/care-log" element={managers(<CareLogPage />)} />
            <Route path="/reports" element={<RequireRole roles={["admin", "main-nurse", "doctor"]}><ReportsPage /></RequireRole>} />
            <Route path="/reports/:reportId" element={clinical(<ReportPage />)} />
            <Route path="/physio" element={<RequireRole roles={PHYSIO_ROLES}><PhysioPage /></RequireRole>} />
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
