import { useState } from "react";
import { useParams } from "react-router";
import { LuClipboardCheck } from "react-icons/lu";
import { useAuth } from "@app/providers/AuthContext";
import { isManager, paths } from "@app/paths";
import usePatient from "@entities/patient/hooks/usePatient";
import { Breadcrumbs } from "@shared/ui/page/PageHeader";
import { Card, CardBody, CardHeader } from "@shared/ui/card/Card";
import Button from "@shared/ui/button/Button";
import { PageLoader } from "@shared/ui/feedback/Spinner";
import EmptyState, { ErrorState } from "@shared/ui/feedback/EmptyState";
import { usePatientSpecification } from "@features/specification/hooks/usePatientSpecification";
import SpecificationWorkspaceDialog from "@features/specification/ui/workspace/SpecificationWorkspaceDialog";
import NurseEntryPanel from "@features/nurse-entries/ui/NurseEntryPanel";
import EntryList from "@features/nurse-entries/ui/EntryList";
import PatientAppointments from "@features/calendar/ui/PatientAppointments";
import { usePendingSummary } from "@features/nurse-entries/model";
import PatientHeader from "@features/patients/ui/profile/PatientHeader";
import SpecificationSummaryCard from "@features/patients/ui/profile/SpecificationSummaryCard";
import PatientActivity from "@features/patients/ui/profile/PatientActivity";
import FamilyStockDialog from "@features/patients/ui/profile/FamilyStockDialog";
import DischargeDialog from "@features/patients/ui/profile/DischargeDialog";

type OpenDialog = "specification" | "family" | "discharge" | null;

export default function PatientPage() {
  const { patientId = "" } = useParams<{ patientId: string }>();
  const { user } = useAuth();
  const manager = isManager(user?.role);
  const { data: patient, isLoading, isError, refetch } = usePatient(patientId);
  const specification = usePatientSpecification(manager ? patientId : "");
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const pending = usePendingSummary(manager).data?.byPatient.find((p) => p.patientId === patientId)?.count ?? 0;

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
          {pending > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 dark:border-warning-500/30 dark:bg-warning-500/10">
              <p className="flex items-center gap-2.5 text-sm text-warning-800 dark:text-warning-300">
                <LuClipboardCheck className="h-5 w-5 shrink-0" />
                <span>
                  <strong>{pending === 1 ? "1 unos sestre čeka" : `${pending} unosa sestara čeka`}</strong> odobrenje za specifikaciju.
                </span>
              </p>
              <Button size="sm" onClick={() => setDialog("specification")}>
                Pregledaj
              </Button>
            </div>
          )}
          <div className="grid items-start gap-6 xl:grid-cols-[1fr_380px]">
            <SpecificationSummaryCard
              specification={specification.data}
              isLoading={specification.isLoading}
              onOpen={() => setDialog("specification")}
            />
            <PatientAppointments patientId={patient._id} canEdit={!discharged} />
          </div>
          <Card>
            <CardHeader title="Nega i unosi sestara" description="Šta je urađeno pacijentu i šta je ušlo u specifikaciju." />
            <CardBody>
              <EntryList patientId={patient._id} />
            </CardBody>
          </Card>
          <PatientActivity patientId={patient._id} defaultAuthor="managers" canClear />
        </>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(320px,400px)_1fr]">
          {discharged ? (
            <Card>
              <EmptyState compact title="Pacijent je otpušten" description="Novi unosi više nisu mogući." />
            </Card>
          ) : (
            <div className="lg:sticky lg:top-20">
              <NurseEntryPanel patientId={patient._id} />
            </div>
          )}
          <div className="min-w-0 space-y-6">
            <Card>
              <CardHeader title="Nega i unosi" description="Vaši i tuđi unosi za ovog pacijenta, sa ishodom odobravanja." />
              <CardBody>
                <EntryList patientId={patient._id} />
              </CardBody>
            </Card>
            <PatientAppointments patientId={patient._id} canEdit={false} />
            <PatientActivity patientId={patient._id} defaultAuthor="all" />
          </div>
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
