import { useMemo, useState } from "react";
import { LuNotebookPen, LuReceipt, LuSearch } from "react-icons/lu";
import Tabs from "@shared/ui/tabs/Tabs";
import Badge from "@shared/ui/badge/Badge";
import { Input } from "@shared/ui/form/controls";
import EmptyState from "@shared/ui/feedback/EmptyState";
import { Skeleton } from "@shared/ui/feedback/Spinner";
import { matchesSearch } from "@shared/lib/search";
import { formatQty, roleLabel } from "@shared/lib/format";
import { useWorkNotes, type WorkNote } from "@entities/diagnosis/hooks/useDiagnosis";
import { NurseEntry, personName, STATUS_META, useNurseEntries } from "@features/nurse-entries/model";
import { TYPE_ICON } from "@features/nurse-entries/ui/display";
import { Specification } from "@features/specification/types/types";

type Tab = "all" | "notes" | "entries" | "physio";

interface Props {
  specification: Specification;
  patientId: string;
  /** "Dodaj kao trošak": otvara formu za trošak sa opisom iz beleške */
  onAddAsCost?: (label: string) => void;
  /** U posebnom prozoru: bez okvira i naslova (naslov je u zaglavlju prozora) */
  embedded?: boolean;
}

// Lokalna ponoć dana specifikacije ("2026-10-25T00:00:00Z" → 25.10. 00:00 po lokalnom vremenu)
const localDay = (iso: string, plusDays = 0) => {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y!, m! - 1, d! + plusDays);
};
const dayLabel = (iso: string) => new Date(iso).toLocaleDateString("sr-Latn-RS", { weekday: "short", day: "numeric", month: "numeric" });
const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString("sr-Latn-RS", { hour: "2-digit", minute: "2-digit" });
const dayKey = (iso: string) => new Date(iso).toDateString();

/** Grupisanje po danu, najnoviji prvi (lista je već sortirana) */
function byDay<T>(items: T[], dateOf: (t: T) => string) {
  const groups: Array<{ key: string; label: string; items: T[] }> = [];
  for (const item of items) {
    const key = dayKey(dateOf(item));
    const last = groups[groups.length - 1];
    if (last?.key === key) last.items.push(item);
    else groups.push({ key, label: dayLabel(dateOf(item)), items: [item] });
  }
  return groups;
}

type Row = { key: string; at: string } & ({ note: WorkNote; entry?: undefined } | { entry: NurseEntry; note?: undefined });

// Redovna fizioterapija i usluge bez naplate se samo beleže — ne ulaze u specifikaciju
const statusOf = (e: NurseEntry) =>
  e.status === "logged" ? { label: e.type === "physio" ? "Redovna · ne naplaćuje se" : "Zabeleženo · ne naplaćuje se", color: "light" as const } : STATUS_META[e.status];

