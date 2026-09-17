import { BrowserRouter as Router, Routes, Route } from "react-router";
import { Suspense, lazy } from "react";

import SignIn from "@pages/AuthPages/SignIn";
import SignUp from "@pages/AuthPages/SignUp";
import NotFound from "@pages/OtherPage/NotFound";
import { ScrollToTop } from "@shared/ui/common/ScrollToTop";
import RoleBaseRoutes from "@app/routing/RoleBasedRoutes";
import PrivateRoutes from "@app/routing/PrivateRoutes";

import AppLayout from "@widgets/layout/AppLayout";


import AddArticleFromFamily from "@features/articles/ui/AddArticleFromFamily";
import UserList from "@pages/Users/UserList";
import MedicineReserveManager from "@pages/Medicine/MedicineReserveManager";
import MedicineReserveList from "@pages/Medicine/MedicineReserveList";
import PatientMedicineFromFamily from "@pages/Medicine/PatientMedicineFromFamily";
import MedicineDetailesPage from "@pages/Medicine/MedicineDetailesPage";
import ArticlesListNew from "@features/articles/ui/ArticlesListNew";
import ArticleDetails from "@features/articles/ui/ArticleDetails";
import MedicineListWidget from "@widgets/medicine-list/MedicineListWidget";
import AnalysesList from "@features/analysis/ui/AnalysesList";
import AnalysisDetailPage from "@features/analysis/ui/AnalysisDetailPage";
import AddAnalysisNew from "@features/analysis/ui/AddAnalysis";
import { CombinationsWidget } from "@widgets/combinations-list/CombinationsWidget";
import SpecViewPage from "@features/specification/ui/SpecViewPage";




// -------------------------------------------------------
// LAZY IMPORTS – OVO JE OPTIMIZACIJA
// -------------------------------------------------------
const Calendar = lazy(() => import("@pages/Calendar"));
const AdminDashboard = lazy(() => import("@pages/Dashboard/AdminDashboard"));
const PatientList = lazy(() => import("@pages/Patients/PatientList"));
const PatientProfile = lazy(() => import("@pages/Patients/PatientProfile"));
const AddDiagnosisTemplate = lazy(() => import("@pages/Diagnosis/AddDiagnosisTemplate"));
const AddMedicine = lazy(() => import("@pages/Medicine/AddMedicine"));

const PatientsPage = lazy(() => import("@pages/Patients/PatientPage"));
const NurseDashboard = lazy(() => import("@pages/Dashboard/NurseDashboard"));
const ProfileSpecification = lazy(() => import("@pages/Patients/ProfileSpecification"));
const SpecificationHistoryPage = lazy(() => import("@pages/Patients/SpecificationHistoryPage"));

const FutureSpecificationsPage = lazy(() => import("@pages/Patients/FutureSpecificationsPage"));
const NurseActionsList = lazy(() => import("@pages/Nurses/NurseActionsList"));
const AddMedicineFromFamily = lazy(() => import("@pages/Medicine/AddMedicineFromFamily"));

const AllNotificationsPage = lazy(() => import("@pages/Notifications/AllNotificationsPage"));
const PatientProfileForNurse = lazy(() => import("@pages/Patients/PatientProfileForNurse"));


// Loader (fallback)
const Loader = () => (
  <div className="w-full h-full flex items-center justify-center p-10">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500"></div>
  </div>
);





export default function App() {
  return (

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

              <Route path="/add-diagnosisTemplate" element={<AddDiagnosisTemplate />} />

              <Route path="/medicine/addMedicine" element={<AddMedicine />} />
              <Route path="/medicine/:id" element={<MedicineDetailesPage />} />
              <Route path="/medicine-new" element={<MedicineListWidget />} />


              <Route path="/analyses-list" element={<AnalysesList />} />
              <Route path="/analysisDetail/:analysisId" element={<AnalysisDetailPage />} />
              <Route path="/add-Analysis" element={<AddAnalysisNew />} />




              <Route path="/patient/:patientId/specification" element={<ProfileSpecification />} />
              <Route path="/patient/:patientId/specification-history" element={<SpecificationHistoryPage />} />
              <Route path="/specification-view/:specificationId" element={<SpecViewPage />} />
              <Route path="/patient/:patientId/future-specifications" element={<FutureSpecificationsPage />} />

              <Route path="/notifications" element={<AllNotificationsPage />} />
              <Route path="/nurse-actions" element={<NurseActionsList />} />

              <Route path="/combinations" element={<CombinationsWidget />} />
              <Route path="/users-list" element={<UserList />} />
              <Route path="/adding-to-reserve-list" element={<MedicineReserveManager />} />
              <Route path="/reserve-list" element={<MedicineReserveList />} />

              <Route path="/calendar" element={<Calendar />} />
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
              <Route path="/family-articles" element={<AddArticleFromFamily />} />
              <Route path="/patient-medicines" element={<PatientMedicineFromFamily />} />
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
              <Route path="/articlesNew" element={<ArticlesListNew />} />
              <Route path="/articles/:id" element={<ArticleDetails />} />
              <Route path="/patient-page" element={<PatientsPage />} />
              <Route path="/patient-profile-nurse/:patientId" element={<PatientProfileForNurse />} />
            </Route>

            {/* NOT FOUND */}
            <Route path="*" element={<NotFound />} />

          </Routes>
        </Suspense>
      </Router>

  );
}
