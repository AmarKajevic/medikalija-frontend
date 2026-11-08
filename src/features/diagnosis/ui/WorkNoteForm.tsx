import { FormEvent, useId, useState } from "react";
import Field from "@shared/ui/form/Field";
import { Textarea } from "@shared/ui/form/controls";
import Button from "@shared/ui/button/Button";
import SearchSelect from "@shared/ui/combobox/SearchSelect";
import { notify } from "@shared/lib/notify";
import { useAddDiagnosis } from "@entities/diagnosis/hooks/useDiagnosis";
import { useDiagnosisTemplates } from "@features/diagnosis/hooks/useDiagnosisTemplates";

// Unos dijagnoze / učinka rada. Sestre biraju šablon dijagnoze (pravi ga uprava),
// dopune tekst (npr. vrednost pritiska) i sačuvaju.
export default function WorkNoteForm({ patientId }: { patientId: string }) {
  const ids = { text: useId(), template: useId() };
  const [text, setText] = useState("");
  const [picked, setPicked] = useState("");
  const add = useAddDiagnosis(patientId);
  const { data: templates = [], isLoading } = useDiagnosisTemplates();

  const insertTemplate = (templateId: string) => {
    const t = templates.find((x) => x._id === templateId);
    if (!t) return;
    const body = t.description || t.name;
    setText((prev) => (prev.trim() ? `${prev}\n${body}` : body));
    setPicked("");
  };

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
      <Field label="Šablon dijagnoze" htmlFor={ids.template} hint={templates.length ? "Izaberite šablon pa dopunite tekst (npr. vrednosti)." : undefined}>
        <SearchSelect
          id={ids.template}
          value={picked}
          onChange={insertTemplate}
          loading={isLoading}
          options={templates.map((t) => ({ value: t._id, label: t.name, description: t.description }))}
          placeholder={isLoading || templates.length ? "Pretraži šablone..." : "Uprava još nije napravila šablone."}
          disabled={!isLoading && templates.length === 0}
        />
      </Field>
      <Field label="Dijagnoza / učinak rada" htmlFor={ids.text}>
        <Textarea id={ids.text} value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder="Npr. izmeren pritisak 130/85, data terapija..." />
      </Field>
      <Button type="submit" className="w-full" loading={add.isPending} disabled={!text.trim()}>
        Sačuvaj unos
      </Button>
    </form>
  );
}
