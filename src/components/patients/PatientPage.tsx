import AddPatientForm from "./AddPatientForm";

import PatientTable from "./PatientTable";

export default function PatientsPage() {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Pacijenti</h1>
      <AddPatientForm />
      <PatientTable />
    </div>
  );
}
