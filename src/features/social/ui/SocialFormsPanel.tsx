import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { LuCircleAlert, LuCircleCheck, LuFileArchive, LuFileText, LuNotebookPen, LuPencilLine, LuPlus, LuUserPen } from "react-icons/lu";
import { Card, CardHeader } from "@shared/ui/card/Card";
import Button from "@shared/ui/button/Button";
import Badge from "@shared/ui/badge/Badge";
import { Skeleton } from "@shared/ui/feedback/Spinner";
import { ErrorState } from "@shared/ui/feedback/EmptyState";
import { notify } from "@shared/lib/notify";
import { formatDay } from "@shared/lib/calendarDay";
import { paths } from "@app/paths";
import { DEADLINE_LABEL, deadlineState, DOC_TYPES, fetchMergeData, SocialDocument, useSocialDeadlines, useSocialDocuments, useSocialProfile } from "@features/social/dossier";
import { admissionPackage, FORM_GROUPS, FormGroup, formsFor, SocialForm } from "@features/social/forms/catalog";
import { fetchFormTemplate, fillForm, fillPackage, formFileName } from "@features/social/forms/fillForm";
import { FormStatus, formStatus, missingFor } from "@features/social/forms/status";
import { downloadBlob } from "@features/social/lib/wordTemplate";
import SocialDocumentDialog from "./SocialDocumentDialog";
import SocialNoteDialog from "./SocialNoteDialog";
import DocxPreviewDialog from "./DocxPreview";

interface Props {
  patientId: string;
  patientName: string;
  canWrite: boolean;
  /** Korisnik je na smeštaju (rokovi važe samo tada) */
  active: boolean;
}

const BADGE: Record<FormStatus["tone"], "success" | "warning" | "light" | "info"> = { success: "success", warning: "warning", light: "light", info: "info" };

function StatusBadge({ status }: { status: FormStatus }) {
  if (!status.label) return null;
  if (status.tone === "success") {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium text-success-700 dark:text-success-400">
        <LuCircleCheck className="h-3.5 w-3.5" /> {status.label}
      </span>
    );
  }
  return (
    <Badge size="sm" color={BADGE[status.tone]}>
      {status.label}
    </Badge>
  );
}

