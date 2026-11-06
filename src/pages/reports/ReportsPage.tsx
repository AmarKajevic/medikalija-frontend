import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { LuFilePlus, LuFileText } from "react-icons/lu";
import { useAuth } from "@app/providers/AuthContext";
import { paths } from "@app/paths";
import PageHeader from "@shared/ui/page/PageHeader";
import DataTable, { Column } from "@shared/ui/data-table/DataTable";
import Badge from "@shared/ui/badge/Badge";
import { ButtonLink } from "@shared/ui/button/Button";
import Tabs from "@shared/ui/tabs/Tabs";
import { ErrorState } from "@shared/ui/feedback/EmptyState";
import { MedicalReport, reportTypeLabel, useReports } from "@features/medical-reports/model";

type Filter = "drafts" | "mine" | "all";

const date = (iso: string) => new Date(iso).toLocaleString("sr-Latn-RS", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

// Lekarski izveštaji: doktor vidi svoje nacrte i potpisane; uprava sve potpisane.
export default function ReportsPage() {
  const { user } = useAuth();
  const doctor = user?.role === "doctor";
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const filter = ((params.get("f") as Filter) || (doctor ? "mine" : "all")) as Filter;
  const query = filter === "drafts" ? { mine: true, status: "draft" as const } : filter === "mine" ? { mine: true } : { status: "signed" as const };
  const { data = [], isLoading, isError, refetch } = useReports({ ...query, limit: 1000 });
  const drafts = useReports({ mine: true, status: "draft", limit: 200 }, doctor).data?.length ?? 0;

  const columns: Column<MedicalReport>[] = useMemo(
    () => [
      { id: "date", header: "Pregled", sortValue: (r) => r.visitDate, cell: (r) => <span className="whitespace-nowrap tabular-nums text-gray-500 dark:text-gray-400">{date(r.visitDate)}</span> },
      { id: "patient", header: "Pacijent", sortValue: (r) => `${r.patient.lastName} ${r.patient.name}`, cell: (r) => <span className="font-medium text-gray-900 dark:text-white">{r.patient.name} {r.patient.lastName}</span> },
      { id: "type", header: "Vrsta", sortValue: (r) => reportTypeLabel(r.type), cell: (r) => reportTypeLabel(r.type) },
      {
        id: "dx",
        header: "Dijagnoze",
        hideBelow: "md",
        cell: (r) => <span className="line-clamp-1 text-gray-600 dark:text-gray-300">{r.diagnoses.map((d) => d.code || d.name).join(", ") || "—"}</span>,
      },
      { id: "author", header: "Doktor", hideBelow: "lg", sortValue: (r) => r.author.lastName, cell: (r) => `dr ${r.author.name} ${r.author.lastName}` },
      {
        id: "status",
        header: "Status",
        sortValue: (r) => r.status,
        cell: (r) => (r.status === "draft" ? <Badge size="sm" color="warning">Nacrt</Badge> : <Badge size="sm" color="success">Potpisan</Badge>),
      },
    ],
    []
  );

  return (
    <>
      <PageHeader
        title="Lekarski izveštaji"
        description={doctor ? "Vaši izveštaji i nacrti. Nacrte vidite samo vi; potpisane vide sestre i uprava." : "Potpisani izveštaji svih doktora."}
        actions={
          doctor && (
            <ButtonLink to={paths.newReport()} startIcon={<LuFilePlus className="h-4 w-4" />}>
              Nov izveštaj
            </ButtonLink>
          )
        }
      />
      {doctor && (
        <div className="mb-4">
          <Tabs
            value={filter}
            onChange={(f) => setParams({ f }, { replace: true })}
            items={[
              { value: "mine", label: "Moji izveštaji" },
              { value: "drafts", label: `Nacrti${drafts ? ` (${drafts})` : ""}` },
              { value: "all", label: "Svi potpisani" },
            ]}
          />
        </div>
      )}
      {isError ? (
        <ErrorState message="Izveštaji nisu učitani." onRetry={() => refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={data}
          loading={isLoading}
          getRowId={(r) => r._id}
          onRowClick={(r) => navigate(paths.report(r._id))}
          searchText={(r) => `${r.patient.name} ${r.patient.lastName} ${r.diagnoses.map((d) => `${d.code} ${d.name}`).join(" ")} ${r.author.lastName}`}
          searchPlaceholder="Pretraži po pacijentu, dijagnozi, doktoru..."
          pageSize={50}
          empty={{ icon: <LuFileText />, title: filter === "drafts" ? "Nema nedovršenih izveštaja" : "Nema izveštaja" }}
        />
      )}
    </>
  );
}
