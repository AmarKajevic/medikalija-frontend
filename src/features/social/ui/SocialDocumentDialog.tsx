import { FormEvent, useEffect, useId, useState } from "react";
import { LuFileText, LuLock, LuTrash2 } from "react-icons/lu";
import Dialog, { ConfirmDialog } from "@shared/ui/dialog/Dialog";
import Button from "@shared/ui/button/Button";
import Badge from "@shared/ui/badge/Badge";
import Field from "@shared/ui/form/Field";
import { Input, Textarea } from "@shared/ui/form/controls";
import DateInput from "@shared/ui/form/DateInput";
import { notify } from "@shared/lib/notify";
import { todayIso } from "@shared/lib/dateText";
import { formatDay } from "@shared/lib/calendarDay";
import {
  DOC_TYPES,
  DocType,
  DocumentInput,
  fetchMergeData,
  GOAL_STATUS_LABEL,
  LEGACY_SECTION_LABEL,
  SocialDocument,
  SUPPORT_LEVELS,
  useDeleteDocument,
  useFinalizeDocument,
  useSaveDocument,
} from "@features/social/dossier";
import { formForDoc } from "@features/social/forms/catalog";
import { fetchFormTemplate, fillForm, formFileName } from "@features/social/forms/fillForm";
import { missingFor } from "@features/social/forms/status";
import SupportScaleTable from "./SupportScaleTable";
import DocxPreviewDialog from "./DocxPreview";

interface Props {
  open: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  /** Novi dokument ove vrste ili postojeći dokument */
  type: DocType;
  document?: SocialDocument | null;
  canWrite: boolean;
  /** Datum prijema — predlog teksta za prioritet u prijemnoj proceni */
  admissionDate?: string;
}

const plusMonths = (iso: string, months: number) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
};

/** Uobičajeni tekstovi iz obrazaca doma (menjaju se po potrebi) */
function defaultSections(type: DocType, admissionDate?: string): Record<string, string> {
  if (type === "intake") return { priority: `Bez liste čekanja, prijem realizovan ${admissionDate ? formatDay(admissionDate) : "…"} godine.` };
  if (type === "plan") return { timeframe: "Godinu dana.", evaluationMethod: "Izveštaj — ponovni pregled, evaluacija.", responsible: "socijalni radnik", implementers: "Svi zaposleni iz delokruga svog posla." };
  if (type === "support_scale") return { duration: "neodređeno" };
  return {};
}

function toInput(type: DocType, doc: SocialDocument | null | undefined, admissionDate?: string): DocumentInput {
  if (doc) {
    return {
      date: doc.date.slice(0, 10),
      sections: { ...doc.sections },
      supportLevel: doc.supportLevel,
      participants: doc.participants,
      goals: doc.goals.map((g) => ({ ...g, due: g.due ? g.due.slice(0, 10) : null })),
      nextReview: doc.nextReview ? doc.nextReview.slice(0, 10) : null,
      scale: Object.fromEntries(Object.entries(doc.scale ?? {}).map(([k, v]) => [k, { now: v?.now ?? null, expected: v?.expected ?? null }])),
    };
  }
  const date = todayIso();
  const next = DOC_TYPES[type].nextDate;
  return { date, sections: defaultSections(type, admissionDate), supportLevel: 0, participants: "", goals: [], nextReview: next ? plusMonths(date, next.months) : null, scale: {} };
}

