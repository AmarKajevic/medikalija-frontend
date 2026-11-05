import { FormEvent, useId, useState } from "react";
import Field from "@shared/ui/form/Field";
import { Textarea } from "@shared/ui/form/controls";
import Button from "@shared/ui/button/Button";
import { notify } from "@shared/lib/notify";
import { useAddDiagnosis } from "@entities/diagnosis/hooks/useDiagnosis";
import { useDiagnosisTemplates } from "@features/diagnosis/hooks/useDiagnosisTemplates";

// Unos učinka rada / dijagnoze, sa brzim umetanjem iz šablona.
export default function WorkNoteForm({ patientId }: { patientId: string }) {
  const id = useId();
  const [text, setText] = useState("");
  const add = useAddDiagnosis(patientId);
  const { data: templates = [] } = useDiagnosisTemplates();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const description = text.trim();
    if (!description) return notify.error("Unesite tekst.");
    add.mutate(
      { description },
      {
        onSuccess: () => {
          notify.success("Unos je sačuvan.");
          setText("");
        },
        onError: (err) => notify.error(err),
      }
    );
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {templates.length > 0 && (
        <div>
          <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Šabloni</p>
          <div className="flex flex-wrap gap-1.5">
            {templates.slice(0, 12).map((t) => (
              <button
                key={t._id}
                type="button"
                title={t.description}
                onClick={() => setText((prev) => (prev ? `${prev}\n${t.description || t.name}` : t.description || t.name))}
                className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:border-gray-700 dark:text-gray-300 dark:hover:border-brand-500/50 dark:hover:bg-brand-500/10"
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <Field label="Učinak rada / dijagnoza" htmlFor={id}>
        <Textarea id={id} value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder="Npr. izmeren pritisak 130/85, data terapija..." />
      </Field>
      <Button type="submit" className="w-full" loading={add.isPending} disabled={!text.trim()}>
        Sačuvaj unos
      </Button>
    </form>
  );
}
