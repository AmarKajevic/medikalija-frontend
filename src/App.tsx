import { BrowserRouter as Router, Routes, Route } from "react-router";
import { Suspense, lazy } from "react";

import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import { ScrollToTop } from "./components/common/ScrollToTop";
import RoleBaseRoutes from "./utils.tsx/RoleBasedRoutes";
import PrivateRoutes from "./utils.tsx/PrivateRoutes";

import AppLayout from "./layout/AppLayout";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AddArticleFromFamily from "./components/articles/AddArticleFromFamily";
import UserList from "./pages/Users/UserList";
import MedicineReserveManager from "./pages/Medicine/MedicineReserveManager";
import MedicineReserveList from "./pages/Medicine/MedicineReserveList";


// -------------------------------------------------------
// LAZY IMPORTS – OVO JE OPTIMIZACIJA
// -------------------------------------------------------
const UserProfiles = lazy(() => import("./pages/UserProfiles"));
const Videos = lazy(() => import("./pages/UiElements/Videos"));
const Images = lazy(() => import("./pages/UiElements/Images"));
const Alerts = lazy(() => import("./pages/UiElements/Alerts"));
const Badges = lazy(() => import("./pages/UiElements/Badges"));
const Avatars = lazy(() => import("./pages/UiElements/Avatars"));
const Buttons = lazy(() => import("./pages/UiElements/Buttons"));
const LineChart = lazy(() => import("./pages/Charts/LineChart"));
const BarChart = lazy(() => import("./pages/Charts/BarChart"));
const Calendar = lazy(() => import("./pages/Calendar"));
const BasicTables = lazy(() => import("./pages/Tables/BasicTables"));
const FormElements = lazy(() => import("./pages/Forms/FormElements"));
const Blank = lazy(() => import("./pages/Blank"));
const AdminDashboard = lazy(() => import("./pages/Dashboard/AdminDashboard"));
const PatientList = lazy(() => import("./pages/Patients/PatientList"));
const DeletePatient = lazy(() => import("./pages/Patients/DeletePatient"));
const PatientProfile = lazy(() => import("./pages/Patients/PatientProfile"));
const AddDiagnosisTemplate = lazy(() => import("./pages/Diagnosis/AddDiagnosisTemplate"));
const AddMedicine = lazy(() => import("./pages/Medicine/AddMedicine"));
const MedicineList = lazy(() => import("./pages/Medicine/MedicineList"));
const AddAnalysis = lazy(() => import("./pages/Analysis/AddAnalysis"));
const AnalysisList = lazy(() => import("./pages/Analysis/AnalysisList"));
const PatientsPage = lazy(() => import("./components/patients/PatientPage"));
const ArticlesList = lazy(() => import("./components/articles/ArticlesList"));
const CombinationGroupManager = lazy(() => import("./components/combination/CombinationGroupManager"));
const NurseDashboard = lazy(() => import("./pages/Dashboard/NurseDashboard"));
const PatientTable = lazy(() => import("./components/patients/PatientTable"));
const ProfileSpecification = lazy(() => import("./pages/Patients/ProfileSpecification"));
const SpecificationHistoryPage = lazy(() => import("./components/patients/SpecificationHistoryPage"));
const SpecificationViewPage = lazy(() => import("./components/patients/SpecificationViewPage"));
const FutureSpecificationsPage = lazy(() => import("./components/patients/FutureSpecificationsPage"));
const NurseActionsList = lazy(() => import("./pages/Nurses/NurseActionsList"));
const AddMedicineFromFamily = lazy(() => import("./pages/Medicine/AddMedicineFromFamily"));
const AddFamilyMedicine = lazy(() => import("./pages/FamilyMedicine/AddFamilyMedicine"));
const AllNotificationsPage = lazy(() => import("./components/header/AllNotificationsPage"));
const PatientProfileForNurse = lazy(() => import("./pages/Patients/PatientProfileForNurse"));


