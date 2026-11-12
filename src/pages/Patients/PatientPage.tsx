import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router";
import { LuClipboardCheck, LuFilePlus, LuPlus } from "react-icons/lu";
import { useAuth } from "@app/providers/AuthContext";
import { CARE_ROLES, CLINICAL_ROLES, hasRole, isManager, paths, PATIENT_EDIT_ROLES, PERIOD_SCHEDULE_ROLES, PHYSIO_ROLES, SOCIAL_READ_ROLES, SOCIAL_WRITE_ROLES, SCHEDULER_ROLES } from "@app/paths";
import usePatient, { type Patient } from "@entities/patient/hooks/usePatient";
import { Breadcrumbs } from "@shared/ui/page/PageHeader";
import { Card, CardBody, CardHeader } from "@shared/ui/card/Card";
import Button, { ButtonLink } from "@shared/ui/button/Button";
import Tabs from "@shared/ui/tabs/Tabs";
import { PageLoader } from "@shared/ui/feedback/Spinner";
import EmptyState, { ErrorState } from "@shared/ui/feedback/EmptyState";
import { usePatientSpecification } from "@features/specification/hooks/usePatientSpecification";
import { useSpecificationDock } from "@features/specification/ui/dock/useSpecificationDock";
import { loadSpecificationDialog } from "@app/routeLoaders";
import NurseEntryPanel from "@features/nurse-entries/ui/NurseEntryPanel";
import EntryList from "@features/nurse-entries/ui/EntryList";
import PatientAppointments from "@features/calendar/ui/PatientAppointments";
import { usePendingSummary } from "@features/nurse-entries/model";
import PatientReports from "@features/medical-reports/ui/PatientReports";
import { useSocialNotes } from "@features/social/model";
import SocialNotesList from "@features/social/ui/SocialNotesList";
import SocialNoteDialog from "@features/social/ui/SocialNoteDialog";
import SocialProfileCard from "@features/social/ui/SocialProfileCard";
import SocialDocumentsCard from "@features/social/ui/SocialDocumentsCard";
import FillTemplateCard from "@features/social/ui/FillTemplateCard";
import PatientHeader from "@features/patients/ui/profile/PatientHeader";
import SpecificationSummaryCard from "@features/patients/ui/profile/SpecificationSummaryCard";
import PatientActivity from "@features/patients/ui/profile/PatientActivity";
import FamilyStockDialog from "@features/patients/ui/profile/FamilyStockDialog";
import DischargeDialog from "@features/patients/ui/profile/DischargeDialog";
import PhysioEntryForm from "@features/physio/ui/PhysioEntryForm";
import AddPatientDialog from "@features/patients/ui/AddPatientDialog";

type OpenDialog = "family" | "discharge" | "socialNote" | "edit" | null;
type TabKey = "overview" | "care" | "medical" | "social" | "physio";

const TAB_LABELS: Record<TabKey, string> = { overview: "Pregled", care: "Nega", medical: "Medicina", social: "Socijalno", physio: "Fizioterapija" };

/** Kartice profila po ulozi; prva je podrazumevana */
function tabsFor(role?: string): TabKey[] {
  if (isManager(role)) return ["overview", "care", "medical", "social", "physio"];
  if (role === "physiotherapist") return ["physio"];
  if (role === "doctor") return ["medical", "care", "social"];
  if (role === "social-worker") return ["social"];
  return ["care", "medical"]; // sestra
}

function SocialCard({ patientId, canWrite, onNew }: { patientId: string; canWrite: boolean; onNew: () => void }) {
  const { data = [], isLoading } = useSocialNotes({ patientId });
  return (
    <Card>
      <CardHeader
        title="Socijalni karton"
        description="Razgovori, porodica, CSR i ustanove, dokumenta"
        actions={
          canWrite && (
            <Button size="xs" startIcon={<LuPlus className="h-3.5 w-3.5" />} onClick={onNew}>
              Nova beleška
            </Button>
          )
        }
      />
      <SocialNotesList notes={data} loading={isLoading} emptyText="Još nema beleški u socijalnom kartonu." />
    </Card>
  );
}

// Sestra unosi negu; uprava i doktor vide šta je urađeno
function CareTab({ patient, canEnter, manager }: { patient: Patient; canEnter: boolean; manager: boolean }) {
  const discharged = !!patient.dischargeDate;
  const list = (
    <Card>
      <CardHeader title="Nega i unosi" description="Šta je urađeno pacijentu, sa ishodom odobravanja." />
      <CardBody>
        <EntryList patientId={patient._id} />
      </CardBody>
    </Card>
  );
  if (!canEnter) {
    return (
      <div className="space-y-6">
        {list}
        <PatientActivity patientId={patient._id} defaultAuthor={manager ? "managers" : "all"} canClear={manager} />
      </div>
    );
  }
  return (
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
        {list}
        <PatientActivity patientId={patient._id} defaultAuthor="all" />
      </div>
    </div>
  );
}

