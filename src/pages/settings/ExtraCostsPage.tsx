import { FormEvent, useEffect, useId, useState } from "react";
import { LuArchiveRestore, LuReceipt, LuEllipsis, LuEyeOff, LuPencil, LuPlus, LuTrash2 } from "react-icons/lu";
import PageHeader from "@shared/ui/page/PageHeader";
import DataTable, { Column } from "@shared/ui/data-table/DataTable";
import Button from "@shared/ui/button/Button";
import Badge from "@shared/ui/badge/Badge";
import Dialog, { ConfirmDialog } from "@shared/ui/dialog/Dialog";
import ActionMenu from "@shared/ui/menu/ActionMenu";
import Field from "@shared/ui/form/Field";
import { Input } from "@shared/ui/form/controls";
import { ErrorState } from "@shared/ui/feedback/EmptyState";
import { notify } from "@shared/lib/notify";
import { formatRSD } from "@shared/lib/format";
import {
  ExtraCost,
  useDeleteExtraCost,
  useExtraCosts,
  useSaveExtraCost,
} from "@features/extra-costs/model";

type DialogState = { type: "edit"; cost: ExtraCost | null } | { type: "delete"; cost: ExtraCost } | null;

// Cenovnik drugih troškova: uprava ih bira u specifikaciji (Drugi trošak), ili trošak unosi ručno.
export default function ExtraCostsPage() {
  const { data = [], isLoading, isError, refetch } = useExtraCosts({ all: true });
  const save = useSaveExtraCost();
  const remove = useDeleteExtraCost();
  const [dialog, setDialog] = useState<DialogState>(null);

  const setActive = (s: ExtraCost, active: boolean) =>
    save.mutate(
      { id: s._id, active },
      { onSuccess: () => notify.success(active ? "Trošak se ponovo nudi." : "Trošak se više ne nudi u specifikaciji."), onError: (e) => notify.error(e) }
    );

  const columns: Column<ExtraCost>[] = [
    {
      id: "name",
      header: "Naziv",
      sortValue: (s) => s.name,
      cell: (s) => <span className={`font-medium ${s.active ? "text-gray-900 dark:text-white" : "text-gray-400 line-through"}`}>{s.name}</span>,
    },
    { id: "price", header: "Cena", align: "right", sortValue: (s) => s.priceRSD, cell: (s) => <span className="font-medium tabular-nums">{formatRSD(s.priceRSD)}</span> },
    {
      id: "status",
      header: "Status",
      hideBelow: "sm",
      sortValue: (s) => (s.active ? 0 : 1),
      cell: (s) => (s.active ? <Badge size="sm" color="success">U ponudi</Badge> : <Badge size="sm" color="light">Sakriven</Badge>),
    },
    {
      id: "actions",
      header: <span className="sr-only">Akcije</span>,
      align: "right",
      cell: (s) => (
        <div onClick={(e) => e.stopPropagation()} className="flex justify-end">
          <ActionMenu
            trigger={({ toggle }) => (
              <button
                type="button"
                onClick={toggle}
                aria-label={`Akcije za ${s.name}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5"
              >
                <LuEllipsis className="h-4 w-4" />
              </button>
            )}
            items={[
              { label: "Izmeni", icon: <LuPencil />, onClick: () => setDialog({ type: "edit", cost: s }) },
              s.active
                ? { label: "Sakrij iz specifikacije", icon: <LuEyeOff />, onClick: () => setActive(s, false) }
                : { label: "Vrati u ponudu", icon: <LuArchiveRestore />, onClick: () => setActive(s, true) },
              { label: "Obriši", icon: <LuTrash2 />, danger: true, separated: true, onClick: () => setDialog({ type: "delete", cost: s }) },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Drugi troškovi"
        description="Troškovi sa cenom koje uprava bira u specifikaciji (npr. frizer, prevoz, pedikir). U specifikaciji se trošak može uneti i ručno."
        actions={
          <Button startIcon={<LuPlus className="h-4 w-4" />} onClick={() => setDialog({ type: "edit", cost: null })}>
            Novi trošak
          </Button>
        }
      />
      {isError ? (
        <ErrorState message="Troškovi nisu učitani." onRetry={() => refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={data}
          loading={isLoading}
          getRowId={(s) => s._id}
          onRowClick={(s) => setDialog({ type: "edit", cost: s })}
          searchText={(s) => `${s.name} ${s.priceRSD}`}
          searchPlaceholder="Pretraži troškove..."
          empty={{
            icon: <LuReceipt />,
            title: "Još nema drugih troškova",
            description: "Dodajte troškove sa cenom, npr. „Frizer” = 800 RSD.",
            action: (
              <Button variant="outline" startIcon={<LuPlus className="h-4 w-4" />} onClick={() => setDialog({ type: "edit", cost: null })}>
                Dodaj trošak
              </Button>
            ),
          }}
        />
      )}

      <CostDialog open={dialog?.type === "edit"} cost={dialog?.type === "edit" ? dialog.cost : null} onClose={() => setDialog(null)} />

      <ConfirmDialog
        open={dialog?.type === "delete"}
        onClose={() => setDialog(null)}
        title="Obrisati trošak?"
        description="Već napravljene specifikacije zadržavaju naziv i cenu. Ako trošak samo privremeno ne nudite, sakrijte je umesto brisanja."
        confirmText="Obriši"
        loading={remove.isPending}
        onConfirm={() =>
          dialog?.type === "delete" &&
          remove.mutate(dialog.cost._id, {
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

const toNumber = (v: string) => Number(v.replace(",", "."));

function CostDialog({ open, cost, onClose }: { open: boolean; cost: ExtraCost | null; onClose: () => void }) {
  const formId = useId();
  const ids = { name: useId(), price: useId() };
  const save = useSaveExtraCost();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(cost?.name ?? "");
    setAmount(cost ? String(cost.priceRSD).replace(".", ",") : "");
  }, [open, cost]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return notify.error("Unesite naziv troška.");
    const priceRSD = toNumber(amount);
    if (!amount.trim() || !(priceRSD >= 0)) return notify.error("Unesite cenu u dinarima.");
    save.mutate(
      { id: cost?._id, name: name.trim(), priceRSD, ...(cost ? {} : { active: true }) },
      {
        onSuccess: () => {
          notify.success(cost ? "Trošak je izmenjen." : "Trošak je dodat.");
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
      title={cost ? "Izmena troška" : "Novi trošak"}
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
        <Field label="Naziv" htmlFor={ids.name} hint="Kako se prikazuje u specifikaciji i na štampi.">
          <Input id={ids.name} value={name} onChange={(e) => setName(e.target.value)} placeholder="npr. Frizer" autoFocus />
        </Field>
        <Field label="Cena" htmlFor={ids.price}>
          <Input id={ids.price} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" trailing="RSD" />
        </Field>
      </form>
    </Dialog>
  );
}
