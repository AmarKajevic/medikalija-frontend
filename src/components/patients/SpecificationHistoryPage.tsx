import PatientSpecificationHistory from "./PatientSpecificationHistory";
import { useParams } from "react-router";

export default function SpecificationHistoryPage() {
  const { patientId } = useParams();

  if (!patientId) return <p>Pacijent nije pronađen.</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Istorija specifikacija</h2>
      <PatientSpecificationHistory patientId={patientId} />
    </div>
  );
}
