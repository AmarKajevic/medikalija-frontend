import { lazy, Suspense } from "react";
import { BrowserRouter, Outlet, Route, Routes } from "react-router";
import AppShell from "@widgets/shell/AppShell";
import { PageLoader } from "@shared/ui/feedback/Spinner";
import { MANAGER_ROLES, paths, STAFF_ROLES } from "@app/paths";
import { LegacyRedirect, RequireAuth, RequireRole } from "@app/routing/guards";
import SignInPage from "@pages/auth/SignInPage";
import { NotFoundPage } from "@pages/system/StatusPage";
import { useFacilityDocumentTitle } from "@entities/facility/facility";

// Stranice se učitavaju po potrebi (manji početni paket)
const HomePage = lazy(() => import("@pages/HomePage"));
const PatientsPage = lazy(() => import("@pages/Patients/PatientsPage"));
const PatientPage = lazy(() => import("@pages/Patients/PatientPage"));
const PatientSpecificationsPage = lazy(() => import("@pages/Patients/PatientSpecificationsPage"));
const PatientSchedulePage = lazy(() => import("@pages/Patients/PatientSchedulePage"));
const SpecificationPage = lazy(() => import("@features/specification/ui/SpecViewPage"));
const InventoryListPage = lazy(() => import("@pages/inventory/InventoryListPage"));
const InventoryItemPage = lazy(() => import("@pages/inventory/InventoryItemPage"));
const FamilyStockPage = lazy(() => import("@pages/inventory/FamilyStockPage"));
const ReservePage = lazy(() => import("@pages/inventory/ReservePage"));
const AnalysesPage = lazy(() => import("@pages/medical/AnalysesPage"));
const CombinationsPage = lazy(() => import("@pages/medical/CombinationsPage"));
const DiagnosisTemplatesPage = lazy(() => import("@pages/medical/DiagnosisTemplatesPage"));
const UsersPage = lazy(() => import("@pages/team/UsersPage"));
const NurseActivityPage = lazy(() => import("@pages/team/NurseActivityPage"));
const NotificationsPage = lazy(() => import("@pages/workspace/NotificationsPage"));
const CalendarPage = lazy(() => import("@pages/workspace/CalendarPage"));
const FacilitySettingsPage = lazy(() => import("@pages/settings/FacilitySettingsPage"));
const CarePage = lazy(() => import("@pages/care/CarePage"));
const ApprovalsPage = lazy(() => import("@pages/care/ApprovalsPage"));
const CareTasksPage = lazy(() => import("@pages/care/CareTasksPage"));

const managers = (el: React.ReactNode) => <RequireRole roles={MANAGER_ROLES}>{el}</RequireRole>;
const staff = (el: React.ReactNode) => <RequireRole roles={STAFF_ROLES}>{el}</RequireRole>;
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
  ["/nurse-actions", paths.nurseActivity],
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
            <Route path="/patients/:patientId/schedule" element={managers(<PatientSchedulePage />)} />
            <Route path="/specifications/:specificationId" element={managers(<SpecificationPage />)} />

            <Route path="/medicines" element={managers(<InventoryListPage kind="medicine" />)} />
            <Route path="/medicines/:id" element={managers(<InventoryItemPage kind="medicine" />)} />
            <Route path="/articles" element={staff(<InventoryListPage kind="article" />)} />
            <Route path="/articles/:id" element={staff(<InventoryItemPage kind="article" />)} />
            <Route path="/family-stock" element={staff(<FamilyStockPage />)} />
            <Route path="/reserve" element={managers(<ReservePage />)} />

            <Route path="/analyses" element={managers(<AnalysesPage />)} />
            <Route path="/combinations" element={managers(<CombinationsPage />)} />
            <Route path="/diagnosis-templates" element={managers(<DiagnosisTemplatesPage />)} />

            <Route path="/users" element={managers(<UsersPage />)} />
            <Route path="/nurse-activity" element={managers(<NurseActivityPage />)} />
            <Route path="/notifications" element={managers(<NotificationsPage />)} />
            <Route path="/calendar" element={managers(<CalendarPage />)} />
            <Route path="/settings" element={admins(<FacilitySettingsPage />)} />
            <Route path="/care" element={staff(<CarePage />)} />
            <Route path="/approvals" element={managers(<ApprovalsPage />)} />
            <Route path="/care-tasks" element={managers(<CareTasksPage />)} />

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
  return <Outlet />;
}
