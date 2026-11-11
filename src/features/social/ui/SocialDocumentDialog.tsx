import { FormEvent, useEffect, useId, useState } from "react";
import { LuLock, LuPlus, LuPrinter, LuTrash2 } from "react-icons/lu";
import Dialog, { ConfirmDialog } from "@shared/ui/dialog/Dialog";
import Button from "@shared/ui/button/Button";
import Badge from "@shared/ui/badge/Badge";
import Field from "@shared/ui/form/Field";
import { Input, Select, Textarea } from "@shared/ui/form/controls";
import DateInput from "@shared/ui/form/DateInput";
import { notify } from "@shared/lib/notify";
import { todayIso } from "@shared/lib/dateText";
import { formatDay } from "@shared/lib/calendarDay";
import {
  DOC_TYPES,
  DocType,
  DocumentInput,
  GOAL_STATUS_LABEL,
  PlanGoal,
  SocialDocument,
  SUPPORT_LEVELS,
  useDeleteDocument,
  useFinalizeDocument,
  useSaveDocument,
} from "@features/social/dossier";
import { printSocialDocument } from "./printSocialDocument";

interface Props {
  open: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  /** Novi dokument ove vrste ili postojeći dokument */
  type: DocType;
  document?: SocialDocument | null;
  canWrite: boolean;
  /** Ciljevi poslednjeg plana — predlog za pregled plana */
  previousGoals?: PlanGoal[];
}

const EMPTY_GOAL: PlanGoal = { area: "", goal: "", outcome: "", activities: "", responsible: "", due: null, status: "" };
/** Uobičajene oblasti individualnog plana (može se upisati i druga) */
const GOAL_AREAS = ["Adaptacija", "Socijalni kontakti", "Slobodno vreme", "Ostvarivanje prava", "Psihosocijalna podrška", "Samostalnost", "Zdravlje i nega"];

const plusMonths = (iso: string, months: number) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
};

function toInput(type: DocType, doc: SocialDocument | null | undefined, previousGoals: PlanGoal[] = []): DocumentInput {
  if (doc) {
    return {
      date: doc.date.slice(0, 10),
      sections: { ...doc.sections },
      supportLevel: doc.supportLevel,
      participants: doc.participants,
      goals: doc.goals.map((g) => ({ ...g, due: g.due ? g.due.slice(0, 10) : null })),
      nextReview: doc.nextReview ? doc.nextReview.slice(0, 10) : null,
    };
  }
  const date = todayIso();
  const isPlan = type === "plan" || type === "plan_review";
  return {
    date,
    sections: {},
    supportLevel: 0,
    participants: "",
    // Pregled plana kreće od ciljeva poslednjeg plana; novi plan od jednog praznog cilja
    goals:
      type === "plan_review"
        ? previousGoals.map((g) => ({ area: g.area ?? "", goal: g.goal, outcome: g.outcome, activities: g.activities, responsible: g.responsible, due: g.due ? g.due.slice(0, 10) : null, status: "" as const }))
        : type === "plan"
          ? [{ ...EMPTY_GOAL }]
          : [],
    nextReview: isPlan ? plusMonths(date, 12) : null,
  };
}

