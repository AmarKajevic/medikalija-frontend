import { useParams } from "react-router";
import PatientSpecification from "@features/specification/ui/PatientSpecification";

export default function ProfileSpecification() {
  const { patientId } = useParams<{ patientId: string }>();

  return (
    <div className="p-6">
      <PatientSpecification patientId={patientId!} />
    </div>
  );
}
