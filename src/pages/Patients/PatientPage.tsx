import PatientList from "@pages/Patients/PatientList";
import AddPatientForm from "@features/patients/ui/AddPatientForm";



export default function PatientsPage() {
  return (
    <div className="p-6">
      <div className="mx-auto mb-8 max-w-4xl">
        <AddPatientForm />
      </div>

      <PatientList />
    </div>
  );
}
