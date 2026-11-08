import { FormEvent, useEffect, useId, useState } from "react";
import { LuArchiveRestore, LuBedDouble, LuEllipsis, LuEyeOff, LuPencil, LuPlus, LuTrash2 } from "react-icons/lu";
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
import { formatEUR } from "@shared/lib/format";
import { LodgingPrice, useDeleteLodgingPrice, useLodgingPrices, useSaveLodgingPrice } from "@features/lodging/model";

type DialogState = { type: "edit"; price: LodgingPrice | null } | { type: "delete"; price: LodgingPrice } | null;

// Cenovnik smeštaja: u obračunu specifikacije uprava bira jednu od ovih cena za
// smeštaj za naredni period i za vanstandardni period smeštaja.
export default function LodgingPricesPage() {
  const { data = [], isLoading, isError, refetch } = useLodgingPrices({ all: true });
  const save = useSaveLodgingPrice();
  const remove = useDeleteLodgingPrice();
  const [dialog, setDialog] = useState<DialogState>(null);

  const setActive = (p: LodgingPrice, active: boolean) =>
    save.mutate(
      { id: p._id, active },
      { onSuccess: () => notify.success(active ? "Cena se ponovo nudi." : "Cena se više ne nudi u obračunu."), onError: (e) => notify.error(e) }
    );

  const columns: Column<LodgingPrice>[] = [
    {
      id: "name",
      header: "Naziv",
      sortValue: (p) => p.name,
      cell: (p) => <span className={`font-medium ${p.active ? "text-gray-900 dark:text-white" : "text-gray-400 line-through"}`}>{p.name}</span>,
    },
    { id: "days", header: "Dana", align: "right", sortValue: (p) => p.days ?? 0, cell: (p) => <span className="tabular-nums">{p.days ?? "—"}</span> },
    { id: "price", header: "Cena", align: "right", sortValue: (p) => p.priceEUR, cell: (p) => <span className="font-medium tabular-nums">{formatEUR(p.priceEUR)}</span> },
    {
      id: "status",
      header: "Status",
      hideBelow: "sm",
      sortValue: (p) => (p.active ? 0 : 1),
      cell: (p) => (p.active ? <Badge size="sm" color="success">U ponudi</Badge> : <Badge size="sm" color="light">Sakrivena</Badge>),
    },
    {
      id: "actions",
      header: <span className="sr-only">Akcije</span>,
      align: "right",
      cell: (p) => (
        <div onClick={(e) => e.stopPropagation()} className="flex justify-end">
          <ActionMenu
            trigger={({ toggle }) => (
              <button
                type="button"
                onClick={toggle}
                aria-label={`Akcije za ${p.name}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5"
              >
                <LuEllipsis className="h-4 w-4" />
              </button>
            )}
            items={[
              { label: "Izmeni", icon: <LuPencil />, onClick: () => setDialog({ type: "edit", price: p }) },
              p.active
                ? { label: "Sakrij iz obračuna", icon: <LuEyeOff />, onClick: () => setActive(p, false) }
                : { label: "Vrati u ponudu", icon: <LuArchiveRestore />, onClick: () => setActive(p, true) },
              { label: "Obriši", icon: <LuTrash2 />, danger: true, separated: true, onClick: () => setDialog({ type: "delete", price: p }) },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Cene smeštaja"
        description="Cene koje se biraju u obračunu specifikacije za smeštaj za naredni period i vanstandardni period smeštaja."
        actions={
          <Button startIcon={<LuPlus className="h-4 w-4" />} onClick={() => setDialog({ type: "edit", price: null })}>
            Nova cena
          </Button>
        }
      />
      {isError ? (
        <ErrorState message="Cene nisu učitane." onRetry={() => refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={data}
          loading={isLoading}
          getRowId={(p) => p._id}
          onRowClick={(p) => setDialog({ type: "edit", price: p })}
          searchText={(p) => `${p.name} ${p.days ?? ""} ${p.priceEUR}`}
          searchPlaceholder="Pretraži cene..."
          empty={{
            icon: <LuBedDouble />,
            title: "Još nema cena smeštaja",
            description: "Dodajte cene, npr. „10 dana” = 200 €, „30 dana” = 900 €.",
            action: (
              <Button variant="outline" startIcon={<LuPlus className="h-4 w-4" />} onClick={() => setDialog({ type: "edit", price: null })}>
                Dodaj cenu
              </Button>
            ),
          }}
        />
      )}

      <PriceDialog open={dialog?.type === "edit"} price={dialog?.type === "edit" ? dialog.price : null} onClose={() => setDialog(null)} />

      <ConfirmDialog
        open={dialog?.type === "delete"}
        onClose={() => setDialog(null)}
        title="Obrisati cenu?"
        description="Već sačuvani obračuni zadržavaju svoj iznos. Ako cenu samo privremeno ne nudite, sakrijte je umesto brisanja."
        confirmText="Obriši"
        loading={remove.isPending}
        onConfirm={() =>
          dialog?.type === "delete" &&
          remove.mutate(dialog.price._id, {
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

function PriceDialog({ open, price, onClose }: { open: boolean; price: LodgingPrice | null; onClose: () => void }) {
  const formId = useId();
  const ids = { name: useId(), days: useId(), price: useId() };
  const save = useSaveLodgingPrice();
  const [name, setName] = useState("");
  const [days, setDays] = useState("");
  const [amount, setAmount] = useState("");
  const [nameTouched, setNameTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(price?.name ?? "");
    setDays(price?.days != null ? String(price.days) : "");
    setAmount(price ? String(price.priceEUR).replace(".", ",") : "");
    setNameTouched(!!price);
  }, [open, price]);

  // Naziv se sam predlaže iz broja dana ("10 dana"), dok ga korisnik ne promeni
  const onDays = (v: string) => {
    setDays(v);
    if (!nameTouched) setName(v.trim() ? `${v.trim()} dana` : "");
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return notify.error("Unesite naziv (npr. „30 dana”).");
    const priceEUR = toNumber(amount);
    if (!amount.trim() || !(priceEUR >= 0)) return notify.error("Unesite cenu u evrima.");
    const d = days.trim() ? Number(days) : null;
    if (d !== null && !(Number.isInteger(d) && d >= 0)) return notify.error("Broj dana mora biti ceo broj.");
    save.mutate(
      { id: price?._id, name: name.trim(), days: d, priceEUR, ...(price ? {} : { active: true }) },
      {
        onSuccess: () => {
          notify.success(price ? "Cena je izmenjena." : "Cena je dodata.");
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
      title={price ? "Izmena cene smeštaja" : "Nova cena smeštaja"}
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
        <div className="grid grid-cols-2 gap-3">
          <Field label="Broj dana" htmlFor={ids.days} hint="nije obavezno">
            <Input id={ids.days} inputMode="numeric" value={days} onChange={(e) => onDays(e.target.value)} placeholder="npr. 10" autoFocus />
          </Field>
          <Field label="Cena" htmlFor={ids.price}>
            <Input id={ids.price} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" trailing="EUR" />
          </Field>
        </div>
        <Field label="Naziv" htmlFor={ids.name} hint="Kako se prikazuje u obračunu i na štampi.">
          <Input
            id={ids.name}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setNameTouched(true);
            }}
            placeholder="npr. 10 dana"
          />
        </Field>
      </form>
    </Dialog>
  );
}
