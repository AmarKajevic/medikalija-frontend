import PatientList from "../../pages/Patients/PatientList";
import AddPatientForm from "./AddPatientForm";



export default function PatientsPage() {
  return (
     <div className="w-full px-4">

      {/* NASLOV */}
      <h1 className="text-2xl font-bold mb-4 text-center">Pacijenti</h1>

      {/* FORMA — CENTRIRANA I UŽA */}
      <div className="max-w-4xl mx-auto mb-8">
        <AddPatientForm />
      </div>

      {/* LISTA PACIJENATA — PUNA ŠIRINA */}
      <div className="w-full">
        <PatientList />
      </div>

    </div>
    
    
  );
}
