import { FormEvent, useEffect, useId, useMemo, useState } from "react";
import { LuMapPin, LuRepeat, LuTrash2, LuUser } from "react-icons/lu";
import Dialog from "@shared/ui/dialog/Dialog";
import Button from "@shared/ui/button/Button";
import Field from "@shared/ui/form/Field";
import { Input, Select, Textarea } from "@shared/ui/form/controls";
import DateInput from "@shared/ui/form/DateInput";
import TimeInput from "@shared/ui/form/TimeInput";
import { durationLabel } from "@shared/lib/timeText";
import { notify } from "@shared/lib/notify";
import { usePatients } from "@features/patients/hooks/usePatients";
import { EVENT_COLORS } from "@features/calendar/colors";
import {
  combine,
  dateKey,
  Draft,
  Freq,
  minutesBetween,
  parseKey,
  recurrenceOf,
  RepeatPreset,
  Scope,
  shiftKey,
  timeKey,
  useDeleteEvent,
  useSaveEvent,
  validateDraft,
  WEEKDAY_NAMES,
  WEEKDAY_SHORT,
  weekdayIndex,
} from "@features/calendar/model";
import ScopeDialog from "./ScopeDialog";

const DURATIONS = [15, 30, 45, 60, 90, 120];

interface Props {
  draft: Draft | null;
  onClose: () => void;
  /** Ako pacijent ne sme da se menja (otvoreno sa profila pacijenta) */
  lockPatient?: boolean;
}

interface PatientRow {
  _id: string;
  name: string;
  lastName: string;
  dischargeDate?: string | null;
}

