import { FormEvent, useEffect, useId, useState } from "react";
import { LuMessageSquareText, LuPencil } from "react-icons/lu";
import Button from "@shared/ui/button/Button";
import Dialog from "@shared/ui/dialog/Dialog";
import Field from "@shared/ui/form/Field";
import { Textarea } from "@shared/ui/form/controls";
import { notify } from "@shared/lib/notify";
import { useSaveSpecificationNote } from "@features/specification/hooks/useSaveSpecificationNote";
import { Specification } from "@features/specification/types/types";

const MAX = 2000;

// Sačuvana napomena (prikaz ispod stavki, kao na štampi)
export function SpecNoteText({ specification: spec }: { specification: Specification }) {
  const note = spec.note?.trim() ?? "";
  if (!note) return null;
  return (
    <div className="mt-4 rounded-lg bg-gray-50 px-3 py-2 dark:bg-white/[0.03]">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Napomena</p>
      <p className="mt-1 whitespace-pre-line text-sm text-gray-800 dark:text-gray-200">{note}</p>
    </div>
  );
}

// Dugme "Napomena" (pored Zabeleški): unosi se u prozoru i štampa se na dnu PDF-a, ispod tabela
export default function SpecNoteButton({ specification: spec, patientId, readOnly = false }: { specification: Specification; patientId: string; readOnly?: boolean }) {
  const formId = useId();
  const fieldId = useId();
  const save = useSaveSpecificationNote(spec._id, patientId);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const note = spec.note?.trim() ?? "";

  useEffect(() => {
    if (open) setText(spec.note ?? "");
  }, [open, spec.note]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate(text.trim(), {
      onSuccess: (res) => {
        notify.success(res.message);
        setOpen(false);
      },
      onError: (err) => notify.error(err),
    });
  };

  if (readOnly) return null;

  return (
    <>
      <Button
        variant="outline"
        startIcon={note ? <LuPencil className="h-4 w-4" /> : <LuMessageSquareText className="h-4 w-4" />}
        onClick={() => setOpen(true)}
        title="Napomena se štampa ispod tabela specifikacije"
      >
        {note ? "Izmeni napomenu" : "Napomena"}
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        size="md"
        title="Napomena"
        description="Napomena se štampa na dnu specifikacije, ispod tabela."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Otkaži
            </Button>
            <Button size="sm" type="submit" form={formId} loading={save.isPending}>
              Sačuvaj
            </Button>
          </>
        }
      >
        <form id={formId} onSubmit={onSubmit}>
          <Field label="Unesi napomenu" htmlFor={fieldId} hint={`${text.length}/${MAX} · prazno polje uklanja napomenu`}>
            <Textarea id={fieldId} rows={5} maxLength={MAX} value={text} onChange={(e) => setText(e.target.value)} autoFocus placeholder="npr. Uplatu izvršiti do 10. u mesecu." />
          </Field>
        </form>
      </Dialog>
    </>
  );
}
