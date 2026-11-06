import { useMemo } from "react";
import { Link, useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { LuClipboardCheck, LuDownload, LuHeartHandshake, LuListChecks, LuReceipt } from "react-icons/lu";
import { api } from "@shared/api/api";
import PageHeader from "@shared/ui/page/PageHeader";
import { Card, CardBody, CardHeader } from "@shared/ui/card/Card";
import DataTable, { Column } from "@shared/ui/data-table/DataTable";
import Badge from "@shared/ui/badge/Badge";
import Button from "@shared/ui/button/Button";
import StatCard from "@shared/ui/StatCard";
import Avatar from "@shared/ui/avatar/Avatar";
import Field from "@shared/ui/form/Field";
import DateInput from "@shared/ui/form/DateInput";
import SearchSelect, { SearchOption } from "@shared/ui/combobox/SearchSelect";
import { ErrorState } from "@shared/ui/feedback/EmptyState";
import { downloadCsv } from "@shared/lib/csv";
import { formatQty, formatRSD, roleLabel } from "@shared/lib/format";
import { todayIso } from "@shared/lib/dateText";
import { paths } from "@app/paths";
import { usePatients } from "@features/patients/hooks/usePatients";
import { EntryType, NurseEntry, personName, STATUS_META, TYPE_LABEL, useNurseEntries } from "@features/nurse-entries/model";
import { TYPE_ICON } from "@features/nurse-entries/ui/display";

type RangeKey = "today" | "yesterday" | "7d" | "30d" | "month" | "custom";
const RANGES: Array<[RangeKey, string]> = [
  ["today", "Danas"],
  ["yesterday", "Juče"],
  ["7d", "7 dana"],
  ["30d", "30 dana"],
  ["month", "Ovaj mesec"],
  ["custom", "Izaberi..."],
];
const TYPES: Array<[EntryType | "", string]> = [
  ["", "Sve"],
  ["care", "Nega"],
  ["medicine", "Lekovi"],
  ["article", "Artikli"],
];

const dayStart = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
};
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** Lokalni opseg [from, to) za izabrani period */
function rangeOf(key: RangeKey, customFrom: string, customTo: string): { from: Date; to: Date } {
  const today = dayStart(todayIso());
  switch (key) {
    case "today":
      return { from: today, to: addDays(today, 1) };
    case "yesterday":
      return { from: addDays(today, -1), to: today };
    case "7d":
      return { from: addDays(today, -6), to: addDays(today, 1) };
    case "30d":
      return { from: addDays(today, -29), to: addDays(today, 1) };
    case "month":
      return { from: new Date(today.getFullYear(), today.getMonth(), 1), to: addDays(today, 1) };
    case "custom": {
      const from = customFrom ? dayStart(customFrom) : addDays(today, -6);
      const to = customTo ? addDays(dayStart(customTo), 1) : addDays(today, 1);
      return { from, to: to > from ? to : addDays(from, 1) };
    }
  }
}

interface StaffUser {
  _id: string;
  name: string;
  lastName: string;
  role: string;
}

