import Dialog from "@shared/ui/dialog/Dialog";
import { PageLoader } from "@shared/ui/feedback/Spinner";
import EmptyState, { ErrorState } from "@shared/ui/feedback/EmptyState";
import { usePatientSpecification } from "@features/specification/hooks/usePatientSpecification";
import SpecificationWorkspace from "./SpecificationWorkspace";

interface Props {
  open: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
}

// "Napravi specifikaciju" — sve vezano za specifikaciju aktivnog perioda na jednom mestu.
export default function SpecificationWorkspaceDialog({ open, onClose, patientId, patientName }: Props) {
  const { data: spec, isLoading, isError, refetch } = usePatientSpecification(open ? patientId : "");

  return (
    <Dialog open={open} onClose={onClose} size="full" title="Specifikacija" description={patientName}>
      {isLoading ? (
        <PageLoader label="Učitavanje specifikacije..." />
      ) : isError ? (
        <ErrorState message="Specifikacija nije učitana." onRetry={() => refetch()} />
      ) : !spec ? (
        <EmptyState
          title="Nema aktivne specifikacije"
          description="Pacijent je otpušten. Ranije specifikacije su dostupne u istoriji."
        />
      ) : (
        <SpecificationWorkspace specification={spec} patientId={patientId} patientName={patientName} />
      )}
    </Dialog>
  );
}