export default function EventDialog({ draft: initial, onClose, lockPatient }: Props) {
  const formId = useId();
  const ids = { title: useId(), sd: useId(), st: useId(), ed: useId(), et: useId(), repeat: useId(), patient: useId(), location: useId(), desc: useId(), interval: useId(), until: useId(), count: useId() };
  const [d, setD] = useState<Draft | null>(initial);
  const [scopeFor, setScopeFor] = useState<"save" | "delete" | null>(null);
  const save = useSaveEvent();
  const remove = useDeleteEvent();
  const { data: patientsData } = usePatients();

  useEffect(() => setD(initial), [initial]);

  const patients = useMemo(
    () =>
      ((patientsData?.patients ?? []) as PatientRow[])
        .filter((p) => !p.dischargeDate || p._id === d?.patientId)
        .sort((a, b) => `${a.lastName} ${a.name}`.localeCompare(`${b.lastName} ${b.name}`, "sr")),
    [patientsData, d?.patientId]
  );

  if (!d) return null;

  const editing = !!d.eventId;
  const occ = d.occurrence;
  const seriesOccurrence = !!occ?.recurring && !occ.isException;
  const set = (patch: Partial<Draft>) => setD((cur) => (cur ? { ...cur, ...patch } : cur));
  const setRepeat = (patch: Partial<Draft["repeat"]>) => setD((cur) => (cur ? { ...cur, repeat: { ...cur.repeat, ...patch } } : cur));

  const start = combine(d.startDate, d.startTime);
  const end = combine(d.endDate, d.endTime);
  const duration = minutesBetween(start, end);

  // Promena početka pomera i kraj (trajanje ostaje), kao u Google kalendaru
  const setStart = (date: string, time: string) => {
    if (!date) return set({ startDate: date });
    if (d.allDay) {
      const length = Math.round((parseKey(d.endDate).getTime() - parseKey(d.startDate).getTime()) / 86_400_000);
      return set({ startDate: date, endDate: shiftKey(date, Math.max(length, 0)) });
    }
    const keep = duration > 0 ? duration : 60;
    const newEnd = new Date(combine(date, time).getTime() + keep * 60_000);
    set({ startDate: date, startTime: time, endDate: dateKey(newEnd), endTime: timeKey(newEnd) });
  };
  const setDuration = (minutes: number) => {
    const e = new Date(start.getTime() + minutes * 60_000);
    set({ endDate: dateKey(e), endTime: timeKey(e) });
  };

  const repeatOptions: Array<[RepeatPreset, string]> = [
    ["none", "Ne ponavlja se"],
    ["daily", "Svaki dan"],
    ["weekdays", "Radnim danima (pon – pet)"],
    ["weekly", `Svake nedelje (${WEEKDAY_NAMES[weekdayIndex(d.startDate)]})`],
    ["monthly", `Svakog meseca (${parseKey(d.startDate).getDate()}.)`],
    ["custom", "Prilagođeno..."],
  ];

  const originalRule = JSON.stringify(occ?.recurrence ?? null);
  const ruleChanged = () => JSON.stringify(recurrenceOf(d)) !== originalRule;

  const doSave = (scope: Scope) =>
    save.mutate(
      { draft: d, scope },
      {
        onSuccess: () => {
          notify.success(editing ? "Događaj je izmenjen." : "Događaj je dodat.");
          setScopeFor(null);
          onClose();
        },
        onError: (err) => notify.error(err),
      }
    );

  const doDelete = (scope: Scope) =>
    occ &&
    remove.mutate(
      { occurrence: occ, scope },
      {
        onSuccess: () => {
          notify.success(scope === "occurrence" ? "Termin je obrisan." : "Događaj je obrisan.");
          setScopeFor(null);
          onClose();
        },
        onError: (err) => notify.error(err),
      }
    );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const problem = validateDraft(d);
    if (problem) return notify.error(problem);
    // Promena pravila ponavljanja važi samo za ceo niz
    if (seriesOccurrence && !ruleChanged()) return setScopeFor("save");
    doSave("series");
  };

  const onDelete = () => (seriesOccurrence ? setScopeFor("delete") : doDelete("series"));

  return (
    <>
      <Dialog
        open
        onClose={onClose}
        size="lg"
        title={editing ? "Izmena događaja" : "Novi događaj"}
        footer={
          <>
            {editing && occ && (
              <Button variant="ghost" size="sm" className="mr-auto text-error-600 hover:bg-error-50 dark:text-error-400" startIcon={<LuTrash2 className="h-4 w-4" />} loading={remove.isPending} onClick={onDelete}>
                Obriši
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onClose}>
              Otkaži
            </Button>
            <Button size="sm" type="submit" form={formId} loading={save.isPending}>
              Sačuvaj
            </Button>
          </>
        }
      >
        <form id={formId} onSubmit={onSubmit} className="space-y-5" noValidate>
          <Field label="Naziv" htmlFor={ids.title}>
            <Input id={ids.title} autoFocus value={d.title} onChange={(e) => set({ title: e.target.value })} placeholder="npr. Pregled kardiologa" maxLength={160} />
          </Field>

          {/* Vreme */}
          <div className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked={d.allDay} onChange={(e) => set({ allDay: e.target.checked, endDate: e.target.checked && d.endDate < d.startDate ? d.startDate : d.endDate })} className="h-4 w-4 accent-brand-600" />
              Ceo dan
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className={`grid gap-2 ${d.allDay ? "" : "grid-cols-[1fr_7rem]"}`}>
                <Field label="Počinje" htmlFor={ids.sd}>
                  <DateInput id={ids.sd} value={d.startDate} onChange={(v) => setStart(v, d.startTime)} fromYear={2020} />
                </Field>
                {!d.allDay && (
                  <Field label="u" htmlFor={ids.st}>
                    <TimeInput id={ids.st} value={d.startTime} onChange={(v) => setStart(d.startDate, v)} />
                  </Field>
                )}
              </div>
              <div className={`grid gap-2 ${d.allDay ? "" : "grid-cols-[1fr_7rem]"}`}>
                <Field label="Završava" htmlFor={ids.ed}>
                  <DateInput id={ids.ed} value={d.endDate} min={d.startDate || undefined} onChange={(v) => set({ endDate: v })} fromYear={2020} />
                </Field>
                {!d.allDay && (
                  <Field label="u" htmlFor={ids.et}>
                    <TimeInput id={ids.et} value={d.endTime} onChange={(v) => set({ endTime: v })} durationFrom={d.endDate === d.startDate ? d.startTime : undefined} invalid={duration <= 0} />
                  </Field>
                )}
              </div>
            </div>
            {!d.allDay && (
              <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Trajanje">
                <span className="mr-1 text-xs text-gray-500 dark:text-gray-400">Trajanje:</span>
                {DURATIONS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDuration(m)}
                    aria-pressed={duration === m}
                    className={`rounded-full border px-2.5 py-0.5 text-xs transition ${
                      duration === m ? "border-brand-400 bg-brand-50 font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-300" : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {durationLabel(m)}
                  </button>
                ))}
                {duration > 0 && !DURATIONS.includes(duration) && <span className="text-xs text-gray-500">({durationLabel(duration)})</span>}
              </div>
            )}

            {/* Ponavljanje */}
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Ponavljanje" htmlFor={ids.repeat}>
                <Select id={ids.repeat} value={d.repeat.preset} onChange={(e) => setRepeat({ preset: e.target.value as RepeatPreset })}>
                  {repeatOptions.map(([v, label]) => (
                    <option key={v} value={v}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            {d.repeat.preset === "custom" && (
              <div className="space-y-3 rounded-lg bg-gray-50 p-3 dark:bg-white/[0.03]">
                <div className="flex flex-wrap items-end gap-2">
                  <Field label="Ponavlja se svakih" htmlFor={ids.interval}>
                    <Input id={ids.interval} type="number" min={1} max={99} value={d.repeat.interval} onChange={(e) => setRepeat({ interval: Number(e.target.value) })} className="w-20" />
                  </Field>
                  <Select aria-label="Jedinica" value={d.repeat.freq} onChange={(e) => setRepeat({ freq: e.target.value as Freq })} className="w-36">
                    <option value="daily">dana</option>
                    <option value="weekly">nedelja</option>
                    <option value="monthly">meseci</option>
                  </Select>
                </div>
                {d.repeat.freq === "weekly" && (
                  <div role="group" aria-label="Dani u nedelji" className="flex flex-wrap gap-1.5">
                    {WEEKDAY_SHORT.map((label, i) => {
                      const on = d.repeat.byWeekday.includes(i);
                      return (
                        <button
                          key={label}
                          type="button"
                          aria-pressed={on}
                          aria-label={WEEKDAY_NAMES[i]}
                          onClick={() => setRepeat({ byWeekday: on ? d.repeat.byWeekday.filter((x) => x !== i) : [...d.repeat.byWeekday, i].sort() })}
                          className={`h-9 w-11 rounded-lg text-xs font-medium transition ${on ? "bg-brand-600 text-white" : "bg-white text-gray-600 ring-1 ring-inset ring-gray-200 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-300 dark:ring-gray-700"}`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}
                <fieldset className="space-y-2">
                  <legend className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Završava se</legend>
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input type="radio" name="ends" checked={d.repeat.ends === "never"} onChange={() => setRepeat({ ends: "never" })} className="accent-brand-600" /> Nikad
                  </label>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <label className="flex items-center gap-2">
                      <input type="radio" name="ends" checked={d.repeat.ends === "until"} onChange={() => setRepeat({ ends: "until", until: d.repeat.until || shiftKey(d.startDate, 30) })} className="accent-brand-600" /> Dana
                    </label>
                    {d.repeat.ends === "until" && (
                      <div className="w-44">
                        <DateInput id={ids.until} value={d.repeat.until} min={d.startDate} onChange={(v) => setRepeat({ until: v })} fromYear={2020} aria-describedby={undefined} />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <label className="flex items-center gap-2">
                      <input type="radio" name="ends" checked={d.repeat.ends === "count"} onChange={() => setRepeat({ ends: "count" })} className="accent-brand-600" /> Posle
                    </label>
                    {d.repeat.ends === "count" && (
                      <>
                        <Input aria-label="Broj ponavljanja" type="number" min={1} max={500} value={d.repeat.count} onChange={(e) => setRepeat({ count: Number(e.target.value) })} className="w-20" />
                        <span>ponavljanja</span>
                      </>
                    )}
                  </div>
                </fieldset>
              </div>
            )}
            {seriesOccurrence && (
              <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <LuRepeat className="h-3.5 w-3.5" /> Menjate termin iz niza — pri čuvanju birate samo ovaj ili sve termine.
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Pacijent (nije obavezno)" htmlFor={ids.patient}>
              <Select id={ids.patient} value={d.patientId} disabled={lockPatient} onChange={(e) => set({ patientId: e.target.value })}>
                <option value="">— bez pacijenta —</option>
                {patients.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.lastName} {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Mesto (nije obavezno)" htmlFor={ids.location}>
              <Input id={ids.location} leading={<LuMapPin className="h-4 w-4" />} value={d.location} onChange={(e) => set({ location: e.target.value })} placeholder="npr. Dom zdravlja, ordinacija 12" maxLength={200} />
            </Field>
          </div>

          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Vrsta</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {EVENT_COLORS.map((c) => (
                <label
                  key={c.value}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                    d.calendar === c.value ? "border-brand-500 bg-brand-50 text-gray-900 dark:bg-brand-500/10 dark:text-white" : "border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
                  }`}
                >
                  <input type="radio" name="event-color" className="sr-only" checked={d.calendar === c.value} onChange={() => set({ calendar: c.value })} />
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${c.className}`} />
                  {c.label}
                </label>
              ))}
            </div>
          </fieldset>

          <Field label="Opis (nije obavezno)" htmlFor={ids.desc}>
            <Textarea id={ids.desc} rows={3} value={d.description} onChange={(e) => set({ description: e.target.value })} placeholder="npr. poneti nalaz i uput" maxLength={2000} />
          </Field>
          {lockPatient && d.patientId && (
            <p className="flex items-center gap-1.5 text-xs text-gray-500">
              <LuUser className="h-3.5 w-3.5" /> Termin se vezuje za ovog pacijenta i vidi se na njegovom profilu.
            </p>
          )}
        </form>
      </Dialog>

      <ScopeDialog
        open={!!scopeFor}
        action={scopeFor ?? "save"}
        loading={save.isPending || remove.isPending}
        onClose={() => setScopeFor(null)}
        onPick={(scope) => (scopeFor === "delete" ? doDelete(scope) : doSave(scope))}
      />
    </>
  );
}