const when = (iso: string) =>
  new Date(iso).toLocaleString("sr-Latn-RS", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

// Dnevnik nege: uprava pregleda sve što su sestre unele (nega, lekovi, artikli).
export default function CareLogPage() {
  const [params, setParams] = useSearchParams();
  const range = (params.get("range") as RangeKey) || "7d";
  const nurse = params.get("nurse") ?? "";
  const patient = params.get("patient") ?? "";
  const type = (params.get("type") as EntryType | "") ?? "";
  const customFrom = params.get("from") ?? "";
  const customTo = params.get("to") ?? "";
  const setParam = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    setParams(next, { replace: true });
  };

  const { from, to } = useMemo(() => rangeOf(range, customFrom, customTo), [range, customFrom, customTo]);
  const { data = [], isLoading, isError, refetch } = useNurseEntries({
    from: from.toISOString(),
    to: new Date(to.getTime() - 1).toISOString(),
    createdBy: nurse || undefined,
    patientId: patient || undefined,
    type: type ? [type] : undefined,
    limit: 2000,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async (): Promise<StaffUser[]> => (await api.get("/api/auth/users")).data.users ?? [],
    staleTime: 5 * 60_000,
  });
  const { data: patientsData } = usePatients();

  const nurseOptions: SearchOption[] = users
    .filter((u) => ["nurse", "main-nurse", "doctor", "admin"].includes(u.role))
    .sort((a, b) => `${a.lastName} ${a.name}`.localeCompare(`${b.lastName} ${b.name}`, "sr"))
    .map((u) => ({ value: u._id, label: `${u.name} ${u.lastName}`, description: roleLabel(u.role), icon: <Avatar name={u.name} lastName={u.lastName} size="xs" /> }));
  const patientOptions: SearchOption[] = ((patientsData?.patients ?? []) as Array<{ _id: string; name: string; lastName: string; dischargeDate?: string }>)
    .sort((a, b) => `${a.lastName} ${a.name}`.localeCompare(`${b.lastName} ${b.name}`, "sr"))
    .map((p) => ({ value: p._id, label: `${p.lastName} ${p.name}`, description: p.dischargeDate ? "otpušten" : undefined, icon: <Avatar name={p.name} lastName={p.lastName} size="xs" /> }));

  // Pregled po sestri: koliko je ko uneo i čega
  const byNurse = useMemo(() => {
    const map = new Map<string, { id: string; name: string; total: number; care: number; meds: number; pending: number }>();
    for (const e of data) {
      const id = e.createdBy?._id ?? "?";
      const row = map.get(id) ?? { id, name: personName(e.createdBy) || "Nepoznato", total: 0, care: 0, meds: 0, pending: 0 };
      row.total += 1;
      if (e.type === "care") row.care += 1;
      else row.meds += 1;
      if (e.status === "pending" || e.status === "processing") row.pending += 1;
      map.set(id, row);
    }
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [data]);

  const stats = useMemo(
    () => ({
      total: data.length,
      care: data.filter((e) => e.type === "care").length,
      pending: data.filter((e) => e.status === "pending" || e.status === "processing").length,
      charged: data.reduce((s, e) => s + (e.status === "accepted" ? e.chargedPrice : 0), 0),
      patients: new Set(data.map((e) => (typeof e.patient === "object" ? e.patient._id : e.patient))).size,
    }),
    [data]
  );

  const exportCsv = () =>
    downloadCsv(`dnevnik-nege-${from.toISOString().slice(0, 10)}.csv`, [
      ["Datum i vreme", "Pacijent", "Stavka", "Količina", "Vrsta", "Sestra", "Status", "Napomena", "Naplaćeno (RSD)"],
      ...data.map((e) => [
        when(e.performedAt),
        personName(e.patient),
        e.name,
        e.acceptedAmount ?? e.amount,
        TYPE_LABEL[e.type],
        personName(e.createdBy),
        STATUS_META[e.status].label + (e.rejectReason ? ` (${e.rejectReason})` : ""),
        e.note,
        e.status === "accepted" ? e.chargedPrice : "",
      ]),
    ]);

  const columns: Column<NurseEntry>[] = [
    {
      id: "when",
      header: "Vreme",
      sortValue: (e) => e.performedAt,
      cell: (e) => <span className="whitespace-nowrap tabular-nums text-gray-500 dark:text-gray-400">{when(e.performedAt)}</span>,
    },
    {
      id: "patient",
      header: "Pacijent",
      sortValue: (e) => personName(e.patient),
      cell: (e) =>
        typeof e.patient === "object" ? (
          <Link to={paths.patient(e.patient._id)} onClick={(ev) => ev.stopPropagation()} className="font-medium text-gray-900 hover:text-brand-600 hover:underline dark:text-white">
            {personName(e.patient)}
          </Link>
        ) : (
          "—"
        ),
    },
    {
      id: "what",
      header: "Šta je urađeno",
      sortValue: (e) => e.name,
      cell: (e) => (
        <div className="flex min-w-0 items-start gap-2">
          <span className="mt-0.5 text-gray-400">{TYPE_ICON[e.type]}</span>
          <div className="min-w-0">
            <p className="text-gray-900 dark:text-white/90">
              {e.name} <span className="text-gray-500">× {formatQty(e.acceptedAmount ?? e.amount)}</span>
            </p>
            {e.note && <p className="line-clamp-2 text-xs text-gray-500 dark:text-gray-400">„{e.note}”</p>}
          </div>
        </div>
      ),
    },
    {
      id: "nurse",
      header: "Sestra",
      hideBelow: "md",
      sortValue: (e) => personName(e.createdBy),
      cell: (e) => <span className="whitespace-nowrap">{personName(e.createdBy) || "—"}</span>,
    },
    {
      id: "status",
      header: "Status",
      sortValue: (e) => STATUS_META[e.status].label,
      cell: (e) => (
        <div>
          <Badge size="sm" color={STATUS_META[e.status].color}>
            {STATUS_META[e.status].label}
          </Badge>
          {e.status === "accepted" && e.chargedPrice > 0 && <p className="mt-0.5 text-xs tabular-nums text-gray-500">{formatRSD(e.chargedPrice)}</p>}
          {e.status === "rejected" && e.rejectReason && <p className="mt-0.5 text-xs text-error-600 dark:text-error-400">{e.rejectReason}</p>}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Dnevnik nege"
        description="Sve što su sestre unele za pacijente: urađena nega, dati lekovi i artikli, sa ishodom odobravanja."
        actions={
          <Button variant="outline" startIcon={<LuDownload className="h-4 w-4" />} onClick={exportCsv} disabled={data.length === 0}>
            Izvezi u Excel
          </Button>
        }
      />

      {/* Filteri */}
      <Card className="mb-6">
        <CardBody className="space-y-4">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Period">
            {RANGES.map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={range === key}
                onClick={() => setParam({ range: key })}
                className={`rounded-full border px-3 py-1 text-sm transition ${
                  range === key ? "border-brand-400 bg-brand-50 font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-300" : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {range === "custom" && (
              <div className="grid grid-cols-2 gap-2 xl:col-span-2">
                <Field label="Od" htmlFor="log-from">
                  <DateInput id="log-from" value={customFrom} max={todayIso()} onChange={(v) => setParam({ from: v })} fromYear={2020} />
                </Field>
                <Field label="Do" htmlFor="log-to">
                  <DateInput id="log-to" value={customTo} min={customFrom || undefined} max={todayIso()} onChange={(v) => setParam({ to: v })} fromYear={2020} />
                </Field>
              </div>
            )}
            <Field label="Sestra" htmlFor="log-nurse">
              <SearchSelect id="log-nurse" value={nurse} onChange={(v) => setParam({ nurse: v })} options={nurseOptions} emptyLabel="Sve sestre" placeholder="Kucajte ime..." />
            </Field>
            <Field label="Pacijent" htmlFor="log-patient">
              <SearchSelect id="log-patient" value={patient} onChange={(v) => setParam({ patient: v })} options={patientOptions} emptyLabel="Svi pacijenti" placeholder="Kucajte ime..." />
            </Field>
            <Field label="Vrsta">
              <div className="flex rounded-lg bg-gray-100 p-0.5 dark:bg-white/[0.06]" role="group" aria-label="Vrsta">
                {TYPES.map(([value, label]) => (
                  <button
                    key={value || "all"}
                    type="button"
                    aria-pressed={type === value}
                    onClick={() => setParam({ type: value })}
                    className={`flex-1 rounded-md px-2 py-1.5 text-sm font-medium transition ${
                      type === value ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white" : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        </CardBody>
      </Card>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Unosa" value={stats.total} icon={<LuListChecks />} loading={isLoading} hint={`${stats.patients} pacijenata`} />
        <StatCard label="Urađena nega" value={stats.care} icon={<LuHeartHandshake />} loading={isLoading} />
        <StatCard label="Čeka odobrenje" value={stats.pending} icon={<LuClipboardCheck />} loading={isLoading} tone={stats.pending ? "warning" : "default"} to={stats.pending ? paths.approvals : undefined} />
        <StatCard label="Naplaćeno" value={formatRSD(stats.charged)} icon={<LuReceipt />} loading={isLoading} />
      </div>

      {isError ? (
        <ErrorState message="Dnevnik nije učitan." onRetry={() => refetch()} />
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-[1fr_320px]">
          <DataTable
            columns={columns}
            data={data}
            loading={isLoading}
            getRowId={(e) => e._id}
            searchText={(e) => `${e.name} ${personName(e.patient)} ${personName(e.createdBy)} ${e.note}`}
            searchPlaceholder="Pretraži unose..."
            pageSize={50}
            empty={{ icon: <LuHeartHandshake />, title: "Nema unosa", description: "Za izabrani period i filtere sestre nisu ništa unele." }}
          />
          <Card>
            <CardHeader title="Po sestri" description="Kliknite za prikaz samo njenih unosa." />
            {byNurse.length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-500">—</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {byNurse.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => setParam({ nurse: nurse === n.id ? "" : n.id })}
                      aria-pressed={nurse === n.id}
                      className={`flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-gray-50 dark:hover:bg-white/[0.02] ${nurse === n.id ? "bg-brand-50 dark:bg-brand-500/10" : ""}`}
                    >
                      <Avatar name={n.name.split(" ")[0]} lastName={n.name.split(" ").slice(1).join(" ")} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-gray-900 dark:text-white">{n.name}</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">
                          nega {n.care} · lekovi i artikli {n.meds}
                          {n.pending > 0 && <span className="text-warning-600 dark:text-warning-400"> · čeka {n.pending}</span>}
                        </span>
                      </span>
                      <span className="text-lg font-semibold tabular-nums text-gray-900 dark:text-white">{n.total}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
