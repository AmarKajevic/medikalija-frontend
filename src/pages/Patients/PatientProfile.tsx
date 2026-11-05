import { useState } from "react";
import { Link, useParams } from "react-router";
import { LuChevronRight } from "react-icons/lu";
import usePatient from "@entities/patient/hooks/usePatient";
import { PageLoader } from "@shared/ui/feedback/Spinner";
import EmptyState, { ErrorState } from "@shared/ui/feedback/EmptyState";
import { usePatientSpecification } from "@features/specification/hooks/usePatientSpecification";
import SpecificationWorkspaceDialog from "@features/specification/ui/workspace/SpecificationWorkspaceDialog";
import PatientHeader from "@features/patients/ui/profile/PatientHeader";
import SpecificationSummaryCard from "@features/patients/ui/profile/SpecificationSummaryCard";
import PatientActivity from "@features/patients/ui/profile/PatientActivity";
import FamilyStockDialog from "@features/patients/ui/profile/FamilyStockDialog";
import DischargeDialog from "@features/patients/ui/profile/DischargeDialog";

type OpenDialog = "specification" | "family" | "discharge" | null;

export default function PatientProfile() {
  const { patientId = "" } = useParams<{ patientId: string }>();
  const { data: patient, isLoading, isError, refetch } = usePatient(patientId);
  const specification = usePatientSpecification(patientId);
  const [dialog, setDialog] = useState<OpenDialog>(null);

  if (isLoading) return <PageLoader label="Učitavanje pacijenta..." />;
  if (isError) return <ErrorState message="Pacijent nije učitan." onRetry={() => refetch()} />;
  if (!patient) return <EmptyState title="Pacijent nije pronađen" />;

  const patientName = `${patient.name} ${patient.lastName}`;
  const close = () => setDialog(null);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <nav aria-label="Putanja" className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
        <Link to="/patient-list" className="hover:text-gray-800 dark:hover:text-white">
          Pacijenti
        </Link>
        <LuChevronRight className="h-4 w-4" />
        <span className="text-gray-800 dark:text-white/90">{patientName}</span>
      </nav>

      <PatientHeader
        patient={patient}
        onOpenSpecification={() => setDialog("specification")}
        onOpenFamilyStock={() => setDialog("family")}
        onDischarge={() => setDialog("discharge")}
      />

      <SpecificationSummaryCard
        specification={specification.data}
        isLoading={specification.isLoading}
        onOpen={() => setDialog("specification")}
      />

      <PatientActivity patientId={patient._id} />

      <SpecificationWorkspaceDialog
        open={dialog === "specification"}
        onClose={close}
        patientId={patient._id}
        patientName={patientName}
      />
      <FamilyStockDialog open={dialog === "family"} onClose={close} patientId={patient._id} />
      <DischargeDialog open={dialog === "discharge"} onClose={close} patient={patient} />
    </div>
  );
}
