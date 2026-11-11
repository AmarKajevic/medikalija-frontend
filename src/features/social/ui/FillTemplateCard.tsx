import { useState } from "react";
import { Link } from "react-router";
import { LuEye, LuFileText } from "react-icons/lu";
import { Card, CardHeader } from "@shared/ui/card/Card";
import Button from "@shared/ui/button/Button";
import { Skeleton } from "@shared/ui/feedback/Spinner";
import { notify } from "@shared/lib/notify";
import { paths } from "@app/paths";
import { DocumentTemplate, fetchMergeData, fetchTemplateFile, useMergeFields, useTemplates } from "@features/social/dossier";
import { checkTemplate, filledFileName, fillTemplate } from "@features/social/lib/wordTemplate";
import DocxPreviewDialog from "./DocxPreview";

interface Preview {
  title: string;
  fileName: string;
  file: Blob;
  empty: string[];
}

// Word dokumenti za korisnika: šablon ustanove popunjen podacima iz dosijea — prvo pregled, pa preuzimanje ili štampa.
export default function FillTemplateCard({ patientId, patientName }: { patientId: string; patientName: string }) {
  const { data: templates = [], isLoading } = useTemplates();
  const catalog = useMergeFields();
  const [busy, setBusy] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);

  const fill = async (t: DocumentTemplate) => {
    setBusy(t._id);
    try {
      const [file, data] = await Promise.all([fetchTemplateFile(t._id), fetchMergeData(patientId, t.name)]);
      const blob = await fillTemplate(file, data);
      // Koja polja iz šablona su ostala prazna (podatak još nije unet u dosije)
      let empty: string[] = [];
      if (catalog.data) {
        const { known } = await checkTemplate(file, catalog.data);
        const labels = new Map(catalog.data.fields.map((f) => [f.key, f.label]));
        empty = known.filter((k) => labels.has(k) && !data.fields[k]?.trim()).map((k) => labels.get(k)!.toLowerCase());
      }
      setPreview({ title: t.name, fileName: filledFileName(t.name, patientName), file: blob, empty });
    } catch (err) {
      notify.error(err, "Dokument nije napravljen.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card>
      <CardHeader icon={<LuFileText />} title="Dokumenti iz šablona" description="Word dokument popunjen podacima ovog korisnika" />
      {isLoading ? (
        <div className="p-5">
          <Skeleton className="h-16" />
        </div>
      ) : templates.length === 0 ? (
        <p className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400 sm:px-6">
          Još nema šablona.{" "}
          <Link to={`${paths.social}?view=templates`} className="font-medium text-brand-600 hover:underline dark:text-brand-400">
            Postavite Word šablon
          </Link>{" "}
          i ovde ćete ga popuniti jednim klikom.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {templates.map((t) => (
            <li key={t._id} className="flex items-center gap-3 px-5 py-2.5 sm:px-6">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white/90">{t.name}</p>
                {t.description && <p className="truncate text-xs text-gray-500 dark:text-gray-400">{t.description}</p>}
              </div>
              <Button size="xs" variant="outline" startIcon={<LuEye className="h-3.5 w-3.5" />} loading={busy === t._id} disabled={!!busy && busy !== t._id} onClick={() => void fill(t)}>
                Popuni i pregledaj
              </Button>
            </li>
          ))}
        </ul>
      )}
      <DocxPreviewDialog
        open={!!preview}
        onClose={() => setPreview(null)}
        title={preview ? `${preview.title} — ${patientName}` : ""}
        description={
          preview?.empty.length
            ? `Prazna polja (dopunite u podacima korisnika pa ponovo popunite): ${preview.empty.join(", ")}.`
            : "Pregledajte dokument pre preuzimanja ili štampe."
        }
        file={preview?.file ?? null}
        fileName={preview?.fileName ?? "dokument.docx"}
      />
    </Card>
  );
}