export default function PatientPage() {
  const { patientId = "" } = useParams<{ patientId: string }>();
  const { user } = useAuth();
  const role = user?.role;
  const manager = isManager(role);
  // Ispravka podataka korisnika: uprava i socijalni radnik
  const canEdit = hasRole(role, PATIENT_EDIT_ROLES);
  const [params, setParams] = useSearchParams();
  const { data: patient, isLoading, isError, refetch } = usePatient(patientId);
  const specification = usePatientSpecification(manager ? patientId : "");
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const dock = useSpecificationDock();
  // Uprava sa profila skoro uvek otvara specifikaciju: kod prozora se preuzima odmah
  useEffect(() => {
    if (manager) loadSpecificationDialog().catch(() => {});
  }, [manager]);
  const pending = usePendingSummary(manager).data?.byPatient.find((p) => p.patientId === patientId)?.count ?? 0;

  if (isLoading) return <PageLoader label="Učitavanje pacijenta..." />;
  if (isError) return <ErrorState message="Pacijent nije učitan." onRetry={() => refetch()} />;
  if (!patient) return <EmptyState title="Pacijent nije pronađen" />;

  const tabs = tabsFor(role);
  const tab = tabs.includes(params.get("tab") as TabKey) ? (params.get("tab") as TabKey) : tabs[0]!;
  const patientName = `${patient.name} ${patient.lastName}`;
  const close = () => setDialog(null);
  // Specifikacija se otvara kao "u toku": kad se skloni, ostaje kartica dole desno na svakoj stranici
  const openSpecification = () => dock.openSpecification({ patientId: patient._id, patientName });
  const discharged = !!patient.dischargeDate;
  const canSchedule = hasRole(role, SCHEDULER_ROLES) && !discharged;
  const canWriteSocial = hasRole(role, SOCIAL_WRITE_ROLES);

  const headerActions =
    role === "doctor" ? (
      <ButtonLink to={paths.newReport(patient._id)} size="sm" startIcon={<LuFilePlus className="h-4 w-4" />}>
        Nov izveštaj
      </ButtonLink>
    ) : role === "social-worker" ? (
      <Button size="sm" startIcon={<LuPlus className="h-4 w-4" />} onClick={() => setDialog("socialNote")}>
        Nova beleška
      </Button>
    ) : null;

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Korisnici", to: paths.patients }, { label: patientName }]} />
      <PatientHeader
        patient={patient}
        canManage={manager}
        canViewSchedule={hasRole(role, PERIOD_SCHEDULE_ROLES)}
        onOpenSpecification={openSpecification}
        onOpenFamilyStock={hasRole(role, CARE_ROLES) ? () => setDialog("family") : undefined}
        onDischarge={canEdit ? () => setDialog("discharge") : undefined}
        onEdit={canEdit ? () => setDialog("edit") : undefined}
        actions={headerActions}
      />

      {tabs.length > 1 && (
        <Tabs value={tab} onChange={(t) => setParams({ tab: t }, { replace: true })} items={tabs.map((t) => ({ value: t, label: TAB_LABELS[t] }))} />
      )}

      {tab === "overview" && (
        <>
          {pending > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 dark:border-warning-500/30 dark:bg-warning-500/10">
              <p className="flex items-center gap-2.5 text-sm text-warning-800 dark:text-warning-300">
                <LuClipboardCheck className="h-5 w-5 shrink-0" />
                <span>
                  <strong>{pending === 1 ? "1 unos osoblja čeka" : `${pending} unosa osoblja čeka`}</strong> odobrenje za specifikaciju.
                </span>
              </p>
              <Button size="sm" onClick={openSpecification}>
                Pregledaj
              </Button>
            </div>
          )}
          <div className="grid items-start gap-6 xl:grid-cols-[1fr_380px]">
            <SpecificationSummaryCard specification={specification.data} isLoading={specification.isLoading} onOpen={openSpecification} />
            <PatientAppointments patientId={patient._id} canEdit={canSchedule} />
          </div>
        </>
      )}

      {tab === "care" && <CareTab patient={patient} canEnter={role === "nurse"} manager={manager} />}

      {tab === "medical" && hasRole(role, CLINICAL_ROLES) && (
        <div className="grid items-start gap-6 xl:grid-cols-[1fr_380px]">
          <PatientReports patientId={patient._id} canWrite={role === "doctor"} />
          <PatientAppointments patientId={patient._id} canEdit={canSchedule} />
        </div>
      )}

      {tab === "physio" && hasRole(role, PHYSIO_ROLES) && (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(320px,420px)_1fr]">
          <Card>
            <CardHeader title="Nova terapija" description="Redovna se ne naplaćuje; vanrednu odobrava uprava (cena iz cenovnika)." />
            <CardBody>
              {patient.dischargeDate ? (
                <EmptyState compact title="Pacijent je otpušten" description="Novi unosi više nisu mogući." />
              ) : (
                <PhysioEntryForm patientId={patient._id} />
              )}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Fizikalna terapija" description="Šta je rađeno ovom pacijentu." />
            <CardBody>
              <EntryList patientId={patient._id} type={["physio"]} />
            </CardBody>
          </Card>
        </div>
      )}

      {tab === "social" && hasRole(role, SOCIAL_READ_ROLES) && (
        // Socijalni dosije: lični podaci (za dokumente), procene i individualni plan, beleške
        <div className="grid items-start gap-6 xl:grid-cols-[1fr_380px]">
          <div className="min-w-0 space-y-6">
            <SocialProfileCard patientId={patient._id} canWrite={canWriteSocial} />
            <SocialDocumentsCard patientId={patient._id} patientName={patientName} canWrite={canWriteSocial && !discharged} active={!discharged} />
            <SocialCard patientId={patient._id} canWrite={canWriteSocial} onNew={() => setDialog("socialNote")} />
          </div>
          <div className="space-y-6">
            <FillTemplateCard patientId={patient._id} patientName={patientName} />
            <PatientAppointments patientId={patient._id} canEdit={canSchedule} />
          </div>
        </div>
      )}

      {canEdit && <DischargeDialog open={dialog === "discharge"} onClose={close} patient={patient} />}
      {canEdit && <AddPatientDialog open={dialog === "edit"} onClose={close} patient={patient} />}
      {hasRole(role, CARE_ROLES) && <FamilyStockDialog open={dialog === "family"} onClose={close} patientId={patient._id} />}
      {canWriteSocial && <SocialNoteDialog open={dialog === "socialNote"} onClose={close} patientId={patient._id} />}
    </div>
  );
}
