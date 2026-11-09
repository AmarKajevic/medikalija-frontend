import { ReactNode, useMemo, useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { LuActivity, LuFlaskConical, LuHandHeart, LuHeartHandshake, LuNotebookPen, LuPackage, LuPill, LuUserCheck } from "react-icons/lu";
import { api } from "@shared/api/api";
import { paths } from "@app/paths";
import PageHeader from "@shared/ui/page/PageHeader";
import DataTable, { Column } from "@shared/ui/data-table/DataTable";
import Badge, { BadgeColor } from "@shared/ui/badge/Badge";
import { Select } from "@shared/ui/form/controls";
import { ErrorState } from "@shared/ui/feedback/EmptyState";
import { roleLabel } from "@shared/lib/format";

type Kind = "note" | "medicine" | "article" | "care" | "physio" | "analysis" | "social";
type Status = "pending" | "processing" | "accepted" | "rejected" | "logged" | "direct" | "note";

export interface StaffActivity {
  id: string;
  kind: Kind;
  at: string;
  performedAt?: string;
  patient: { _id: string; name: string; lastName: string } | null;
  by: { _id: string; name: string; lastName: string; role: string } | null;
  title: string;
  detail: string;
  status: Status;
}

const KIND: Record<Kind, { label: string; icon: ReactNode }> = {
  note: { label: "Učinak rada", icon: <LuNotebookPen /> },
  medicine: { label: "Lek", icon: <LuPill /> },
  article: { label: "Artikal", icon: <LuPackage /> },
  care: { label: "Nega", icon: <LuHeartHandshake /> },
  physio: { label: "Fizioterapija", icon: <LuActivity /> },
  analysis: { label: "Analize", icon: <LuFlaskConical /> },
  social: { label: "Socijalna beleška", icon: <LuHandHeart /> },
};

const STATUS: Record<Status, { label: string; color: BadgeColor } | null> = {
  pending: { label: "Čeka odobrenje", color: "warning" },
  processing: { label: "Čeka odobrenje", color: "warning" },
  accepted: { label: "U specifikaciji", color: "success" },
  rejected: { label: "Odbijeno", color: "error" },
  logged: { label: "Zabeleženo · ne naplaćuje se", color: "light" },
  direct: { label: "Uprava · u specifikaciji", color: "info" },
  note: null,
};

const RANGES = [
  { value: "1", label: "Danas" },
  { value: "7", label: "Poslednjih 7 dana" },
  { value: "30", label: "Poslednjih 30 dana" },
  { value: "90", label: "Poslednjih 90 dana" },
  { value: "365", label: "Poslednjih godinu dana" },
];

const stamp = (iso: string) => new Date(iso).toLocaleString("sr-Latn-RS", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
const fullName = (p: { name: string; lastName?: string } | null) => (p ? `${p.name} ${p.lastName ?? ""}`.trim() : "Nepoznato");
// Od ponoći (lokalno) pre `days - 1` dana, do sada
const sinceMidnight = (days: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (days - 1));
  return d.toISOString();
};

function useStaffActivity(days: number) {
  return useQuery({
    queryKey: ["staffActivity", days],
    queryFn: async (): Promise<StaffActivity[]> => {
      const p = new URLSearchParams({ from: sinceMidnight(days), to: new Date(Date.now() + 60_000).toISOString() });
      return (await api.get(`/api/activity?${p}`)).data.activity ?? [];
    },
  });
}

// Aktivnosti: šta je ko od osoblja dodao pacijentima — unosi sestara i fizioterapeuta (i ono što
// se ne naplaćuje), učinak rada, ono što je uprava unela direktno i socijalne beleške.
export default function ActivityPage() {
  const [days, setDays] = useState("7");
  const [person, setPerson] = useState("");
  const [kind, setKind] = useState("");
  const { data = [], isLoading, isError, refetch } = useStaffActivity(Number(days));

  // Ko je koliko uneo u izabranom periodu (i filter po osobi)
  const people = useMemo(() => {
    const map = new Map<string, { id: string; name: string; role: string; count: number }>();
    for (const a of data) {
      if (!a.by) continue;
      const p = map.get(a.by._id) ?? { id: a.by._id, name: fullName(a.by), role: a.by.role, count: 0 };
      p.count += 1;
      map.set(a.by._id, p);
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [data]);
  const kinds = useMemo(() => [...new Set(data.map((a) => a.kind))], [data]);
  const rows = useMemo(() => data.filter((a) => (!person || a.by?._id === person) && (!kind || a.kind === kind)), [data, person, kind]);

  const columns: Column<StaffActivity>[] = [
    {
      id: "at",
      header: "Vreme",
      sortValue: (a) => a.at,
      cell: (a) => (
        <span className="whitespace-nowrap tabular-nums text-gray-500 dark:text-gray-400">
          {stamp(a.at)}
        </span>
      ),
    },
    {
      id: "by",
      header: "Osoblje",
      sortValue: (a) => fullName(a.by),
      cell: (a) => (
        <span className="block whitespace-nowrap">
          <span className="font-medium text-gray-900 dark:text-white">{fullName(a.by)}</span>
          <span className="block text-xs text-gray-500 dark:text-gray-400">{roleLabel(a.by?.role)}</span>
        </span>
      ),
    },
    {
      id: "patient",
      header: "Pacijent",
      sortValue: (a) => fullName(a.patient),
      cell: (a) =>
        a.patient ? (
          <Link to={paths.patient(a.patient._id)} className="whitespace-nowrap text-brand-600 hover:underline dark:text-brand-400" onClick={(e) => e.stopPropagation()}>
            {fullName(a.patient)}
          </Link>
        ) : (
          "—"
        ),
    },
    {
      id: "what",
      header: "Šta je dodato",
      cell: (a) => (
        <span className="flex min-w-0 items-start gap-2">
          <span className="mt-0.5 text-gray-400" title={KIND[a.kind].label}>
            {KIND[a.kind].icon}
          </span>
          <span className="min-w-0">
            <span className="block text-gray-800 dark:text-gray-200">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{KIND[a.kind].label}</span>
              {a.kind !== "note" && <> · {a.title}</>}
            </span>
            {a.performedAt && new Date(a.performedAt).toDateString() !== new Date(a.at).toDateString() && (
              <span className="block text-xs text-gray-500 dark:text-gray-400">Urađeno: {stamp(a.performedAt)}</span>
            )}
            {a.detail && <span className="line-clamp-2 whitespace-pre-line text-xs text-gray-500 dark:text-gray-400">{a.detail}</span>}
          </span>
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      hideBelow: "md",
      cell: (a) => {
        const s = STATUS[a.status];
        return s ? <Badge size="sm" color={s.color}>{s.label}</Badge> : null;
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Aktivnosti"
        description="Šta je ko od osoblja dodao pacijentima: unosi sestara i fizioterapeuta (i ono što se ne naplaćuje), učinak rada, unosi uprave i socijalne beleške."
      />

      {people.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Osoblje">
          {people.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={person === p.id}
              onClick={() => setPerson(person === p.id ? "" : p.id)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                person === p.id
                  ? "border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-300"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.03]"
              }`}
            >
              <span className="font-medium">{p.name}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{roleLabel(p.role)}</span>
              <span className="rounded-full bg-gray-100 px-1.5 text-xs tabular-nums text-gray-600 dark:bg-white/10 dark:text-gray-300">{p.count}</span>
            </button>
          ))}
        </div>
      )}

      {isError ? (
        <ErrorState message="Aktivnosti nisu učitane." onRetry={() => refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          loading={isLoading}
          getRowId={(a) => `${a.kind}-${a.id}`}
          searchText={(a) => `${fullName(a.by)} ${fullName(a.patient)} ${KIND[a.kind].label} ${a.title} ${a.detail}`}
          searchPlaceholder="Pretraži osoblje, pacijenta, unos..."
          initialSort={{ id: "at", dir: "desc" }}
          pageSize={25}
          toolbar={
            <div className="flex flex-wrap gap-2">
              <div className="w-48">
                <Select aria-label="Period" value={days} onChange={(e) => setDays(e.target.value)}>
                  {RANGES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="w-44">
                <Select aria-label="Vrsta unosa" value={kind} onChange={(e) => setKind(e.target.value)}>
                  <option value="">Sve vrste</option>
                  {kinds.map((k) => (
                    <option key={k} value={k}>
                      {KIND[k].label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          }
          empty={{ icon: <LuUserCheck />, title: "Nema aktivnosti u ovom periodu" }}
        />
      )}
    </>
  );
}
