import { useParams } from "react-router";
import PatientSpecification from "../../components/patients/PatientSpecification";

export default function ProfileSpecification() {
  const { patientId } = useParams<{ patientId: string }>();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Specifikacije pacijenta</h1>
      <PatientSpecification patientId={patientId!} />
    </div>
  );
}
