import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LuUserCheck } from "react-icons/lu";
import { api } from "@shared/api/api";
import PageHeader from "@shared/ui/page/PageHeader";
import DataTable, { Column } from "@shared/ui/data-table/DataTable";
import Badge, { BadgeColor } from "@shared/ui/badge/Badge";
import { Select } from "@shared/ui/form/controls";
import { ErrorState } from "@shared/ui/feedback/EmptyState";

interface NurseAction {
  type: string;
  createdBy: { _id?: string; name: string; lastName: string };
  patient: string;
  description: string;
  createdAt: string;
}

const TYPE_COLOR: Record<string, BadgeColor> = { Dijagnoza: "info", Lek: "primary", Artikal: "warning" };

export default function NurseActivityPage() {
  const { data = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["nurseActions"],
    queryFn: async (): Promise<NurseAction[]> => (await api.get("/api/nurse-actions")).data.nurseActions ?? [],
  });
  const [type, setType] = useState("");
  const types = useMemo(() => [...new Set(data.map((a) => a.type))], [data]);
  const rows = useMemo(() => data.filter((a) => !type || a.type === type), [data, type]);

  const columns: Column<NurseAction>[] = [
    {
      id: "date",
      header: "Vreme",
      sortValue: (a) => a.createdAt,
      cell: (a) => (
        <span className="whitespace-nowrap tabular-nums text-gray-500 dark:text-gray-400">
          {new Date(a.createdAt).toLocaleString("sr-Latn-RS", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
        </span>
      ),
    },
    { id: "nurse", header: "Sestra", sortValue: (a) => `${a.createdBy?.name} ${a.createdBy?.lastName}`, cell: (a) => <span className="font-medium text-gray-900 dark:text-white">{a.createdBy?.name} {a.createdBy?.lastName}</span> },
    { id: "patient", header: "Pacijent", sortValue: (a) => a.patient, cell: (a) => a.patient?.trim() || "—" },
    { id: "type", header: "Vrsta", cell: (a) => <Badge size="sm" color={TYPE_COLOR[a.type] ?? "light"}>{a.type}</Badge> },
    { id: "details", header: "Detalji", hideBelow: "md", cell: (a) => <span className="line-clamp-2 text-gray-600 dark:text-gray-400">{a.description}</span> },
  ];

  return (
    <>
      <PageHeader
        title="Aktivnosti sestara"
        description="Unosi medicinskih sestara (učinak, lekovi, artikli). Lekovi i artikli koje sestre unesu ne menjaju stanje dok ih glavna sestra ne potvrdi u specifikaciji."
      />
      {isError ? (
        <ErrorState message="Aktivnosti nisu učitane." onRetry={() => refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          loading={isLoading}
          getRowId={(a) => `${a.createdAt}-${a.description}-${a.patient}`}
          searchText={(a) => `${a.createdBy?.name} ${a.createdBy?.lastName} ${a.patient} ${a.description}`}
          searchPlaceholder="Pretraži sestru, pacijenta, opis..."
          initialSort={{ id: "date", dir: "desc" }}
          pageSize={25}
          toolbar={
            <div className="w-44">
              <Select aria-label="Vrsta unosa" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">Sve vrste</option>
                {types.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </div>
          }
          empty={{ icon: <LuUserCheck />, title: "Nema zabeleženih aktivnosti" }}
        />
      )}
    </>
  );
}
