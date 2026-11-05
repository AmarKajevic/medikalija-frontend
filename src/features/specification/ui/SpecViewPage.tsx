import { useParams } from "react-router";
import { LuArrowLeft } from "react-icons/lu";
import { useSpecification } from "@features/specification/hooks/useSpecification";
import { usePatient } from "@features/patients/hooks/usePatient";
import SpecificationWorkspace from "@features/specification/ui/workspace/SpecificationWorkspace";
import { PageLoader } from "@shared/ui/feedback/Spinner";
import { ErrorState } from "@shared/ui/feedback/EmptyState";
import Button from "@shared/ui/button/Button";

export default function SpecificationViewPage() {
  const { specificationId = "" } = useParams();
  const { data: spec, isLoading, isError, refetch } = useSpecification(specificationId);
  const { data: patient } = usePatient(spec?.patientId || "");

  if (isLoading) return <PageLoader label="Učitavanje specifikacije..." />;
  if (isError || !spec) return <ErrorState message="Specifikacija nije učitana." onRetry={() => refetch()} />;

  const patientName = patient ? `${patient.name} ${patient.lastName}` : "";

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" startIcon={<LuArrowLeft className="h-4 w-4" />} onClick={() => window.history.back()}>
          Nazad
        </Button>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white/90">Specifikacija · {patientName}</h1>
      </div>
      <SpecificationWorkspace specification={spec} patientId={spec.patientId ?? ""} patientName={patientName} />
    </div>
  );
}
