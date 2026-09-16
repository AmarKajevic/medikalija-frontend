import PatientSpecificationHistory from "@features/specification/ui/PatientSpecificationHistory";
import { useParams } from "react-router";

export default function SpecificationHistoryPage() {
  const { patientId } = useParams();

  if (!patientId) return <p>Pacijent nije pronađen.</p>;

  return (
    <div className="p-4">
      <h2 className="mb-4 text-xl font-bold text-gray-800 dark:text-white/90">
        Istorija specifikacija
      </h2>
      <PatientSpecificationHistory patientId={patientId} />
    </div>
  );
}
