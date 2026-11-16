import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LuCircleAlert, LuCircleCheck, LuFileArchive, LuFileText, LuPencilLine, LuPlus } from "react-icons/lu";
import { Card, CardHeader } from "@shared/ui/card/Card";
import Button from "@shared/ui/button/Button";
import Badge from "@shared/ui/badge/Badge";
import { Skeleton } from "@shared/ui/feedback/Spinner";
import { ErrorState } from "@shared/ui/feedback/EmptyState";
import { notify } from "@shared/lib/notify";
import { formatDay } from "@shared/lib/calendarDay";
import { DEADLINE_LABEL, deadlineState, DOC_TYPES, fetchMergeData, SocialDocument, useSocialDeadlines, useSocialDocuments, useSocialProfile } from "@features/social/dossier";
import { admissionPackage, FORM_GROUPS, FormGroup, formsFor, SocialForm } from "@features/social/forms/catalog";
import { fetchFormTemplate, fillForm, fillPackage, formFileName, missingFor } from "@features/social/forms/fillForm";
import { downloadBlob } from "@features/social/lib/wordTemplate";
import SocialDocumentDialog from "./SocialDocumentDialog";
import DocxPreviewDialog from "./DocxPreview";

interface Props {
  patientId: string;
  patientName: string;
  canWrite: boolean;
  /** Korisnik je na smeštaju (rokovi važe samo tada) */
  active: boolean;
}

// Dokumentacija korisnika: obrasci doma redom kao u postupku smeštaja. Obrazac se popunjava jednim
// klikom iz kartona i stručnih dokumenata (ćirilica/latinica kao u originalu); stručni dokumenti
// (procene, plan) se pišu ovde, a ceo paket za prijem preuzima se odjednom.
export default function SocialFormsPanel({ patientId, patientName, canWrite, active }: Props) {
  const profile = useSocialProfile(patientId);
  const docs = useSocialDocuments(patientId);
  const { data: deadlines = [] } = useSocialDeadlines(active);
  const merge = useQuery({ queryKey: ["socialMergeData", patientId, docs.dataUpdatedAt, profile.dataUpdatedAt], queryFn: () => fetchMergeData(patientId) });
  const [busy, setBusy] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ form: SocialForm; file: Blob; missing: string[] } | null>(null);
  const [editing, setEditing] = useState<{ form: SocialForm; doc: SocialDocument | null } | null>(null);

  const applicant = profile.data?.profile?.applicant?.kind ?? "";
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
      notify.success(`Preuzeto ${list.length} obrazaca za prijem.`);
    } catch (err) {
      notify.error(err, "Paket nije napravljen.");
    } finally {
      setBusy(null);
    }
  };

  const status = (form: SocialForm) => {
    if (form.docType) {
      const doc = latestByType.get(form.docType);
      if (!doc) return <Badge size="sm" color="light">nije urađeno</Badge>;
      return doc.status === "final" ? (
        <Badge size="sm" color="success">zaključeno {formatDay(doc.date)}</Badge>
      ) : (
        <Badge size="sm" color="warning">nacrt {formatDay(doc.date)}</Badge>
      );
    }
    const missing = missingFor(form, merge.data);
    if (!merge.data) return null;
    return missing.length === 0 ? (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-success-700 dark:text-success-400">
        <LuCircleCheck className="h-3.5 w-3.5" /> spremno
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-xs text-warning-700 dark:text-warning-400" title={`Nije uneto: ${missing.join(", ")}`}>
        <LuCircleAlert className="h-3.5 w-3.5" /> nedostaje {missing.length === 1 ? missing[0] : `${missing.length} podatka`}
      </span>
    );
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

  return (
    <Card>
      <CardHeader
        icon={<LuFileText />}
        title="Dokumentacija korisnika"
        description="Obrasci doma popunjeni podacima iz kartona — ćirilica i latinica kao u originalu"
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
          U podacima korisnika izaberite ko podnosi zahtev — tada se prikazuju samo obrasci za korisnika ili samo za srodnika/staratelja.
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
                  return (
                    <li key={form.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-5 py-2.5 sm:px-6">
                      <span className="w-14 shrink-0 text-xs font-semibold tabular-nums text-gray-400">{form.number}</span>
                      <span className="min-w-0 flex-1 text-sm font-medium text-gray-900 dark:text-white/90">
                        {form.title}
                        {form.script === "latin" && <span className="ml-2 text-xs font-normal text-gray-400">latinica</span>}
                      </span>
                      <span className="flex items-center gap-2">{status(form)}</span>
                      <span className="flex gap-1.5">
                        {form.docType && (canWrite || doc) && (
                          <Button
                            size="xs"
                            variant="outline"
                            startIcon={doc ? <LuPencilLine className="h-3.5 w-3.5" /> : <LuPlus className="h-3.5 w-3.5" />}
                            onClick={() => setEditing({ form, doc })}
                          >
                            {doc ? (doc.status === "final" ? "Otvori" : "Nastavi") : "Napiši"}
                          </Button>
                        )}
                        {form.docType && doc?.status === "final" && canWrite && (
                          <Button size="xs" variant="ghost" startIcon={<LuPlus className="h-3.5 w-3.5" />} onClick={() => setEditing({ form, doc: null })} aria-label={`Novi: ${form.title}`}>
                            Novi
                          </Button>
                        )}
                        <Button
                          size="xs"
                          variant={form.docType ? "ghost" : "outline"}
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
                <button type="button" onClick={() => setEditing({ form: { id: "", number: "", title: DOC_TYPES[d.type].label, group: "professional", script: "cyrillic", requires: [], docType: d.type }, doc: d })} className="text-sm text-brand-600 hover:underline dark:text-brand-400">
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
      <DocxPreviewDialog
        open={!!preview}
        onClose={() => setPreview(null)}
        title={preview ? `${preview.form.number}. ${preview.form.title} — ${patientName}` : ""}
        description={
          preview?.missing.length
            ? `Nisu uneti (ostaje prazna linija za ručni upis): ${preview.missing.join(", ")}. Dopunite u podacima korisnika pa ponovo popunite.`
            : "Pregledajte obrazac pre preuzimanja ili štampe."
        }
        file={preview?.file ?? null}
        fileName={preview ? formFileName(preview.form, patientName) : "obrazac.docx"}
      />
    </Card>
  );
}
