import { FormEvent, useId, useMemo, useState } from "react";
import { LuClock } from "react-icons/lu";
import Field from "@shared/ui/form/Field";
import { Input, Textarea } from "@shared/ui/form/controls";
import Button from "@shared/ui/button/Button";
import DateInput from "@shared/ui/form/DateInput";
import SearchSelect from "@shared/ui/combobox/SearchSelect";
import { notify } from "@shared/lib/notify";
import { todayIso } from "@shared/lib/dateText";
import { usePatients } from "@features/patients/hooks/usePatients";
import { useCreateEntries, type PhysioKind } from "@features/nurse-entries/model";
import { usePhysioKinds } from "@features/physio/model";

const pad = (n: number) => String(n).padStart(2, "0");
const nowTime = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
/** Lokalni datum + vreme → ISO */
function performedAtIso(date: string, time: string): string | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{2}):(\d{2})$/.exec(time);
  if (!m || !t) return undefined;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(t[1]), Number(t[2])).toISOString();
}

// Fizioterapeut beleži kod kog pacijenta i kada je radio terapiju.
// Redovna se ne naplaćuje (samo se beleži); vanredna ide upravi, koja određuje cenu i odobrava je.
export default function PhysioEntryForm({ patientId: fixedPatient }: { patientId?: string }) {
  const ids = { patient: useId(), note: useId(), date: useId(), time: useId() };
  const { data: patientsData, isLoading: patientsLoading } = usePatients();
  const [patientId, setPatientId] = useState(fixedPatient ?? "");
  const [kind, setKind] = useState<PhysioKind | "">("");
  const [extra, setExtra] = useState(false);
  const [note, setNote] = useState("");
  const [customTime, setCustomTime] = useState(false);
  const [date, setDate] = useState(todayIso());
  const [time, setTime] = useState(nowTime());
  const create = useCreateEntries(fixedPatient ?? patientId);
  // Osnovne vrste i one koje je admin dodao u "Cene fizioterapije"
  const kinds = usePhysioKinds();

  const patientOptions = useMemo(
    () =>
      ((patientsData?.patients ?? []) as Array<{ _id: string; name: string; lastName: string; dischargeDate?: string | null }>)
        .filter((p) => !p.dischargeDate)
        .map((p) => ({ value: p._id, label: `${p.name} ${p.lastName}` }))
        .sort((a, b) => a.label.localeCompare(b.label, "sr")),
    [patientsData]
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!patientId) return notify.error("Izaberite pacijenta.");
    if (!kind) return notify.error("Izaberite vrstu terapije.");
    const performedAt = customTime ? performedAtIso(date, time) : undefined;
    if (customTime && !performedAt) return notify.error("Unesite ispravan datum i vreme.");
    if (performedAt && new Date(performedAt).getTime() > Date.now() + 60_000) return notify.error("Vreme ne može biti u budućnosti.");
    create.mutate([{ type: "physio", physioKind: kind, extra, note: note.trim() || undefined, performedAt }], {
      onSuccess: () => {
        notify.success(extra ? "Vanredna terapija je poslata upravi na odobrenje." : "Terapija je zabeležena.");
        setKind("");
        setExtra(false);
        setNote("");
        setCustomTime(false);
        if (!fixedPatient) setPatientId("");
      },
      onError: (err) => notify.error(err),
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {!fixedPatient && (
        <Field label="Pacijent" htmlFor={ids.patient}>
          <SearchSelect id={ids.patient} value={patientId} onChange={setPatientId} options={patientOptions} loading={patientsLoading} placeholder="Pretraži pacijente..." />
        </Field>
      )}

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Terapija</legend>
        <div role="radiogroup" className="space-y-2">
          {kinds.map(({ kind: k, name }, i) => (
            <label
              key={k}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${
                kind === k ? "border-brand-400 bg-brand-50 ring-1 ring-brand-400 dark:border-brand-500/60 dark:bg-brand-500/10" : "border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.03]"
              }`}
            >
              <input type="radio" name={`${ids.patient}-kind`} checked={kind === k} onChange={() => setKind(k)} className="accent-brand-600" />
              <span className="font-medium text-gray-800 dark:text-white/90">
                {i + 1}. {name}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Vrsta</legend>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: false, title: "Redovna", hint: "Ne naplaćuje se" },
            { value: true, title: "Vanredna", hint: "Naplaćuje se — odobrava uprava" },
          ].map((o) => (
            <button
              key={o.title}
              type="button"
              aria-pressed={extra === o.value}
              onClick={() => setExtra(o.value)}
              className={`rounded-xl border px-3 py-2 text-left transition ${
                extra === o.value ? "border-brand-400 bg-brand-50 ring-1 ring-brand-400 dark:border-brand-500/60 dark:bg-brand-500/10" : "border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.03]"
              }`}
            >
              <span className="block text-sm font-semibold text-gray-900 dark:text-white/90">{o.title}</span>
              <span className="block text-xs text-gray-500 dark:text-gray-400">{o.hint}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <Field label="Napomena (nije obavezno)" htmlFor={ids.note}>
        <Textarea id={ids.note} rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="npr. vežbe hoda, 30 min" />
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

      <Button type="submit" className="w-full" loading={create.isPending} disabled={!kind || (!fixedPatient && !patientId)}>
        {extra ? "Pošalji na odobrenje" : "Zabeleži terapiju"}
      </Button>
    </form>
  );
}
