import { FormEvent, useId, useMemo, useState } from "react";
import { LuCheck, LuClock, LuMinus, LuPlus, LuSearch } from "react-icons/lu";
import { Input, Textarea } from "@shared/ui/form/controls";
import Field from "@shared/ui/form/Field";
import Button from "@shared/ui/button/Button";
import DateInput from "@shared/ui/form/DateInput";
import EmptyState from "@shared/ui/feedback/EmptyState";
import { Skeleton } from "@shared/ui/feedback/Spinner";
import { notify } from "@shared/lib/notify";
import { normalizeSearch } from "@shared/lib/search";
import { todayIso } from "@shared/lib/dateText";
import { CareTask, isBillableTask, useCareTasks, useCreateEntries } from "@features/nurse-entries/model";

const pad = (n: number) => String(n).padStart(2, "0");
const nowTime = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Lokalni datum + vreme → ISO; prazno ako je "sada" */
function performedAtIso(date: string, time: string): string | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{2}):(\d{2})$/.exec(time);
  if (!m || !t) return undefined;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(t[1]), Number(t[2])).toISOString();
}

// Sestra bira iz kataloga šta je urađeno pacijentu (može više odjednom).
export default function CareTaskPicker({ patientId, onSaved }: { patientId: string; onSaved?: () => void }) {
  const ids = { note: useId(), date: useId(), time: useId() };
  const { data: tasks = [], isLoading } = useCareTasks();
  const create = useCreateEntries(patientId);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [note, setNote] = useState("");
  const [customTime, setCustomTime] = useState(false);
  const [date, setDate] = useState(todayIso());
  const [time, setTime] = useState(nowTime());

  const groups = useMemo(() => {
    const q = normalizeSearch(query.trim());
    const visible = tasks.filter((t) => !q || normalizeSearch(`${t.name} ${t.category}`).includes(q));
    const byCategory = new Map<string, CareTask[]>();
    for (const t of visible) byCategory.set(t.category || "Nega", [...(byCategory.get(t.category || "Nega") ?? []), t]);
    return [...byCategory.entries()];
  }, [tasks, query]);

  const chosen = tasks.filter((t) => selected[t._id]);
  const count = chosen.reduce((s, t) => s + (selected[t._id] ?? 0), 0);
  const needsApproval = chosen.some(isBillableTask);

  const toggle = (id: string) => setSelected((s) => (s[id] ? omit(s, id) : { ...s, [id]: 1 }));
  const step = (id: string, delta: number) =>
    setSelected((s) => {
      const next = (s[id] ?? 0) + delta;
      return next <= 0 ? omit(s, id) : { ...s, [id]: Math.min(next, 99) };
    });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (chosen.length === 0) return notify.error("Izaberite bar jednu uslugu.");
    const performedAt = customTime ? performedAtIso(date, time) : undefined;
    if (customTime && !performedAt) return notify.error("Unesite ispravan datum i vreme.");
    if (performedAt && new Date(performedAt).getTime() > Date.now() + 60_000) return notify.error("Vreme ne može biti u budućnosti.");

    create.mutate(
      chosen.map((t) => ({ type: "care" as const, itemId: t._id, amount: selected[t._id], note: note.trim() || undefined, performedAt })),
      {
        onSuccess: (res) => {
          notify.success(res.message);
          setSelected({});
          setNote("");
          setCustomTime(false);
          onSaved?.();
        },
        onError: (err) => notify.error(err),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14" />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return <EmptyState compact title="Lista usluga je prazna" description="Uprava dodaje usluge nege u meniju Usluge nege." />;
  }

  return (
    <form onSubmit={onSubmit} className="@container space-y-4">
      {tasks.length > 8 && (
        <Input leading={<LuSearch className="h-4 w-4" />} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pretraži usluge..." aria-label="Pretraži usluge" />
      )}

      <div className="max-h-[420px] space-y-4 overflow-y-auto pr-1">
        {groups.length === 0 && <p className="py-6 text-center text-sm text-gray-500">Nema usluge za „{query}”.</p>}
        {groups.map(([category, items]) => (
          <div key={category}>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">{category}</p>
            <div className="grid gap-2 @md:grid-cols-2">
              {items.map((t) => {
                const qty = selected[t._id] ?? 0;
                return (
                  <div
                    key={t._id}
                    className={`flex items-center rounded-xl border transition ${
                      qty ? "border-brand-400 bg-brand-50 ring-1 ring-brand-400 dark:border-brand-500/60 dark:bg-brand-500/10" : "border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.03]"
                    }`}
                  >
                    <button
                      type="button"
                      aria-pressed={qty > 0}
                      onClick={() => toggle(t._id)}
                      className="flex min-h-12 min-w-0 flex-1 items-center gap-2.5 px-3 py-2 text-left"
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                          qty ? "border-brand-500 bg-brand-500 text-white" : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        {qty > 0 && <LuCheck className="h-3.5 w-3.5" />}
                      </span>
                      <span className="text-sm font-medium text-gray-800 dark:text-white/90">{t.name}</span>
                    </button>
                    {qty > 0 && (
                      <span className="flex shrink-0 items-center gap-1 pr-2">
                        <button type="button" onClick={() => step(t._id, -1)} aria-label={`Manje: ${t.name}`} className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 hover:bg-white dark:hover:bg-white/10">
                          <LuMinus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold tabular-nums" aria-label={`Broj puta: ${qty}`}>
                          {qty}×
                        </span>
                        <button type="button" onClick={() => step(t._id, 1)} aria-label={`Više: ${t.name}`} className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 hover:bg-white dark:hover:bg-white/10">
                          <LuPlus className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <Field label="Napomena (nije obavezno)" htmlFor={ids.note}>
        <Textarea id={ids.note} rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="npr. pacijent nemiran tokom noći" />
      </Field>

      {customTime ? (
        <div className="grid grid-cols-[1fr_120px] gap-2">
          <Field label="Datum" htmlFor={ids.date}>
            <DateInput id={ids.date} value={date} onChange={setDate} max={todayIso()} />
          </Field>
          <Field label="Vreme" htmlFor={ids.time}>
            <Input id={ids.time} type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </Field>
        </div>
      ) : (
        <button type="button" onClick={() => setCustomTime(true)} className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
          <LuClock className="h-3.5 w-3.5" /> Urađeno sada · promeni vreme
        </button>
      )}

      <Button type="submit" className="w-full" loading={create.isPending} disabled={chosen.length === 0}>
        {chosen.length === 0 ? "Izaberite uslugu" : `Sačuvaj (${count})`}
      </Button>
      {needsApproval && <p className="-mt-2 text-center text-xs text-gray-500 dark:text-gray-400">Deo izabranog se naplaćuje — uprava ga odobrava pre ulaska u specifikaciju.</p>}
    </form>
  );
}

function omit(obj: Record<string, number>, key: string) {
  const next = { ...obj };
  delete next[key];
  return next;
}