// Loader (fallback)
const Loader = () => (
  <div className="w-full h-full flex items-center justify-center p-10">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500"></div>
  </div>
);


const queryClient = new QueryClient();


export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <ScrollToTop />

        <Suspense fallback={<Loader />}>
          <Routes>

            {/* PUBLIC */}
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />

            {/* ADMIN + MAIN-NURSE */}
            <Route
              element={
                <PrivateRoutes>
                  <RoleBaseRoutes requiredRole={["admin", "main-nurse"]}>
                    <AppLayout />
                  </RoleBaseRoutes>
                </PrivateRoutes>
              }
            >
              <Route index path="/" element={<AdminDashboard />} />

              <Route path="patient-list" element={<PatientList />} />
              <Route path="/patient/:patientId" element={<PatientProfile />} />
              <Route path="/patient/Delete/:patientId" element={<DeletePatient />} />

              <Route path="/add-diagnosisTemplate" element={<AddDiagnosisTemplate />} />

              <Route path="/medicine/addMedicine" element={<AddMedicine />} />
              <Route path="/medicine" element={<MedicineList />} />

              <Route path="/analysis/add" element={<AddAnalysis />} />
              <Route path="/analysis/list" element={<AnalysisList />} />

              <Route path="/addFamilyMedicine" element={<AddFamilyMedicine />} />

              <Route path="/patient/:patientId/specification" element={<ProfileSpecification />} />
              <Route path="/patient/:patientId/specification-history" element={<SpecificationHistoryPage />} />
              <Route path="/specification-view/:specificationId" element={<SpecificationViewPage />} />
              <Route path="/patient/:patientId/future-specifications" element={<FutureSpecificationsPage />} />

              <Route path="/notifications" element={<AllNotificationsPage />} />
              <Route path="/nurse-actions" element={<NurseActionsList />} />

              <Route path="/combinationGroup" element={<CombinationGroupManager />} />
              <Route path="/users-list" element={<UserList />} />
              <Route path="/adding-to-reserve-list" element={<MedicineReserveManager />} />
              <Route path="/reserve-list" element={<MedicineReserveList />} />

              {/* UI PAGES */}
              <Route path="/profile" element={<UserProfiles />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/blank" element={<Blank />} />
              <Route path="/form-elements" element={<FormElements />} />
              <Route path="/basic-tables" element={<BasicTables />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/avatars" element={<Avatars />} />
              <Route path="/badge" element={<Badges />} />
              <Route path="/buttons" element={<Buttons />} />
              <Route path="/images" element={<Images />} />
              <Route path="/videos" element={<Videos />} />
              <Route path="/line-chart" element={<LineChart />} />
              <Route path="/bar-chart" element={<BarChart />} />

            </Route>

            {/* NURSE + ADMIN shared */}
            <Route
              element={
                <PrivateRoutes>
                  <RoleBaseRoutes requiredRole={["nurse", "admin"]}>
                    <AppLayout />
                  </RoleBaseRoutes>
                </PrivateRoutes>
              }
            >
              <Route path="/nurseDashboard" element={<NurseDashboard />} />
              <Route path="/familyMedicine" element={<AddMedicineFromFamily />} />
              <Route path="/patient-table" element={<PatientTable />} />
              <Route path="/family-articles" element={<AddArticleFromFamily />} />
            </Route>

            {/* ALL STAFF */}
            <Route
              element={
                <PrivateRoutes>
                  <RoleBaseRoutes requiredRole={["admin", "main-nurse", "nurse"]}>
                    <AppLayout />
                  </RoleBaseRoutes>
                </PrivateRoutes>
              }
            >
              <Route path="/articles" element={<ArticlesList />} />
              <Route path="/patient-page" element={<PatientsPage />} />
              <Route path="/patient-profile-nurse/:patientId" element={<PatientProfileForNurse />} />
            </Route>

            {/* NOT FOUND */}
            <Route path="*" element={<NotFound />} />

          </Routes>
        </Suspense>
      </Router>
    </QueryClientProvider>
  );
}
