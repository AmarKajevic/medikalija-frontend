import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import RoleBaseRoutes from "./utils.tsx/RoleBasedRoutes";
import PrivateRoutes from "./utils.tsx/PrivateRoutes";
import AdminDashboard from "./pages/Dashboard/AdminDashboard";
import PatientList from "./pages/Patients/PatientList";

import DeletePatient from "./pages/Patients/DeletePatient";
import PatientProfile from "./pages/Patients/PatientProfile";
import AddDiagnosisTemplate from "./pages/Diagnosis/AddDiagnosisTemplate";
import AddMedicine from "./pages/Medicine/AddMedicine";

import MedicineList from "./pages/Medicine/MedicineList";
import AddAnalysis from "./pages/Analysis/AddAnalysis";

import AnalysisList from "./pages/Analysis/AnalysisList";


import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PatientsPage from "./components/patients/PatientPage";
import ArticlesList from "./components/articles/ArticlesList";
import CombinationGroupManager from "./components/combination/CombinationGroupManager";
import NurseDashboard from "./pages/Dashboard/NurseDashboard";
import PatientTable from "./components/patients/PatientTable";

import ProfileSpecification from "./pages/Patients/ProfileSpecification";
import SpecificationHistoryPage from "./components/patients/SpecificationHistoryPage";
import SpecificationViewPage from "./components/patients/SpecificationViewPage";
import FutureSpecificationsPage from "./components/patients/FutureSpecificationsPage";
import NurseActionsList from "./pages/Nurses/NurseActionsList";
import AddMedicineFromFamily from "./pages/Medicine/AddMedicineFromFamily";
import AddFamilyMedicine from "./pages/FamilyMedicine/AddFamilyMedicine";
import AllNotificationsPage from "./components/header/AllNotificationsPage";
import PatientProfileForNurse from "./pages/Patients/PatientProfileForNurse";


const queryClient = new QueryClient();


export default function App() {
  return (
    <>
    <QueryClientProvider client={queryClient}>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/signin" element={<SignIn />} />
          
          {/* Dashboard Layout */}
          <Route element={
            
              <PrivateRoutes >
              <RoleBaseRoutes requiredRole={["admin","main-nurse"]}>
              <AppLayout />
              </RoleBaseRoutes>
              </PrivateRoutes>
              
            }>
            <Route index path="/" element={<AdminDashboard />} />

            

            <Route path="patient-list" element={<PatientList/>}/>
            <Route path="add-diagnosisTemplate" element={<AddDiagnosisTemplate/>}/>
            <Route path="/patient/:patientId" element={<PatientProfile />} />
            <Route path="/patient/Delete/:patientId" element={<DeletePatient />} />
            <Route path="/medicine/addMedicine" element={<AddMedicine />} />
            <Route path="/medicine" element={<MedicineList />} />
            <Route path="/analysis/add" element={<AddAnalysis />} />
            <Route path="/analysis/list" element={<AnalysisList />} />
            <Route path="/addFamilyMedicine" element={<AddFamilyMedicine />} />
            <Route path="/patient/:patientId/specification" element={<ProfileSpecification />} />
            <Route path="/patient/:patientId/specification-history" element={<SpecificationHistoryPage />} />
            <Route path="/specification-view/:specificationId" element={<SpecificationViewPage />} />
            <Route path="/patient/:patientId/future-specifications"element={<FutureSpecificationsPage />}/>
            <Route path="/notifications" element={<AllNotificationsPage />} />
            <Route path="/nurse-actions"element={<NurseActionsList />}/>



            <Route path="/combinationGroup" element={<CombinationGroupManager />} />




            <Route path="/signup" element={<SignUp />} />

            
            

            {/* Others Page */}
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />

            {/* Forms */}
            <Route path="/form-elements" element={<FormElements />} />

            {/* Tables */}
            <Route path="/basic-tables" element={<BasicTables />} />

            {/* Ui Elements */}
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />

            {/* Charts */}
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />
          </Route>
          <Route
            element={
              <PrivateRoutes>
                <RoleBaseRoutes requiredRole={["nurse", "admin"]}>
                  <AppLayout/>
                </RoleBaseRoutes>
              </PrivateRoutes>
            }
          >
            <Route path="/nurseDashboard" element={<NurseDashboard />} />
            <Route path="/familyMedicine" element={<AddMedicineFromFamily />} />
     
            <Route path="/patient-table" element={<PatientTable />} />
          </Route>
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
            
            <Route path="/patient-page" element={<PatientsPage/>}/>
            <Route path="/patient-profile-nurse/:patientId" element={<PatientProfileForNurse/>}/>
            {/* Ako hoćeš i još nešto da dele, dodaj u ovaj blok */}
          </Route>


          {/* Auth Layout */}
          
          <Route path="/signup" element={<SignUp />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      </QueryClientProvider>
    </>
  );
}