// Dokumentacija korisnika: obrasci doma redom kao u postupku smeštaja. Za svaki se vidi stvarno stanje —
// šta je iz kartona spremno, šta socijalni radnik treba da napiše ili upiše — i sledeći korak.
export default function SocialFormsPanel({ patientId, patientName, canWrite, active }: Props) {
  const profile = useSocialProfile(patientId);
  const docs = useSocialDocuments(patientId);
  const { data: deadlines = [] } = useSocialDeadlines(active);
  const merge = useQuery({ queryKey: ["socialMergeData", patientId, docs.dataUpdatedAt, profile.dataUpdatedAt], queryFn: () => fetchMergeData(patientId) });
  const [busy, setBusy] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ form: SocialForm; file: Blob; missing: string[] } | null>(null);
  const [editing, setEditing] = useState<{ form: SocialForm; doc: SocialDocument | null } | null>(null);
  const [noting, setNoting] = useState(false);

  const applicant = profile.data?.profile?.applicant?.kind ?? "";
  const discharged = !!profile.data?.patient?.dischargeDate;
  const forms = formsFor(applicant);
  const next = deadlines.find((d) => d.patient._id === patientId);
  // Poslednji dokument svake vrste (zaključen ima prednost), kao i za popunu obrasca
  const latestByType = useMemo(() => {
    const map = new Map<string, SocialDocument>();
    for (const d of [...(docs.data ?? [])].sort((a, b) => Number(b.status === "final") - Number(a.status === "final") || b.date.localeCompare(a.date))) {
      if (!map.has(d.type)) map.set(d.type, d);
    }
    return map;
  }, [docs.data]);
  const legacyDocs = (docs.data ?? []).filter((d) => DOC_TYPES[d.type].legacy);
  const statusOf = (form: SocialForm) => formStatus(form, { data: merge.data, applicant, doc: form.docType ? (latestByType.get(form.docType) ?? null) : null, discharged });
  const profileLink = `${paths.patient(patientId)}?tab=social&social=profile`;

  const fill = async (form: SocialForm) => {
    setBusy(form.id);
    try {
      const [template, data] = await Promise.all([fetchFormTemplate(form), fetchMergeData(patientId, form.title)]);
      setPreview({ form, file: await fillForm(form, template, data), missing: missingFor(form, data) });
    } catch (err) {
      notify.error(err, "Obrazac nije napravljen.");
    } finally {
      setBusy(null);
    }
  };

  const downloadPackage = async () => {
    setBusy("package");
    try {
      const list = admissionPackage(applicant);
      const data = await fetchMergeData(patientId, "Paket za prijem");
      downloadBlob(await fillPackage(list, data, patientName), `Paket za prijem - ${patientName}.zip`.replace(/[\\/:*?"<>|]+/g, " "));
      const incomplete = list.filter((f) => formStatus(f, { data, applicant, doc: f.docType ? (latestByType.get(f.docType) ?? null) : null, discharged }).tone === "warning");
      if (incomplete.length) notify.info(`Preuzeto ${list.length} obrazaca. Nedovršeno (prazne linije za ručni upis): ${incomplete.map((f) => f.number).join(", ")}.`);
      else notify.success(`Preuzeto ${list.length} obrazaca za prijem.`);
    } catch (err) {
      notify.error(err, "Paket nije napravljen.");
    } finally {
      setBusy(null);
    }
  };

  if (profile.isError || docs.isError) {
    return (
      <Card>
        <div className="p-5">
          <ErrorState message="Dokumentacija nije učitana." onRetry={() => void Promise.all([profile.refetch(), docs.refetch()])} />
        </div>
      </Card>
    );
  }

  const allStatuses = forms.map(statusOf);
  const ready = allStatuses.filter((s) => s.tone === "success").length;
  const todo = allStatuses.filter((s) => !s.inactive).length;

  return (
    <Card>
      <CardHeader
        icon={<LuFileText />}
        title="Dokumentacija korisnika"
        description={merge.data ? `Spremno ${ready} od ${todo} obrazaca — ostalo traži podatke iz kartona ili tekst socijalnog radnika` : "Obrasci doma popunjeni podacima iz kartona"}
        actions={
          <Button size="xs" variant="outline" startIcon={<LuFileArchive className="h-3.5 w-3.5" />} loading={busy === "package"} disabled={!!busy && busy !== "package"} onClick={() => void downloadPackage()}>
            Paket za prijem (.zip)
          </Button>
        }
      />
      {next && (
        <div
          className={`flex flex-wrap items-center gap-2 border-b px-5 py-2.5 text-sm sm:px-6 ${
            deadlineState(next.due).tone === "error"
              ? "border-error-100 bg-error-50 text-error-800 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-300"
              : "border-gray-100 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300"
          }`}
        >
          <span className="font-medium">Sledeće: {DEADLINE_LABEL[next.kind]}</span>
          <span>
            rok {formatDay(next.due)} ({next.basis})
          </span>
          <Badge size="sm" color={deadlineState(next.due).tone}>
            {deadlineState(next.due).label}
          </Badge>
        </div>
      )}
      {!applicant && (
        <p className="border-b border-gray-100 px-5 py-2.5 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400 sm:px-6">
          U kartonu izaberite ko podnosi zahtev — tada se prikazuju samo obrasci za korisnika ili samo za srodnika/staratelja.{" "}
          <Link to={profileLink} className="font-medium text-brand-600 hover:underline dark:text-brand-400">
            Otvori karton
          </Link>
        </p>
      )}
      {profile.isLoading || docs.isLoading ? (
        <div className="space-y-2 p-5">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      ) : (
        (Object.keys(FORM_GROUPS) as FormGroup[]).map((group) => (
          <section key={group} className="border-b border-gray-100 last:border-b-0 dark:border-gray-800">
            <header className="flex items-baseline justify-between gap-2 bg-gray-50/70 px-5 py-2 dark:bg-white/[0.02] sm:px-6">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">{FORM_GROUPS[group].label}</h4>
              <span className="text-xs text-gray-400">{FORM_GROUPS[group].hint}</span>
            </header>
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {forms
                .filter((f) => f.group === group)
                .map((form) => {
                  const doc = form.docType ? (latestByType.get(form.docType) ?? null) : null;
                  const status = statusOf(form);
                  return (
                    <li key={form.id} className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 px-5 py-2.5 sm:px-6 ${status.inactive ? "opacity-60" : ""}`}>
                      <span className="w-14 shrink-0 text-xs font-semibold tabular-nums text-gray-400">{form.number}</span>
                      <div className="min-w-0 flex-1 basis-56">
                        <p className="text-sm font-medium text-gray-900 dark:text-white/90">
                          {form.title}
                          {form.script === "latin" && <span className="ml-2 text-xs font-normal text-gray-400">latinica</span>}
                        </p>
                        {status.missing.length > 0 ? (
                          <p className="flex items-start gap-1 text-xs text-warning-700 dark:text-warning-400">
                            <LuCircleAlert className="mt-0.5 h-3 w-3 shrink-0" /> Nedostaje: {status.missing.join(", ")}
                          </p>
                        ) : (
                          form.byHand && !status.inactive && <p className="text-xs text-gray-400">Posle štampe: {form.byHand}</p>
                        )}
                      </div>
                      <StatusBadge status={status} />
                      <span className="flex flex-wrap gap-1.5">
                        {form.source === "document" && (canWrite || doc) && (
                          <Button
                            size="xs"
                            variant={status.next === "write" ? "primary" : "outline"}
                            startIcon={doc ? <LuPencilLine className="h-3.5 w-3.5" /> : <LuPlus className="h-3.5 w-3.5" />}
                            onClick={() => setEditing({ form, doc })}
                          >
                            {doc ? (doc.status === "final" ? "Otvori" : "Nastavi") : "Napiši"}
                          </Button>
                        )}
                        {form.source === "document" && doc?.status === "final" && canWrite && (
                          <Button size="xs" variant="ghost" startIcon={<LuPlus className="h-3.5 w-3.5" />} onClick={() => setEditing({ form, doc: null })} aria-label={`Novi: ${form.title}`}>
                            Novi
                          </Button>
                        )}
                        {form.source === "activities" && canWrite && (
                          <Button size="xs" variant={status.next === "activity" && !(merge.data?.lists.beleske?.length ?? 0) ? "primary" : "outline"} startIcon={<LuNotebookPen className="h-3.5 w-3.5" />} onClick={() => setNoting(true)}>
                            Upiši aktivnost
                          </Button>
                        )}
                        {status.next === "profile" && canWrite && form.source === "data" && (
                          <Link to={profileLink} className="inline-flex h-7 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-white/5">
                            <LuUserPen className="h-3.5 w-3.5" /> Dopuni karton
                          </Link>
                        )}
                        <Button
                          size="xs"
                          variant={status.tone === "success" ? "outline" : "ghost"}
                          startIcon={<LuFileText className="h-3.5 w-3.5" />}
                          loading={busy === form.id}
                          disabled={!!busy && busy !== form.id}
                          onClick={() => void fill(form)}
                          aria-label={`Popuni obrazac: ${form.title}`}
                        >
                          Word
                        </Button>
                      </span>
                    </li>
                  );
                })}
            </ul>
          </section>
        ))
      )}
      {legacyDocs.length > 0 && (
        <section className="border-t border-gray-100 px-5 py-3 dark:border-gray-800 sm:px-6">
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Raniji dokumenti</h4>
          <ul className="space-y-1">
            {legacyDocs.map((d) => (
              <li key={d._id}>
                <button
                  type="button"
                  onClick={() => setEditing({ form: { id: "", number: "", title: DOC_TYPES[d.type].label, group: "professional", script: "cyrillic", source: "document", requires: [], docType: d.type }, doc: d })}
                  className="text-sm text-brand-600 hover:underline dark:text-brand-400"
                >
                  {DOC_TYPES[d.type].label} · {formatDay(d.date)}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {editing?.form.docType && (
        <SocialDocumentDialog
          open
          onClose={() => setEditing(null)}
          patientId={patientId}
          patientName={patientName}
          type={editing.doc?.type ?? editing.form.docType}
          document={editing.doc}
          canWrite={canWrite}
          admissionDate={profile.data?.patient?.admissionDate}
        />
      )}
      {canWrite && (
        <SocialNoteDialog
          open={noting}
          onClose={() => {
            setNoting(false);
            // Nova aktivnost odmah menja stanje lista praćenja
            void merge.refetch();
          }}
          patientId={patientId}
        />
      )}
      <DocxPreviewDialog
        open={!!preview}
        onClose={() => setPreview(null)}
        title={preview ? `${preview.form.number}. ${preview.form.title} — ${patientName}` : ""}
        description={
          preview?.missing.length
            ? `Nedostaje (ostaje prazna linija za ručni upis): ${preview.missing.join(", ")}. Dopunite u kartonu pa ponovo popunite.`
            : "Pregledajte obrazac pre preuzimanja ili štampe."
        }
        file={preview?.file ?? null}
        fileName={preview ? formFileName(preview.form, patientName) : "obrazac.docx"}
      />
    </Card>
  );
}
