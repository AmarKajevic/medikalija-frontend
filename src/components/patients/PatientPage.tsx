import PatientList from "../../pages/Patients/PatientList";
import AddPatientForm from "./AddPatientForm";



export default function PatientsPage() {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Pacijenti</h1>
      <AddPatientForm />
      <PatientList />
    </div>
  );
}