// Stručni dokument socijalnog radnika — delovi su isti kao na obrascu doma, pa se tekst upisuje tačno
// na svoje mesto u Word obrascu. Nacrt se menja; zaključen dokument je zapis (pregled i obrazac).
export default function SocialDocumentDialog({ open, onClose, patientId, patientName, type, document: doc, canWrite, admissionDate }: Props) {
  const formId = useId();
  const id = useId();
  const meta = DOC_TYPES[type];
  const wordForm = formForDoc(type);
  const save = useSaveDocument(patientId);
  const finalize = useFinalizeDocument(patientId);
  const remove = useDeleteDocument(patientId);
  const [initial, setInitial] = useState<DocumentInput>(() => toInput(type, doc, admissionDate));
  const [form, setForm] = useState<DocumentInput>(initial);
  const [confirm, setConfirm] = useState<"finalize" | "delete" | "discard" | null>(null);
  const [preview, setPreview] = useState<{ file: Blob; missing: string[] } | null>(null);
  const [building, setBuilding] = useState(false);
  const readOnly = !canWrite || doc?.status === "final";
  const dirty = !readOnly && JSON.stringify(form) !== JSON.stringify(initial);
  // Delovi iz ranijeg oblika dokumenta (čuvaju se, prikazuju se samo za čitanje)
  const legacy = Object.entries(form.sections).filter(([key, value]) => value?.trim() && !meta.sections.some((s) => s.key === key));
  const level = SUPPORT_LEVELS.find((l) => l.value === doc?.supportLevel);

  // Pri otvaranju: podaci dokumenta (ne dira formu dok je otvorena)
  useEffect(() => {
    if (!open) return;
    const next = toInput(type, doc, admissionDate);
    setInitial(next);
    setForm(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- samo pri otvaranju
  }, [open]);

  const requestClose = () => (dirty ? setConfirm("discard") : onClose());
  const set = (patch: Partial<DocumentInput>) => setForm((f) => ({ ...f, ...patch }));
  const setSection = (key: string, value: string) => set({ sections: { ...form.sections, [key]: value } });

  const persist = () => save.mutateAsync({ id: doc?._id, type, input: form, expectedUpdatedAt: doc?.updatedAt });

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
      notify.success(`${meta.label}: zaključeno.`);
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

  // Word obrazac doma: nesačuvane izmene se prvo sačuvaju (obrazac se puni iz sačuvanog dokumenta)
  const openWordForm = async () => {
    if (!wordForm) return;
    setBuilding(true);
    try {
      if (dirty || (!doc && !readOnly)) {
        const saved = await persist();
        setInitial(form);
        if (!doc) notify.info(`Nacrt je sačuvan (${formatDay(saved.date)}).`);
      }
      const [template, data] = await Promise.all([fetchFormTemplate(wordForm), fetchMergeData(patientId, wordForm.title)]);
      setPreview({ file: await fillForm(wordForm, template, data), missing: missingFor(wordForm, data) });
    } catch (err) {
      notify.error(err, "Obrazac nije napravljen.");
    } finally {
      setBuilding(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={requestClose}
        size="xl"
        title={
          <span className="flex flex-wrap items-center gap-2">
            {meta.form && <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-gray-600 dark:bg-white/[0.06] dark:text-gray-300">Obrazac {meta.form}</span>}
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
        description={`${patientName} · ${meta.article} — ${meta.description}`}
        footer={
          <>
            {doc && !readOnly && (
              <Button variant="outline" size="sm" className="mr-auto text-error-600" startIcon={<LuTrash2 className="h-4 w-4" />} onClick={() => setConfirm("delete")}>
                Obriši nacrt
              </Button>
            )}
            {wordForm && (
              <Button variant="outline" size="sm" startIcon={<LuFileText className="h-4 w-4" />} loading={building} onClick={() => void openWordForm()}>
                Obrazac (Word)
              </Button>
            )}
            {readOnly ? (
              <Button size="sm" onClick={onClose}>
                Zatvori
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" type="submit" form={formId} loading={save.isPending && !confirm && !building}>
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
              {doc.finalizedBy && ` · ${doc.finalizedBy.name} ${doc.finalizedBy.lastName}`}. Zaključen dokument se ne menja — za promene napravite novi.
            </p>
          )}
          <fieldset disabled={readOnly} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
              <Field label={type === "plan_review" ? "Datum ponovnog pregleda" : type === "plan" ? "Datum izrade plana" : "Datum"} htmlFor={`${id}-date`}>
                <DateInput id={`${id}-date`} value={form.date} max={todayIso()} onChange={(v) => set({ date: v })} fromYear={2000} disabled={readOnly} />
              </Field>
              <Field label="Učesnici" htmlFor={`${id}-participants`} hint="Korisnik, porodica / staratelj, voditelj slučaja CSR-a, zaposleni (ne štampa se).">
                <Input id={`${id}-participants`} value={form.participants} onChange={(e) => set({ participants: e.target.value })} placeholder="npr. korisnik, sin, socijalni radnik, glavna sestra" />
              </Field>
            </div>

            {meta.scale && <SupportScaleTable value={form.scale} onChange={(scale) => set({ scale })} readOnly={readOnly} />}

            {meta.sections.map((s) =>
              readOnly && !form.sections[s.key] ? null : (
                <Field key={s.key} label={s.label} htmlFor={`${id}-${s.key}`} hint={readOnly ? undefined : s.hint || undefined}>
                  <Textarea id={`${id}-${s.key}`} rows={s.key === "priority" || s.key === "timeframe" || s.key === "duration" ? 1 : 3} value={form.sections[s.key] ?? ""} onChange={(e) => setSection(s.key, e.target.value)} />
                </Field>
              )
            )}

            {meta.nextDate && (
              <Field label={meta.nextDate.label} htmlFor={`${id}-next`} hint={readOnly ? undefined : meta.nextDate.hint}>
                <DateInput id={`${id}-next`} value={form.nextReview ?? ""} min={form.date} onChange={(v) => set({ nextReview: v || null })} disabled={readOnly} />
              </Field>
            )}
          </fieldset>

          {/* Raniji oblik dokumenta: stepen, ciljevi i delovi koji nisu na obrascu — samo za čitanje */}
          {(level && !meta.scale) || form.goals.length > 0 || legacy.length > 0 ? (
            <section className="space-y-3 rounded-xl border border-dashed border-gray-300 p-4 dark:border-gray-700">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Uneto u ranijem obliku dokumenta</p>
              {level && !meta.scale && (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Stepen podrške: <strong>{level.label}</strong> — {level.hint}
                </p>
              )}
              {form.goals.map((g, i) => (
                <div key={g._id ?? i} className="text-sm text-gray-700 dark:text-gray-300">
                  <p className="font-medium">
                    {i + 1}. {g.goal}
                    {g.status && <span className="ml-2 text-xs text-gray-500">({GOAL_STATUS_LABEL[g.status]})</span>}
                  </p>
                  {(g.activities || g.outcome) && <p className="text-xs text-gray-500 dark:text-gray-400">{[g.activities, g.outcome].filter(Boolean).join(" · ")}</p>}
                </div>
              ))}
              {legacy.map(([key, value]) => (
                <div key={key}>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{LEGACY_SECTION_LABEL[key] ?? key}</p>
                  <p className="whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">{value}</p>
                </div>
              ))}
            </section>
          ) : null}
        </form>
      </Dialog>

      <DocxPreviewDialog
        open={!!preview}
        onClose={() => setPreview(null)}
        title={wordForm ? `${wordForm.number}. ${wordForm.title} — ${patientName}` : ""}
        description={preview?.missing.length ? `Nisu uneti (ostaje prazna linija za ručni upis): ${preview.missing.join(", ")}.` : "Pregledajte obrazac pre preuzimanja ili štampe."}
        file={preview?.file ?? null}
        fileName={wordForm ? formFileName(wordForm, patientName) : "obrazac.docx"}
      />

      <ConfirmDialog
        open={confirm === "finalize"}
        onClose={() => setConfirm(null)}
        onConfirm={onFinalize}
        loading={save.isPending || finalize.isPending}
        variant="primary"
        title={`Zaključiti: ${meta.label}?`}
        description={
          meta.scale
            ? "Zaključen dokument postaje zapis u dosijeu i više se ne menja, a izračunat stepen podrške prelazi u karton korisnika."
            : "Zaključen dokument postaje zapis u dosijeu i više se ne menja. Za kasnije promene pravi se novi dokument."
        }
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
