import { FormEvent, useEffect, useId, useMemo, useState } from "react";
import Dialog from "@shared/ui/dialog/Dialog";
import Button from "@shared/ui/button/Button";
import Field from "@shared/ui/form/Field";
import { Input, Textarea } from "@shared/ui/form/controls";
import DateInput from "@shared/ui/form/DateInput";
import SearchSelect, { SearchOption } from "@shared/ui/combobox/SearchSelect";
import Avatar from "@shared/ui/avatar/Avatar";
import { notify } from "@shared/lib/notify";
import { todayIso } from "@shared/lib/dateText";
import { usePatients } from "@features/patients/hooks/usePatients";
import { NoteInput, SOCIAL_CATEGORIES, SocialNote, useSaveNote } from "@features/social/model";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Izmena postojeće beleške */
  note?: SocialNote | null;
  /** Pacijent je zadat (sa profila) */
  patientId?: string;
}

const dayKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
// Datum bez vremena se čuva kao podne, da ne pređe u drugi dan ni u jednoj zoni
const toIso = (day: string) => (day ? new Date(`${day}T12:00:00`).toISOString() : null);

export default function SocialNoteDialog({ open, onClose, note, patientId }: Props) {
  const formId = useId();
  const ids = { patient: useId(), date: useId(), title: useId(), text: useId(), contact: useId(), follow: useId() };
  const save = useSaveNote();
  const { data: patientsData } = usePatients();
  const [form, setForm] = useState({ patientId: "", category: "family" as NoteInput["category"], date: todayIso(), title: "", text: "", contact: "", followUp: "" });

  useEffect(() => {
    if (!open) return;
    setForm(
      note
        ? { patientId: note.patient._id, category: note.category, date: dayKey(note.date), title: note.title, text: note.text, contact: note.contact, followUp: note.followUp.date ? dayKey(note.followUp.date) : "" }
        : { patientId: patientId ?? "", category: "family", date: todayIso(), title: "", text: "", contact: "", followUp: "" }
    );
  }, [open, note, patientId]);

  const patientOptions: SearchOption[] = useMemo(
    () =>
      ((patientsData?.patients ?? []) as Array<{ _id: string; name: string; lastName: string; dischargeDate?: string }>)
        .sort((a, b) => `${a.lastName} ${a.name}`.localeCompare(`${b.lastName} ${b.name}`, "sr"))
        .map((p) => ({ value: p._id, label: `${p.lastName} ${p.name}`, description: p.dischargeDate ? "otpušten" : undefined, icon: <Avatar name={p.name} lastName={p.lastName} size="xs" /> })),
    [patientsData]
  );

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.patientId) return notify.error("Izaberite pacijenta.");
    if (!form.text.trim()) return notify.error("Unesite tekst beleške.");
    save.mutate(
      {
        id: note?._id,
        input: {
          patientId: form.patientId,
          category: form.category,
          date: toIso(form.date) ?? new Date().toISOString(),
          title: form.title.trim(),
          text: form.text.trim(),
          contact: form.contact.trim(),
          followUp: { date: toIso(form.followUp) },
        },
      },
      {
        onSuccess: () => {
          notify.success(note ? "Beleška je izmenjena." : "Beleška je sačuvana.");
          onClose();
        },
        onError: (err) => notify.error(err),
      }
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={note ? "Izmena beleške" : "Nova beleška"}
      description="Socijalni karton"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Otkaži
          </Button>
          <Button size="sm" type="submit" form={formId} loading={save.isPending}>
            Sačuvaj
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={onSubmit} className="space-y-4" noValidate>
        {!patientId && (
          <Field label="Pacijent" htmlFor={ids.patient}>
            <SearchSelect id={ids.patient} value={form.patientId} disabled={!!note} onChange={(v) => set({ patientId: v })} options={patientOptions} placeholder="Kucajte ime ili prezime..." />
          </Field>
        )}
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Vrsta</legend>
          <div className="flex flex-wrap gap-1.5">
            {SOCIAL_CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                aria-pressed={form.category === c.value}
                onClick={() => set({ category: c.value })}
                className={`rounded-full border px-3 py-1 text-sm transition ${
                  form.category === c.value ? "border-brand-400 bg-brand-50 font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-300" : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
          <Field label="Datum" htmlFor={ids.date}>
            <DateInput id={ids.date} value={form.date} max={todayIso()} onChange={(v) => set({ date: v })} fromYear={2020} />
          </Field>
          <Field label="Naslov (nije obavezno)" htmlFor={ids.title}>
            <Input id={ids.title} value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="npr. Dogovor o poseti za praznike" maxLength={160} />
          </Field>
        </div>
        <Field label="Beleška" htmlFor={ids.text}>
          <Textarea id={ids.text} rows={6} value={form.text} onChange={(e) => set({ text: e.target.value })} autoFocus />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kontakt (nije obavezno)" htmlFor={ids.contact} hint="S kim je razgovarano, telefon.">
            <Input id={ids.contact} value={form.contact} onChange={(e) => set({ contact: e.target.value })} placeholder="npr. sin Marko, 064 123 4567" maxLength={200} />
          </Field>
          <Field label="Podsetnik (nije obavezno)" htmlFor={ids.follow} hint="Do kada nešto treba uraditi — pojavljuje se na početnoj.">
            <DateInput id={ids.follow} value={form.followUp} min={todayIso()} onChange={(v) => set({ followUp: v })} />
          </Field>
        </div>
      </form>
    </Dialog>
  );
}
