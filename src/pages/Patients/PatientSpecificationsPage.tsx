import { useNavigate, useParams } from "react-router";
import { LuReceipt } from "react-icons/lu";
import { paths } from "@app/paths";
import usePatient from "@entities/patient/hooks/usePatient";
import PageHeader from "@shared/ui/page/PageHeader";
import DataTable, { Column } from "@shared/ui/data-table/DataTable";
import Badge from "@shared/ui/badge/Badge";
import { ErrorState } from "@shared/ui/feedback/EmptyState";
import { formatDay, toCalendarDay } from "@shared/lib/calendarDay";
import { formatEUR, formatRSD } from "@shared/lib/format";
import { useSpecificationHistory } from "@features/specification/hooks/useSpecificationHistory";
import { Specification } from "@features/specification/types/types";

export default function PatientSpecificationsPage() {
  const { patientId = "" } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { data: patient } = usePatient(patientId);
  const { data, isLoading, isError, refetch } = useSpecificationHistory(patientId);

  const rows: Specification[] = [...(data?.activeSpec ? [data.activeSpec] : []), ...(data?.history ?? [])];
  const name = patient ? `${patient.name} ${patient.lastName}` : "Pacijent";

  const columns: Column<Specification>[] = [
    {
      id: "period",
      header: "Period",
      sortValue: (s) => +toCalendarDay(s.startDate),
      cell: (s) => (
        <span className="font-medium tabular-nums text-gray-900 dark:text-white">
          {formatDay(s.startDate)} – {formatDay(s.endDate)}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (s) => (s.isActive && data?.activeSpec?._id === s._id ? <Badge size="sm" color="success" dot>Aktivan</Badge> : <Badge size="sm" color="light">Zatvoren</Badge>),
    },
    { id: "items", header: "Stavke", align: "right", hideBelow: "sm", sortValue: (s) => s.items?.length ?? 0, cell: (s) => <span className="tabular-nums">{s.items?.length ?? 0}</span> },
    { id: "total", header: "Specifikacija", align: "right", sortValue: (s) => s.totalPrice ?? 0, cell: (s) => <span className="tabular-nums">{formatRSD(s.totalPrice)}</span> },
    {
      id: "billing",
      header: "Za uplatu",
      align: "right",
      hideBelow: "md",
      sortValue: (s) => s.billing?.totalEUR ?? 0,
      cell: (s) =>
        s.billing?.totalEUR ? (
          <span className="tabular-nums">{formatEUR(s.billing.totalEUR)}</span>
        ) : (
          <span className="text-gray-400">Nije obračunato</span>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Istorija specifikacija"
        description="Svi obračunski periodi pacijenta. Kliknite na period da biste ga otvorili."
        breadcrumbs={[{ label: "Pacijenti", to: paths.patients }, { label: name, to: paths.patient(patientId) }, { label: "Specifikacije" }]}
      />
      {isError ? (
        <ErrorState message="Istorija nije učitana." onRetry={() => refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          loading={isLoading}
          getRowId={(s) => s._id}
          onRowClick={(s) => navigate(paths.specification(s._id))}
          initialSort={{ id: "period", dir: "desc" }}
          empty={{ icon: <LuReceipt />, title: "Još nema specifikacija" }}
        />
      )}
    </>
  );
}
