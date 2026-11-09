import { FormEvent, useEffect, useId, useState } from "react";
import { LuArchiveRestore, LuBedDouble, LuCheck, LuEllipsis, LuEyeOff, LuNotebookPen, LuPencil, LuPlus, LuTrash2, LuX } from "react-icons/lu";
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
import { Card, CardBody, CardHeader } from "@shared/ui/card/Card";
import EmptyState from "@shared/ui/feedback/EmptyState";
import {
  LodgingNote,
  LodgingPrice,
  useDeleteLodgingNote,
  useDeleteLodgingPrice,
  useLodgingNotes,
  useLodgingPrices,
  useSaveLodgingNote,
  useSaveLodgingPrice,
} from "@features/lodging/model";

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

      <LodgingNotesSection />

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

// Napomene za vanstandardni period: u obračunu se bira jedna i štampa se u istom redu sa smeštajem
function LodgingNotesSection() {
  const { data: notes = [], isLoading, isError, refetch } = useLodgingNotes();
  const save = useSaveLodgingNote();
  const remove = useDeleteLodgingNote();
  const newId = useId();
  const [text, setText] = useState("");
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
  const [deleting, setDeleting] = useState<LodgingNote | null>(null);

  const add = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return notify.error("Upišite tekst napomene.");
    save.mutate(
      { text: text.trim() },
      {
        onSuccess: () => {
          notify.success("Napomena je dodata.");
          setText("");
        },
        onError: (err) => notify.error(err),
      }
    );
  };
  const saveEdit = () => {
    if (!editing || !editing.text.trim()) return notify.error("Upišite tekst napomene.");
    save.mutate({ id: editing.id, text: editing.text.trim() }, { onSuccess: () => setEditing(null), onError: (err) => notify.error(err) });
  };

  return (
    <Card className="mt-6">
      <CardHeader
        icon={<LuNotebookPen />}
        title="Napomene za vanstandardni period"
        description="U obračunu specifikacije bira se jedna napomena uz vanstandardni smeštaj; štampa se u istom redu kao smeštaj za period."
      />
      <CardBody className="space-y-4">
        <form onSubmit={add} className="flex flex-wrap items-end gap-2">
          <div className="min-w-64 flex-1">
            <label htmlFor={newId} className="sr-only">
              Nova napomena
            </label>
            <Input id={newId} value={text} onChange={(e) => setText(e.target.value)} placeholder="npr. Smeštaj od dana prijema do početka perioda" maxLength={300} />
          </div>
          <Button type="submit" size="sm" startIcon={<LuPlus className="h-4 w-4" />} loading={save.isPending && !editing}>
            Dodaj napomenu
          </Button>
        </form>

        {isError ? (
          <ErrorState message="Napomene nisu učitane." onRetry={() => refetch()} />
        ) : isLoading ? null : notes.length === 0 ? (
          <EmptyState compact icon={<LuNotebookPen />} title="Još nema napomena" description="Dodajte tekst koji se često piše uz vanstandardni smeštaj." />
        ) : (
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
            {notes.map((n) => (
              <li key={n._id} className="flex items-center gap-2 px-4 py-2.5">
                {editing?.id === n._id ? (
                  <>
                    <Input
                      aria-label="Izmena napomene"
                      value={editing.text}
                      onChange={(e) => setEditing({ id: n._id, text: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                      maxLength={300}
                      autoFocus
                    />
                    <Button size="xs" startIcon={<LuCheck className="h-3.5 w-3.5" />} loading={save.isPending} onClick={saveEdit}>
                      Sačuvaj
                    </Button>
                    <button type="button" onClick={() => setEditing(null)} aria-label="Otkaži izmenu" className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5">
                      <LuX className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="min-w-0 flex-1 text-sm text-gray-800 dark:text-white/90">{n.text}</span>
                    <button type="button" onClick={() => setEditing({ id: n._id, text: n.text })} aria-label={`Izmeni napomenu ${n.text}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5">
                      <LuPencil className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => setDeleting(n)} aria-label={`Obriši napomenu ${n.text}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/10">
                      <LuTrash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardBody>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Obrisati napomenu?"
        description="Već sačuvani obračuni zadržavaju tekst napomene."
        confirmText="Obriši"
        loading={remove.isPending}
        onConfirm={() =>
          deleting &&
          remove.mutate(deleting._id, {
            onSuccess: (res) => {
              notify.success(res.message);
              setDeleting(null);
            },
            onError: (err) => notify.error(err),
          })
        }
      />
    </Card>
  );
}
