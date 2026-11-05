import { useParams } from "react-router";
import usePatient from "@entities/patient/hooks/usePatient";
import { usePatientSpecification } from "@features/specification/hooks/usePatientSpecification";
import SpecificationWorkspace from "@features/specification/ui/workspace/SpecificationWorkspace";
import { PageLoader } from "@shared/ui/feedback/Spinner";
import EmptyState from "@shared/ui/feedback/EmptyState";

export default function ProfileSpecification() {
  const { patientId = "" } = useParams<{ patientId: string }>();
  const { data: patient } = usePatient(patientId);
  const { data: spec, isLoading } = usePatientSpecification(patientId);

  if (isLoading) return <PageLoader label="Učitavanje specifikacije..." />;
  if (!spec) return <EmptyState title="Nema aktivne specifikacije" description="Pacijent je otpušten." />;

  const patientName = patient ? `${patient.name} ${patient.lastName}` : "";

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-semibold text-gray-900 dark:text-white/90">Specifikacija · {patientName}</h1>
      <SpecificationWorkspace specification={spec} patientId={patientId} patientName={patientName} />
    </div>
  );
}
