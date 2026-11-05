import { useParams } from "react-router";
import { paths } from "@app/paths";
import { useSpecification } from "@features/specification/hooks/useSpecification";
import { usePatient } from "@features/patients/hooks/usePatient";
import SpecificationWorkspace from "@features/specification/ui/workspace/SpecificationWorkspace";
import PageHeader from "@shared/ui/page/PageHeader";
import { PageLoader } from "@shared/ui/feedback/Spinner";
import { ErrorState } from "@shared/ui/feedback/EmptyState";
import { formatDay } from "@shared/lib/calendarDay";

export default function SpecificationViewPage() {
  const { specificationId = "" } = useParams();
  const { data: spec, isLoading, isError, refetch } = useSpecification(specificationId);
  const { data: patient } = usePatient(spec?.patientId || "");

  if (isLoading) return <PageLoader label="Učitavanje specifikacije..." />;
  if (isError || !spec) return <ErrorState message="Specifikacija nije učitana." onRetry={() => refetch()} />;

  const patientName = patient ? `${patient.name} ${patient.lastName}` : "";
  const patientId = spec.patientId ?? "";

  return (
    <>
      <PageHeader
        title={`Specifikacija ${formatDay(spec.startDate)} – ${formatDay(spec.endDate)}`}
        description={patientName}
        breadcrumbs={[
          { label: "Pacijenti", to: paths.patients },
          { label: patientName || "Pacijent", to: paths.patient(patientId) },
          { label: "Specifikacije", to: paths.patientSpecifications(patientId) },
          { label: formatDay(spec.startDate) },
        ]}
      />
      <SpecificationWorkspace specification={spec} patientId={patientId} patientName={patientName} />
    </>
  );
}
