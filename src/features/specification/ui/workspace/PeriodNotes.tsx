import { useMemo, useState } from "react";
import { LuNotebookPen, LuReceipt, LuSearch } from "react-icons/lu";
import Tabs from "@shared/ui/tabs/Tabs";
import Badge from "@shared/ui/badge/Badge";
import { Input } from "@shared/ui/form/controls";
import EmptyState from "@shared/ui/feedback/EmptyState";
import { Skeleton } from "@shared/ui/feedback/Spinner";
import { matchesSearch } from "@shared/lib/search";
import { formatQty, roleLabel } from "@shared/lib/format";
import { useWorkNotes } from "@entities/diagnosis/hooks/useDiagnosis";
import { personName, STATUS_META, useNurseEntries } from "@features/nurse-entries/model";
import { TYPE_ICON } from "@features/nurse-entries/ui/display";
import { Specification } from "@features/specification/types/types";

type Tab = "notes" | "care";

interface Props {
  specification: Specification;
  patientId: string;
  /** "Dodaj kao trošak": otvara formu za trošak sa opisom iz beleške */
  onAddAsCost?: (label: string) => void;
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

// Šta su sestre zabeležile u periodu specifikacije — uprava to vidi dok pravi specifikaciju.
export default function PeriodNotes({ specification: spec, patientId, onAddAsCost }: Props) {
  const [tab, setTab] = useState<Tab>("notes");
  const [query, setQuery] = useState("");
  const from = useMemo(() => localDay(spec.startDate).toISOString(), [spec.startDate]);
  const to = useMemo(() => localDay(spec.endDate, 1).toISOString(), [spec.endDate]);

  const notes = useWorkNotes(patientId, from, to);
  const care = useNurseEntries({ patientId, from, to: new Date(new Date(to).getTime() - 1).toISOString(), limit: 1000 });

  const q = query.trim();
  const noteList = (notes.data ?? []).filter((n) => !q || matchesSearch(`${n.description} ${n.createdBy?.name ?? ""} ${n.createdBy?.lastName ?? ""}`, q));
  const careList = (care.data ?? []).filter((e) => !q || matchesSearch(`${e.name} ${e.note} ${personName(e.createdBy)}`, q));
  const loading = tab === "notes" ? notes.isLoading : care.isLoading;

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-3.5 dark:border-gray-800">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white/90">Zabeleške iz ovog perioda</h3>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Učinak rada i nega koje je osoblje upisalo — proverite da li nešto treba naplatiti.</p>
        </div>
        <Tabs
          variant="pills"
          value={tab}
          onChange={setTab}
          items={[
            { value: "notes", label: `Učinak rada${notes.data ? ` (${notes.data.length})` : ""}` },
            { value: "care", label: `Nega${care.data ? ` (${care.data.length})` : ""}` },
          ]}
        />
      </header>

      {((tab === "notes" ? notes.data?.length : care.data?.length) ?? 0) > 6 && (
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
        ) : tab === "notes" ? (
          noteList.length === 0 ? (
            <EmptyState compact icon={<LuNotebookPen />} title={q ? "Nema rezultata" : "Sestre nisu upisale učinak u ovom periodu"} />
          ) : (
            byDay(noteList, (n) => n.createdAt).map((g) => (
              <div key={g.key}>
                <p className="sticky top-0 bg-gray-50 px-5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:bg-gray-800/80 dark:text-gray-400">{g.label}</p>
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {g.items.map((n) => (
                    <li key={n._id} className="group flex items-start gap-3 px-5 py-3">
                      <span className="w-11 shrink-0 pt-0.5 text-xs tabular-nums text-gray-400">{timeLabel(n.createdAt)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="whitespace-pre-line text-sm text-gray-800 dark:text-gray-200">{n.description}</p>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          {[n.createdBy?.name, n.createdBy?.lastName].filter(Boolean).join(" ") || "Nepoznato"}
                          {n.createdBy?.role && ` · ${roleLabel(n.createdBy.role)}`}
                        </p>
                      </div>
                      {onAddAsCost && (
                        <button
                          type="button"
                          onClick={() => onAddAsCost(n.description.split("\n")[0]!.slice(0, 120))}
                          className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand-600 opacity-70 transition hover:bg-brand-50 hover:opacity-100 focus:opacity-100 group-hover:opacity-100 dark:text-brand-400 dark:hover:bg-brand-500/10"
                          aria-label={`Dodaj kao trošak: ${n.description.slice(0, 40)}`}
                        >
                          <LuReceipt className="h-3.5 w-3.5" /> Dodaj kao trošak
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )
        ) : careList.length === 0 ? (
          <EmptyState compact title={q ? "Nema rezultata" : "Nema unosa nege u ovom periodu"} />
        ) : (
          byDay(careList, (e) => e.performedAt).map((g) => (
            <div key={g.key}>
              <p className="sticky top-0 bg-gray-50 px-5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:bg-gray-800/80 dark:text-gray-400">{g.label}</p>
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {g.items.map((e) => (
                  <li key={e._id} className="flex items-start gap-3 px-5 py-2.5">
                    <span className="w-11 shrink-0 pt-0.5 text-xs tabular-nums text-gray-400">{timeLabel(e.performedAt)}</span>
                    <span className="mt-0.5 text-gray-400">{TYPE_ICON[e.type]}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-800 dark:text-gray-200">
                        {e.name} <span className="text-gray-500">× {formatQty(e.acceptedAmount ?? e.amount)}</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {personName(e.createdBy)}
                        {e.note && ` · „${e.note}”`}
                      </p>
                    </div>
                    <Badge size="sm" color={STATUS_META[e.status].color}>
                      {STATUS_META[e.status].label}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