// Procena, ponovna procena, individualni plan usluge i pregled plana. Nacrt se menja,
// zaključen dokument je zapis (samo pregled i štampa).
export default function SocialDocumentDialog({ open, onClose, patientId, patientName, type, document: doc, canWrite, previousGoals }: Props) {
  const formId = useId();
  const id = useId();
  const meta = DOC_TYPES[type];
  const save = useSaveDocument(patientId);
  const finalize = useFinalizeDocument(patientId);
  const remove = useDeleteDocument(patientId);
  const [initial, setInitial] = useState<DocumentInput>(() => toInput(type, doc, previousGoals));
  const [form, setForm] = useState<DocumentInput>(initial);
  const [confirm, setConfirm] = useState<"finalize" | "delete" | "discard" | null>(null);
  const readOnly = !canWrite || doc?.status === "final";
  const dirty = !readOnly && JSON.stringify(form) !== JSON.stringify(initial);

  // Pri otvaranju: podaci dokumenta (ne dira formu dok je otvorena)
  useEffect(() => {
    if (!open) return;
    const next = toInput(type, doc, previousGoals);
    setInitial(next);
    setForm(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- samo pri otvaranju
  }, [open]);

  const requestClose = () => (dirty ? setConfirm("discard") : onClose());

  const set = (patch: Partial<DocumentInput>) => setForm((f) => ({ ...f, ...patch }));
  const setSection = (key: string, value: string) => set({ sections: { ...form.sections, [key]: value } });
  const setGoal = (i: number, patch: Partial<PlanGoal>) => set({ goals: form.goals.map((g, j) => (j === i ? { ...g, ...patch } : g)) });

  const persist = async () => {
    const saved = await save.mutateAsync({ id: doc?._id, type, input: form, expectedUpdatedAt: doc?.updatedAt });
    return saved;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await persist();
      notify.success("Nacrt je sačuvan.");
      onClose();
    } catch (err) {
      notify.error(err);
    }
  };

  const onFinalize = async () => {
    try {
      const saved = await persist();
      await finalize.mutateAsync(saved._id);
      notify.success(`${meta.label} je zaključen${type === "plan" || type === "plan_review" ? "" : "a"}.`);
      setConfirm(null);
      onClose();
    } catch (err) {
      setConfirm(null);
      notify.error(err);
    }
  };

  const onDelete = () => {
    if (!doc) return;
    remove.mutate(doc._id, {
      onSuccess: () => {
        notify.success("Nacrt je obrisan.");
        setConfirm(null);
        onClose();
      },
      onError: (err) => notify.error(err),
    });
  };

  const print = () => printSocialDocument({ type, patientName, input: form, document: doc ?? null });

  return (
    <>
      <Dialog
        open={open}
        onClose={requestClose}
        size="xl"
        title={
          <span className="flex flex-wrap items-center gap-2">
            {meta.label}
            {doc?.status === "final" ? (
              <Badge size="sm" color="success" startIcon={<LuLock className="h-3 w-3" />}>
                zaključeno
              </Badge>
            ) : doc ? (
              <Badge size="sm" color="warning">
                nacrt
              </Badge>
            ) : null}
          </span>
        }
        description={`${patientName} · ${meta.article} Pravilnika o standardima — ${meta.description}`}
        footer={
          <>
            {doc && !readOnly && (
              <Button variant="outline" size="sm" className="mr-auto text-error-600" startIcon={<LuTrash2 className="h-4 w-4" />} onClick={() => setConfirm("delete")}>
                Obriši nacrt
              </Button>
            )}
            <Button variant="outline" size="sm" startIcon={<LuPrinter className="h-4 w-4" />} onClick={print}>
              Štampaj
            </Button>
            {readOnly ? (
              <Button size="sm" onClick={onClose}>
                Zatvori
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" type="submit" form={formId} loading={save.isPending && !confirm}>
                  Sačuvaj nacrt
                </Button>
                <Button size="sm" onClick={() => setConfirm("finalize")}>
                  Zaključi
                </Button>
              </>
            )}
          </>
        }
      >
        <form id={formId} onSubmit={onSubmit} className="space-y-5" noValidate>
          {doc?.status === "final" && (
            <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:bg-white/[0.03] dark:text-gray-400">
              Zaključeno {formatDay(doc.finalizedAt)}
              {doc.finalizedBy && ` · ${doc.finalizedBy.name} ${doc.finalizedBy.lastName}`}. Zaključen dokument se ne menja — za promene napravite novu procenu ili pregled plana.
            </p>
          )}
          <fieldset disabled={readOnly} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
              <Field label="Datum" htmlFor={`${id}-date`}>
                <DateInput id={`${id}-date`} value={form.date} max={todayIso()} onChange={(v) => set({ date: v })} fromYear={2000} disabled={readOnly} />
              </Field>
              <Field label="Učesnici" htmlFor={`${id}-participants`} hint="Korisnik, porodica / staratelj, osoba od poverenja, voditelj slučaja CSR-a, zaposleni.">
                <Input id={`${id}-participants`} value={form.participants} onChange={(e) => set({ participants: e.target.value })} placeholder="npr. korisnik, sin Marko, soc. radnik, glavna sestra" />
              </Field>
            </div>

            {meta.levels && (
              <fieldset>
                <legend className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Stepen podrške (čl. 15)</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {SUPPORT_LEVELS.map((l) => (
                    <label
                      key={l.value}
                      className={`flex cursor-pointer gap-2.5 rounded-lg border p-3 text-sm transition ${
                        form.supportLevel === l.value ? "border-brand-400 bg-brand-50 dark:bg-brand-500/10" : "border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.03]"
                      }`}
                    >
                      <input type="radio" name={`${id}-level`} className="mt-0.5 accent-brand-600" checked={form.supportLevel === l.value} onChange={() => set({ supportLevel: l.value })} />
                      <span>
                        <span className="block font-medium text-gray-900 dark:text-white/90">{l.label}</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">{l.hint}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            {meta.sections.map((s) =>
              readOnly && !form.sections[s.key] ? null : (
                <Field key={s.key} label={s.label} htmlFor={`${id}-${s.key}`} hint={readOnly ? undefined : s.hint}>
                  <Textarea id={`${id}-${s.key}`} rows={3} value={form.sections[s.key] ?? ""} onChange={(e) => setSection(s.key, e.target.value)} />
                </Field>
              )
            )}

            {meta.goals && (
              <section className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white/90">Ciljevi i aktivnosti</h4>
                {form.goals.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Još nema ciljeva.</p>}
                {form.goals.map((g, i) => (
                  <div key={g._id ?? i} className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                    <div className="flex items-start gap-2">
                      <span className="mt-2.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">{i + 1}</span>
                      <Field label="Cilj" htmlFor={`${id}-g${i}-goal`} className="flex-1">
                        <Input id={`${id}-g${i}-goal`} value={g.goal} onChange={(e) => setGoal(i, { goal: e.target.value })} placeholder="Šta želimo da postignemo" />
                      </Field>
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => set({ goals: form.goals.filter((_, j) => j !== i) })}
                          aria-label={`Ukloni cilj ${i + 1}`}
                          className="mt-7 flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/10"
                        >
                          <LuTrash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Field label="Oblast" htmlFor={`${id}-g${i}-area`}>
                        <Input id={`${id}-g${i}-area`} value={g.area} onChange={(e) => setGoal(i, { area: e.target.value })} placeholder="npr. Adaptacija" list={`${id}-areas`} />
                      </Field>
                      <Field label="Očekivani ishod" htmlFor={`${id}-g${i}-outcome`}>
                        <Input id={`${id}-g${i}-outcome`} value={g.outcome} onChange={(e) => setGoal(i, { outcome: e.target.value })} placeholder="Po čemu ćemo znati da je ostvaren" />
                      </Field>
                      <Field label="Odgovorno lice" htmlFor={`${id}-g${i}-resp`}>
                        <Input id={`${id}-g${i}-resp`} value={g.responsible} onChange={(e) => setGoal(i, { responsible: e.target.value })} placeholder="Ime ili uloga" />
                      </Field>
                    </div>
                    <Field label="Aktivnosti" htmlFor={`${id}-g${i}-act`}>
                      <Textarea id={`${id}-g${i}-act`} rows={2} value={g.activities} onChange={(e) => setGoal(i, { activities: e.target.value })} placeholder="Konkretno: šta, ko, koliko često" />
                    </Field>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Rok" htmlFor={`${id}-g${i}-due`}>
                        <DateInput id={`${id}-g${i}-due`} value={g.due ?? ""} onChange={(v) => setGoal(i, { due: v || null })} disabled={readOnly} />
                      </Field>
                      {type === "plan_review" && (
                        <Field label="Ishod pregleda" htmlFor={`${id}-g${i}-status`}>
                          <Select id={`${id}-g${i}-status`} value={g.status} onChange={(e) => setGoal(i, { status: e.target.value as PlanGoal["status"] })}>
                            <option value="">Nije ocenjeno</option>
                            {Object.entries(GOAL_STATUS_LABEL).map(([v, l]) => (
                              <option key={v} value={v}>
                                {l}
                              </option>
                            ))}
                          </Select>
                        </Field>
                      )}
                    </div>
                  </div>
                ))}
                <datalist id={`${id}-areas`}>
                  {GOAL_AREAS.map((a) => (
                    <option key={a} value={a} />
                  ))}
                </datalist>
                {!readOnly && (
                  <Button size="sm" variant="outline" startIcon={<LuPlus className="h-4 w-4" />} onClick={() => set({ goals: [...form.goals, { ...EMPTY_GOAL }] })}>
                    Dodaj cilj
                  </Button>
                )}
                <Field label="Rok za ponovni pregled plana" htmlFor={`${id}-next`} hint="Najkasnije 12 meseci (čl. 17); može i ranije.">
                  <DateInput id={`${id}-next`} value={form.nextReview ?? ""} min={form.date} onChange={(v) => set({ nextReview: v || null })} disabled={readOnly} />
                </Field>
              </section>
            )}
          </fieldset>
        </form>
      </Dialog>

      <ConfirmDialog
        open={confirm === "finalize"}
        onClose={() => setConfirm(null)}
        onConfirm={onFinalize}
        loading={save.isPending || finalize.isPending}
        variant="primary"
        title={`Zaključiti: ${meta.label}?`}
        description="Zaključen dokument postaje zapis u dosijeu i više se ne menja. Za kasnije promene pravi se nova procena ili pregled plana."
        confirmText="Zaključi"
      />
      <ConfirmDialog
        open={confirm === "discard"}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null);
          onClose();
        }}
        title="Odbaciti nesačuvane izmene?"
        description="Izmene koje niste sačuvali biće izgubljene. Sačuvajte nacrt ako želite da nastavite kasnije."
        confirmText="Odbaci izmene"
      />
      <ConfirmDialog
        open={confirm === "delete"}
        onClose={() => setConfirm(null)}
        onConfirm={onDelete}
        loading={remove.isPending}
        title="Obrisati nacrt?"
        description="Nacrt će biti trajno obrisan."
        confirmText="Obriši"
      />
    </>
  );
}
