import { useState } from "react";
import { useParams } from "react-router";
import { LuNotebookPen, LuPackage, LuPill } from "react-icons/lu";
import { useAuth } from "@app/providers/AuthContext";
import { isManager, paths } from "@app/paths";
import usePatient from "@entities/patient/hooks/usePatient";
import { Breadcrumbs } from "@shared/ui/page/PageHeader";
import { Card, CardBody, CardHeader } from "@shared/ui/card/Card";
import Tabs from "@shared/ui/tabs/Tabs";
import { PageLoader } from "@shared/ui/feedback/Spinner";
import EmptyState, { ErrorState } from "@shared/ui/feedback/EmptyState";
import { usePatientSpecification } from "@features/specification/hooks/usePatientSpecification";
import SpecificationWorkspaceDialog from "@features/specification/ui/workspace/SpecificationWorkspaceDialog";
import ConsumeItemForm from "@features/specification/ui/workspace/forms/ConsumeItemForm";
import WorkNoteForm from "@features/diagnosis/ui/WorkNoteForm";
import PatientHeader from "@features/patients/ui/profile/PatientHeader";
import SpecificationSummaryCard from "@features/patients/ui/profile/SpecificationSummaryCard";
import PatientActivity from "@features/patients/ui/profile/PatientActivity";
import FamilyStockDialog from "@features/patients/ui/profile/FamilyStockDialog";
import DischargeDialog from "@features/patients/ui/profile/DischargeDialog";

type OpenDialog = "specification" | "family" | "discharge" | null;
type EntryTab = "note" | "medicine" | "article";

// Brzi unos za sestre: učinak rada, lek, artikal (lek i artikal se samo beleže)
function QuickEntry({ patientId }: { patientId: string }) {
  const [tab, setTab] = useState<EntryTab>("note");
  return (
    <Card>
      <CardHeader title="Novi unos" description="Beleži se u istoriji pacijenta." />
      <CardBody className="space-y-5">
        <Tabs
          variant="pills"
          value={tab}
          onChange={setTab}
          items={[
            { value: "note", label: "Učinak", icon: <LuNotebookPen className="h-4 w-4" /> },
            { value: "medicine", label: "Lek", icon: <LuPill className="h-4 w-4" /> },
            { value: "article", label: "Artikal", icon: <LuPackage className="h-4 w-4" /> },
          ]}
        />
        {tab === "note" && <WorkNoteForm patientId={patientId} />}
        {tab === "medicine" && <ConsumeItemForm key="m" kind="medicine" patientId={patientId} recordOnly />}
        {tab === "article" && <ConsumeItemForm key="a" kind="article" patientId={patientId} recordOnly />}
      </CardBody>
    </Card>
  );
}

export default function PatientPage() {
  const { patientId = "" } = useParams<{ patientId: string }>();
  const { user } = useAuth();
  const manager = isManager(user?.role);
  const { data: patient, isLoading, isError, refetch } = usePatient(patientId);
  const specification = usePatientSpecification(manager ? patientId : "");
  const [dialog, setDialog] = useState<OpenDialog>(null);

  if (isLoading) return <PageLoader label="Učitavanje pacijenta..." />;
  if (isError) return <ErrorState message="Pacijent nije učitan." onRetry={() => refetch()} />;
  if (!patient) return <EmptyState title="Pacijent nije pronađen" />;

  const patientName = `${patient.name} ${patient.lastName}`;
  const close = () => setDialog(null);
  const discharged = !!patient.dischargeDate;

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Pacijenti", to: paths.patients }, { label: patientName }]} />
      <PatientHeader
          patient={patient}
          canManage={manager}
          onOpenSpecification={() => setDialog("specification")}
          onOpenFamilyStock={() => setDialog("family")}
          onDischarge={() => setDialog("discharge")}
        />

      {manager ? (
        <>
          <SpecificationSummaryCard
            specification={specification.data}
            isLoading={specification.isLoading}
            onOpen={() => setDialog("specification")}
          />
          <PatientActivity patientId={patient._id} defaultAuthor="managers" canClear />
        </>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(320px,400px)_1fr]">
          {discharged ? (
            <Card>
              <EmptyState compact title="Pacijent je otpušten" description="Novi unosi više nisu mogući." />
            </Card>
          ) : (
            <QuickEntry patientId={patient._id} />
          )}
          <PatientActivity patientId={patient._id} defaultAuthor="all" />
        </div>
      )}

      {manager && (
        <>
          <SpecificationWorkspaceDialog open={dialog === "specification"} onClose={close} patientId={patient._id} patientName={patientName} />
          <DischargeDialog open={dialog === "discharge"} onClose={close} patient={patient} />
        </>
      )}
      <FamilyStockDialog open={dialog === "family"} onClose={close} patientId={patient._id} />
    </div>
  );
}