// Sve što je osoblje upisalo u periodu specifikacije — i ono što ne ulazi u specifikaciju
// (učinak rada, redovna fizioterapija). Uprava to vidi dok pravi specifikaciju.
export default function PeriodNotes({ specification: spec, patientId, onAddAsCost, embedded = false }: Props) {
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const from = useMemo(() => localDay(spec.startDate).toISOString(), [spec.startDate]);
  const to = useMemo(() => localDay(spec.endDate, 1).toISOString(), [spec.endDate]);

  const notes = useWorkNotes(patientId, from, to);
  const entries = useNurseEntries({ patientId, from, to: new Date(new Date(to).getTime() - 1).toISOString(), limit: 1000 });

  const noteRows: Row[] = (notes.data ?? []).map((n) => ({ key: `n-${n._id}`, at: n.createdAt, note: n }));
  const entryRows: Row[] = (entries.data ?? []).filter((e) => e.type !== "physio").map((e) => ({ key: `e-${e._id}`, at: e.performedAt, entry: e }));
  const physioRows: Row[] = (entries.data ?? []).filter((e) => e.type === "physio").map((e) => ({ key: `e-${e._id}`, at: e.performedAt, entry: e }));
  const byTab: Record<Tab, Row[]> = {
    all: [...noteRows, ...entryRows, ...physioRows].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()),
    notes: noteRows,
    entries: entryRows,
    physio: physioRows,
  };

  const q = query.trim();
  const text = (r: Row) =>
    r.note ? `${r.note.description} ${r.note.createdBy?.name ?? ""} ${r.note.createdBy?.lastName ?? ""}` : `${r.entry.name} ${r.entry.note} ${personName(r.entry.createdBy)}`;
  const list = byTab[tab].filter((r) => !q || matchesSearch(text(r), q));
  const loading = (tab !== "entries" && tab !== "physio" && notes.isLoading) || (tab !== "notes" && entries.isLoading);
  const count = (t: Tab, ready: boolean) => (ready ? ` (${byTab[t].length})` : "");
  const empty: Record<Tab, string> = {
    all: "Osoblje nije ništa upisalo u ovom periodu",
    notes: "Sestre nisu upisale učinak u ovom periodu",
    entries: "Nema unosa sestara u ovom periodu",
    physio: "Nema fizikalne terapije u ovom periodu",
  };

  return (
    <section className={embedded ? "" : "rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900"}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-3.5 dark:border-gray-800">
        {!embedded && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white/90">Zabeleške iz ovog perioda</h3>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Sve što je osoblje upisalo, i ono što ne ulazi u specifikaciju (učinak rada, redovna fizioterapija). Proverite da li nešto treba naplatiti.
            </p>
          </div>
        )}
        <Tabs
          variant="pills"
          value={tab}
          onChange={setTab}
          items={[
            { value: "all", label: `Sve${count("all", !!notes.data && !!entries.data)}` },
            { value: "notes", label: `Učinak rada${count("notes", !!notes.data)}` },
            { value: "entries", label: `Unosi sestara${count("entries", !!entries.data)}` },
            { value: "physio", label: `Fizioterapija${count("physio", !!entries.data)}` },
          ]}
        />
      </header>

      {byTab[tab].length > 6 && (
        <div className="border-b border-gray-100 px-5 py-3 dark:border-gray-800">
          <Input leading={<LuSearch className="h-4 w-4" />} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pretraži zabeleške..." aria-label="Pretraži zabeleške" />
        </div>
      )}

      <div className="max-h-[480px] overflow-y-auto">
        {loading ? (
          <div className="space-y-2 p-5">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : list.length === 0 ? (
          <EmptyState compact icon={<LuNotebookPen />} title={q ? "Nema rezultata" : empty[tab]} />
        ) : (
          byDay(list, (r) => r.at).map((g) => (
            <div key={g.key}>
              <p className="sticky top-0 bg-gray-50 px-5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:bg-gray-800/80 dark:text-gray-400">{g.label}</p>
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {g.items.map((r) =>
                  r.note ? (
                    <li key={r.key} className="group flex items-start gap-3 px-5 py-3">
                      <span className="w-11 shrink-0 pt-0.5 text-xs tabular-nums text-gray-400">{timeLabel(r.at)}</span>
                      <span className="mt-0.5 text-gray-400" title="Učinak rada">
                        <LuNotebookPen />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="whitespace-pre-line text-sm text-gray-800 dark:text-gray-200">{r.note.description}</p>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          {[r.note.createdBy?.name, r.note.createdBy?.lastName].filter(Boolean).join(" ") || "Nepoznato"}
                          {r.note.createdBy?.role && ` · ${roleLabel(r.note.createdBy.role)}`}
                        </p>
                      </div>
                      {onAddAsCost && (
                        <button
                          type="button"
                          onClick={() => onAddAsCost(r.note.description.split("\n")[0]!.slice(0, 120))}
                          className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand-600 opacity-70 transition hover:bg-brand-50 hover:opacity-100 focus:opacity-100 group-hover:opacity-100 dark:text-brand-400 dark:hover:bg-brand-500/10"
                          aria-label={`Dodaj kao trošak: ${r.note.description.slice(0, 40)}`}
                        >
                          <LuReceipt className="h-3.5 w-3.5" /> Dodaj kao trošak
                        </button>
                      )}
                    </li>
                  ) : (
                    <li key={r.key} className="flex items-start gap-3 px-5 py-2.5">
                      <span className="w-11 shrink-0 pt-0.5 text-xs tabular-nums text-gray-400">{timeLabel(r.at)}</span>
                      <span className="mt-0.5 text-gray-400">{TYPE_ICON[r.entry.type]}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-800 dark:text-gray-200">
                          {r.entry.name}
                          {r.entry.type !== "physio" && <span className="text-gray-500"> × {formatQty(r.entry.acceptedAmount ?? r.entry.amount)}</span>}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {personName(r.entry.createdBy)}
                          {r.entry.note && ` · „${r.entry.note}”`}
                        </p>
                      </div>
                      <Badge size="sm" color={statusOf(r.entry).color}>
                        {statusOf(r.entry).label}
                      </Badge>
                    </li>
                  )
                )}
              </ul>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
