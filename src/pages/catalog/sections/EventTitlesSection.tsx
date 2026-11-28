import { FormEvent, useEffect, useId, useState } from "react";
import { LuCalendarDays, LuEllipsis, LuPencil, LuPlus, LuTrash2 } from "react-icons/lu";
import SectionHeader from "@shared/ui/page/SectionHeader";
import DataTable, { Column } from "@shared/ui/data-table/DataTable";
import Button from "@shared/ui/button/Button";
import Dialog, { ConfirmDialog } from "@shared/ui/dialog/Dialog";
import ActionMenu from "@shared/ui/menu/ActionMenu";
import Field from "@shared/ui/form/Field";
import { Input } from "@shared/ui/form/controls";
import { ErrorState } from "@shared/ui/feedback/EmptyState";
import { notify } from "@shared/lib/notify";
import { EVENT_COLORS, eventColorClass } from "@features/calendar/colors";
import { EventTitle, useDeleteEventTitle, useEventTitles, useSaveEventTitle } from "@features/calendar/model";

type DialogState = { type: "edit"; title: EventTitle | null } | { type: "delete"; title: EventTitle } | null;

const colorLabel = (key: string | null) => EVENT_COLORS.find((c) => c.value === key)?.label;

// Nazivi događaja u kalendaru: admin pravi listu, osoblje pri zakazivanju bira naziv iz padajućeg menija.
export default function EventTitlesSection() {
  const { data = [], isLoading, isError, refetch } = useEventTitles();
  const remove = useDeleteEventTitle();
  const [dialog, setDialog] = useState<DialogState>(null);
  const openNew = () => setDialog({ type: "edit", title: null });

  const columns: Column<EventTitle>[] = [
    { id: "name", header: "Naziv događaja", sortValue: (t) => t.name, cell: (t) => <span className="font-medium text-gray-900 dark:text-white">{t.name}</span> },
    {
      id: "color",
      header: "Vrsta",
      hideBelow: "sm",
      cell: (t) =>
        t.calendar ? (
          <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <span className={`h-2.5 w-2.5 rounded-full ${eventColorClass(t.calendar)}`} />
            {colorLabel(t.calendar)}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
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
              { label: "Izmeni", icon: <LuPencil />, onClick: () => setDialog({ type: "edit", title: t }) },
              { label: "Obriši", icon: <LuTrash2 />, danger: true, separated: true, onClick: () => setDialog({ type: "delete", title: t }) },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <SectionHeader
        title="Nazivi događaja"
        description="Osoblje pri zakazivanju u kalendaru bira naziv iz ove liste, pa se isti događaj uvek zove isto. Uz naziv može da stoji i vrsta (boja) događaja."
        actions={
          <Button size="sm" startIcon={<LuPlus className="h-4 w-4" />} onClick={openNew}>
            Novi naziv
          </Button>
        }
      />
      {isError ? (
        <ErrorState message="Nazivi nisu učitani." onRetry={() => refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={data}
          loading={isLoading}
          getRowId={(t) => t._id}
          onRowClick={(t) => setDialog({ type: "edit", title: t })}
          searchText={(t) => t.name}
          searchPlaceholder="Pretraži nazive..."
          empty={{
            icon: <LuCalendarDays />,
            title: "Još nema naziva događaja",
            description: "Dodajte nazive, npr. „Pregled kardiologa” ili „Poseta porodice”. Dok je lista prazna, naziv se kuca ručno.",
            action: (
              <Button variant="outline" startIcon={<LuPlus className="h-4 w-4" />} onClick={openNew}>
                Dodaj naziv
              </Button>
            ),
          }}
        />
      )}

      <TitleDialog open={dialog?.type === "edit"} title={dialog?.type === "edit" ? dialog.title : null} onClose={() => setDialog(null)} />

      <ConfirmDialog
        open={dialog?.type === "delete"}
        onClose={() => setDialog(null)}
        title="Obrisati naziv?"
        description="Već zakazani događaji zadržavaju svoj naziv; naziv se samo više ne nudi u padajućem meniju."
        confirmText="Obriši"
        loading={remove.isPending}
        onConfirm={() =>
          dialog?.type === "delete" &&
          remove.mutate(dialog.title._id, {
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

function TitleDialog({ open, title, onClose }: { open: boolean; title: EventTitle | null; onClose: () => void }) {
  const formId = useId();
  const nameId = useId();
  const save = useSaveEventTitle();
  const [name, setName] = useState("");
  const [calendar, setCalendar] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(title?.name ?? "");
    setCalendar(title?.calendar ?? null);
  }, [open, title]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return notify.error("Unesite naziv događaja.");
    save.mutate(
      { id: title?._id, name: name.trim(), calendar },
      {
        onSuccess: () => {
          notify.success(title ? "Naziv je izmenjen." : "Naziv je dodat.");
          onClose();
        },
        onError: (err) => notify.error(err),
      }
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title ? "Izmena naziva" : "Novi naziv događaja"}
      size="sm"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Otkaži
          </Button>
          <Button size="sm" type="submit" form={formId} loading={save.isPending}>
            Sačuvaj
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={onSubmit} className="space-y-4">
        <Field label="Naziv" htmlFor={nameId}>
          <Input id={nameId} value={name} onChange={(e) => setName(e.target.value)} placeholder="npr. Pregled kardiologa" maxLength={160} autoFocus />
        </Field>
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Vrsta (nije obavezno)</legend>
          <div className="grid grid-cols-2 gap-2">
            {[{ value: null, label: "Bez vrste", className: "bg-gray-300" }, ...EVENT_COLORS].map((c) => (
              <label
                key={c.value ?? "none"}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                  calendar === c.value ? "border-brand-500 bg-brand-50 text-gray-900 dark:bg-brand-500/10 dark:text-white" : "border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
                }`}
              >
                <input type="radio" name={`${formId}-color`} className="sr-only" checked={calendar === c.value} onChange={() => setCalendar(c.value)} />
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${c.className}`} />
                {c.label}
              </label>
            ))}
          </div>
        </fieldset>
      </form>
    </Dialog>
  );
}
