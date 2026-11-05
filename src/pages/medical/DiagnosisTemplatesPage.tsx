import { useId, useState } from "react";
import { LuClipboardList, LuPlus } from "react-icons/lu";
import PageHeader from "@shared/ui/page/PageHeader";
import DataTable, { Column } from "@shared/ui/data-table/DataTable";
import Button from "@shared/ui/button/Button";
import Dialog from "@shared/ui/dialog/Dialog";
import Field from "@shared/ui/form/Field";
import { Input, Textarea } from "@shared/ui/form/controls";
import { ErrorState } from "@shared/ui/feedback/EmptyState";
import { notify } from "@shared/lib/notify";
import { DiagnosisTemplate, useAddDiagnosisTemplate, useDiagnosisTemplates } from "@features/diagnosis/hooks/useDiagnosisTemplates";

function TemplateDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const formId = useId();
  const add = useAddDiagnosisTemplate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const close = () => {
    setName("");
    setDescription("");
    onClose();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return notify.error("Unesite naziv i tekst šablona.");
    add.mutate(
      { name: name.trim(), description: description.trim() },
      { onSuccess: () => { notify.success("Šablon je dodat."); close(); }, onError: (err) => notify.error(err) }
    );
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      size="md"
      title="Novi šablon"
      description="Šabloni se nude sestrama pri unosu učinka rada, da se isti tekst ne kuca ponovo."
      footer={
        <>
          <Button variant="outline" size="sm" onClick={close}>Otkaži</Button>
          <Button size="sm" type="submit" form={formId} loading={add.isPending}>Dodaj šablon</Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Naziv" htmlFor={`${formId}-n`} hint="Kratko, prikazuje se na dugmetu.">
          <Input id={`${formId}-n`} autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="npr. Merenje pritiska" />
        </Field>
        <Field label="Tekst" htmlFor={`${formId}-d`}>
          <Textarea id={`${formId}-d`} value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="npr. Izmeren krvni pritisak: ___/___ mmHg" />
        </Field>
      </form>
    </Dialog>
  );
}

export default function DiagnosisTemplatesPage() {
  const { data = [], isLoading, isError, refetch } = useDiagnosisTemplates();
  const [open, setOpen] = useState(false);

  const columns: Column<DiagnosisTemplate>[] = [
    { id: "name", header: "Naziv", sortValue: (t) => t.name, cell: (t) => <span className="font-medium text-gray-900 dark:text-white">{t.name}</span> },
    { id: "text", header: "Tekst", cell: (t) => <span className="line-clamp-2 text-gray-600 dark:text-gray-400">{t.description}</span> },
  ];

  return (
    <>
      <PageHeader
        title="Šabloni dijagnoza"
        description="Gotovi tekstovi za unos učinka rada i dijagnoza na profilu pacijenta."
        actions={
          <Button size="sm" startIcon={<LuPlus className="h-4 w-4" />} onClick={() => setOpen(true)}>
            Novi šablon
          </Button>
        }
      />
      {isError ? (
        <ErrorState message="Šabloni nisu učitani." onRetry={() => refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={data}
          loading={isLoading}
          getRowId={(t) => t._id}
          searchText={(t) => `${t.name} ${t.description}`}
          searchPlaceholder="Pretraži šablone..."
          initialSort={{ id: "name", dir: "asc" }}
          empty={{ icon: <LuClipboardList />, title: "Još nema šablona", action: <Button size="sm" onClick={() => setOpen(true)}>Novi šablon</Button> }}
        />
      )}
      <TemplateDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
