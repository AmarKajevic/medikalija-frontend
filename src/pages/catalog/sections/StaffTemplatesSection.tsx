import { FormEvent, useEffect, useId, useState } from "react";
import { LuClipboardList, LuEllipsis, LuPencil, LuPlus, LuTrash2 } from "react-icons/lu";
import SectionHeader from "@shared/ui/page/SectionHeader";
import DataTable, { Column } from "@shared/ui/data-table/DataTable";
import Button from "@shared/ui/button/Button";
import Dialog, { ConfirmDialog } from "@shared/ui/dialog/Dialog";
import ActionMenu from "@shared/ui/menu/ActionMenu";
import Field from "@shared/ui/form/Field";
import { Input, Textarea } from "@shared/ui/form/controls";
import { ErrorState } from "@shared/ui/feedback/EmptyState";
import { notify } from "@shared/lib/notify";
import {
  DiagnosisTemplate,
  useAddDiagnosisTemplate,
  useDeleteDiagnosisTemplate,
  useDiagnosisTemplates,
  useUpdateDiagnosisTemplate,
} from "@features/diagnosis/hooks/useDiagnosisTemplates";

type DialogState = { type: "edit"; template: DiagnosisTemplate | null } | { type: "delete"; template: DiagnosisTemplate } | null;

// Šabloni nege: gotovi tekstovi koje sestre biraju pri unosu učinka rada
// i dijagnoza na profilu pacijenta, da se isti tekst ne kuca ponovo.
export default function StaffTemplatesSection() {
  const { data = [], isLoading, isError, refetch } = useDiagnosisTemplates();
  const remove = useDeleteDiagnosisTemplate();
  const [dialog, setDialog] = useState<DialogState>(null);
  const openNew = () => setDialog({ type: "edit", template: null });

  const columns: Column<DiagnosisTemplate>[] = [
    { id: "name", header: "Naziv", sortValue: (t) => t.name, cell: (t) => <span className="font-medium text-gray-900 dark:text-white">{t.name}</span> },
    { id: "text", header: "Tekst", hideBelow: "sm", cell: (t) => <span className="line-clamp-2 whitespace-pre-line text-gray-600 dark:text-gray-400">{t.description}</span> },
    {
      id: "actions",
      header: <span className="sr-only">Akcije</span>,
      align: "right",
      cell: (t) => (
        <div onClick={(e) => e.stopPropagation()} className="flex justify-end">
          <ActionMenu
            trigger={({ toggle }) => (
              <button
                type="button"
                onClick={toggle}
                aria-label={`Akcije za ${t.name}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5"
              >
                <LuEllipsis className="h-4 w-4" />
              </button>
            )}
            items={[
              { label: "Izmeni", icon: <LuPencil />, onClick: () => setDialog({ type: "edit", template: t }) },
              { label: "Obriši", icon: <LuTrash2 />, danger: true, separated: true, onClick: () => setDialog({ type: "delete", template: t }) },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <SectionHeader
        title="Šabloni nege"
        description="Gotovi tekstovi koje sestre biraju pri unosu učinka rada i dijagnoza na profilu pacijenta."
        actions={
          <Button size="sm" startIcon={<LuPlus className="h-4 w-4" />} onClick={openNew}>
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
          onRowClick={(t) => setDialog({ type: "edit", template: t })}
          searchText={(t) => `${t.name} ${t.description}`}
          searchPlaceholder="Pretraži šablone..."
          initialSort={{ id: "name", dir: "asc" }}
          empty={{
            icon: <LuClipboardList />,
            title: "Još nema šablona",
            description: "Dodajte tekst koji sestre često upisuju, npr. „Izmeren krvni pritisak: ___/___ mmHg”.",
            action: (
              <Button variant="outline" size="sm" startIcon={<LuPlus className="h-4 w-4" />} onClick={openNew}>
                Novi šablon
              </Button>
            ),
          }}
        />
      )}

      <TemplateDialog open={dialog?.type === "edit"} template={dialog?.type === "edit" ? dialog.template : null} onClose={() => setDialog(null)} />

      <ConfirmDialog
        open={dialog?.type === "delete"}
        onClose={() => setDialog(null)}
        title={`Obrisati šablon „${dialog?.type === "delete" ? dialog.template.name : ""}”?`}
        description="Šablon se više neće nuditi. Već upisan učinak rada ostaje nepromenjen."
        confirmText="Obriši"
        loading={remove.isPending}
        onConfirm={() =>
          dialog?.type === "delete" &&
          remove.mutate(dialog.template._id, {
            onSuccess: (res) => {
              notify.success(res.message);
              setDialog(null);
            },
            onError: (err) => notify.error(err),
          })
        }
      />
    </>
  );
}

function TemplateDialog({ open, template, onClose }: { open: boolean; template: DiagnosisTemplate | null; onClose: () => void }) {
  const formId = useId();
  const ids = { name: useId(), text: useId() };
  const add = useAddDiagnosisTemplate();
  const update = useUpdateDiagnosisTemplate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(template?.name ?? "");
    setDescription(template?.description ?? "");
  }, [open, template]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return notify.error("Unesite naziv i tekst šablona.");
    const payload = { name: name.trim(), description: description.trim() };
    const done = {
      onSuccess: () => {
        notify.success(template ? "Šablon je izmenjen." : "Šablon je dodat.");
        onClose();
      },
      onError: (err: unknown) => notify.error(err),
    };
    if (template) update.mutate({ id: template._id, ...payload }, done);
    else add.mutate(payload, done);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="md"
      title={template ? "Izmena šablona" : "Novi šablon"}
      description="Šabloni se nude sestrama pri unosu učinka rada, da se isti tekst ne kuca ponovo."
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Otkaži
          </Button>
          <Button size="sm" type="submit" form={formId} loading={add.isPending || update.isPending}>
            Sačuvaj
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Naziv" htmlFor={ids.name} hint="Kratko, prikazuje se na dugmetu.">
          <Input id={ids.name} autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="npr. Merenje pritiska" />
        </Field>
        <Field label="Tekst" htmlFor={ids.text}>
          <Textarea id={ids.text} value={description} onChange={(e) => setDescription(e.target.value)} rows={5} placeholder="npr. Izmeren krvni pritisak: ___/___ mmHg" />
        </Field>
      </form>
    </Dialog>
  );
}
