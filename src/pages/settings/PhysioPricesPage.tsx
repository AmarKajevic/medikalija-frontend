import { FormEvent, useEffect, useId, useState } from "react";
import {
  LuActivity,
  LuCheck,
  LuPencil,
  LuPlus,
  LuTrash2,
} from "react-icons/lu";
import PageHeader from "@shared/ui/page/PageHeader";
import { Card } from "@shared/ui/card/Card";
import { Input } from "@shared/ui/form/controls";
import Field from "@shared/ui/form/Field";
import Button from "@shared/ui/button/Button";
import Dialog, { ConfirmDialog } from "@shared/ui/dialog/Dialog";
import { Skeleton } from "@shared/ui/feedback/Spinner";
import { ErrorState } from "@shared/ui/feedback/EmptyState";
import { notify } from "@shared/lib/notify";
import { formatRSD } from "@shared/lib/format";
import {
  PhysioPrice,
  physioName,
  useCreatePhysioKind,
  useDeletePhysioKind,
  usePhysioPrices,
  useSavePhysioPrice,
} from "@features/physio/model";

const toNumber = (v: string) => Number(v.replace(",", "."));

type DialogState =
  | { type: "edit"; price: PhysioPrice | null }
  | { type: "delete"; price: PhysioPrice }
  | null;

// Cene vanredne fizikalne terapije. Admin ih unosi unapred; kad uprava odobri vanrednu terapiju
// (ili je doda u specifikaciju), cena se uzima odavde. Pored tri osnovne vrste admin dodaje nove.
export default function PhysioPricesPage() {
  const { data = [], isLoading, isError, refetch } = usePhysioPrices();
  const remove = useDeletePhysioKind();
  const [dialog, setDialog] = useState<DialogState>(null);

  return (
    <>
      <PageHeader
        title="Cene fizioterapije"
        description="Cena vanredne fizikalne terapije za svaku vrstu. Redovna terapija se ne naplaćuje. Pri odobravanju vanredne terapije i dodavanju u specifikaciju cena se uzima odavde."
        actions={
          <Button
            size="sm"
            startIcon={<LuPlus className="h-4 w-4" />}
            onClick={() => setDialog({ type: "edit", price: null })}
          >
            Nova fizikalna terapija
          </Button>
        }
      />
      {isError ? (
        <ErrorState message="Cene nisu učitane." onRetry={() => refetch()} />
      ) : (
        <Card>
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {isLoading
              ? [0, 1, 2].map((i) => (
                  <li key={i} className="p-5">
                    <Skeleton className="h-10" />
                  </li>
                ))
              : data.map((p, i) => (
                  <PriceRow
                    key={p.kind}
                    price={p}
                    index={i + 1}
                    onRename={() => setDialog({ type: "edit", price: p })}
                    onDelete={() => setDialog({ type: "delete", price: p })}
                  />
                ))}
          </ul>
        </Card>
      )}

      <KindDialog
        open={dialog?.type === "edit"}
        price={dialog?.type === "edit" ? dialog.price : null}
        onClose={() => setDialog(null)}
      />

      <ConfirmDialog
        open={dialog?.type === "delete"}
        onClose={() => setDialog(null)}
        title={`Obrisati „${dialog?.type === "delete" ? physioName(dialog.price) : ""}”?`}
        description="Terapija se više neće nuditi. Već napravljene specifikacije zadržavaju naziv i cenu."
        confirmText="Obriši"
        loading={remove.isPending}
        onConfirm={() =>
          dialog?.type === "delete" &&
          remove.mutate(dialog.price.kind, {
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

function PriceRow({
  price,
  index,
  onRename,
  onDelete,
}: {
  price: PhysioPrice;
  index: number;
  onRename: () => void;
  onDelete: () => void;
}) {
  const save = useSavePhysioPrice();
  const [value, setValue] = useState("");
  useEffect(
    () =>
      setValue(
        price.priceRSD != null ? String(price.priceRSD).replace(".", ",") : "",
      ),
    [price.priceRSD],
  );
  const id = `physio-price-${price.kind}`;
  const label = physioName(price);
  const n = toNumber(value);
  const invalid = !value.trim() || !(n >= 0);
  const unchanged = price.priceRSD != null && n === price.priceRSD;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (invalid) return notify.error("Unesite cenu (0 ili više).");
    save.mutate(
      { kind: price.kind, priceRSD: n },
      {
        onSuccess: () => notify.success(`${label}: ${formatRSD(n)}`),
        onError: (err) => notify.error(err),
      },
    );
  };

  return (
    <li>
      <form
        onSubmit={onSubmit}
        className="flex flex-wrap items-center gap-3 p-5"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
          <LuActivity className="h-4 w-4" />
        </span>
        <label htmlFor={id} className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-gray-900 dark:text-white/90">
            {index}. {label}
          </span>
          <span className="block text-xs text-gray-500 dark:text-gray-400">
            {price.priceRSD != null
              ? `Trenutno: ${formatRSD(price.priceRSD)} (vanredna)`
              : "Cena još nije uneta — vanredna terapija ne može da se odobri."}
          </span>
        </label>
        <div className="w-40">
          <Input
            id={id}
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0,00"
            trailing="RSD"
          />
        </div>
        <Button
          type="submit"
          size="sm"
          variant={unchanged ? "outline" : "primary"}
          loading={save.isPending}
          disabled={invalid || unchanged}
          startIcon={<LuCheck className="h-4 w-4" />}
        >
          Sačuvaj
        </Button>
        {/* Izmena naziva i cene u prozoru; brisanje uz potvrdu */}
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onRename}
            aria-label={`Izmeni ${label}`}
            title="Izmeni naziv i cenu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5"
          >
            <LuPencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Obriši ${label}`}
            title="Obriši terapiju"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/10"
          >
            <LuTrash2 className="h-4 w-4" />
          </button>
        </div>
      </form>
    </li>
  );
}

// Nova vrsta terapije (naziv + cena) ili izmena postojeće
function KindDialog({
  open,
  price,
  onClose,
}: {
  open: boolean;
  price: PhysioPrice | null;
  onClose: () => void;
}) {
  const formId = useId();
  const ids = { name: useId(), price: useId() };
  const create = useCreatePhysioKind();
  const save = useSavePhysioPrice();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(price ? physioName(price) : "");
    setAmount(
      price?.priceRSD != null ? String(price.priceRSD).replace(".", ",") : "",
    );
  }, [open, price]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return notify.error("Unesite naziv terapije.");
    const priceRSD = toNumber(amount);
    if (!amount.trim() || !(priceRSD >= 0))
      return notify.error("Unesite cenu u dinarima.");
    const done = {
      onSuccess: () => {
        notify.success(
          price ? "Terapija je izmenjena." : "Terapija je dodata.",
        );
        onClose();
      },
      onError: (err: unknown) => notify.error(err),
    };
    if (price)
      save.mutate({ kind: price.kind, name: name.trim(), priceRSD }, done);
    else create.mutate({ name: name.trim(), priceRSD }, done);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={price ? "Izmena fizikalne terapije" : "Nova fizikalna terapija"}
      description={
        price
          ? undefined
          : "Nova vrsta se nudi fizioterapeutu pri unosu i upravi u specifikaciji, kao i osnovne."
      }
      size="sm"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Otkaži
          </Button>
          <Button
            size="sm"
            type="submit"
            form={formId}
            loading={create.isPending || save.isPending}
          >
            Sačuvaj
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={onSubmit} className="space-y-4">
        <Field
          label="Naziv"
          htmlFor={ids.name}
          hint="Kako se prikazuje u unosu, specifikaciji i na štampi."
        >
          <Input
            id={ids.name}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="npr. Limfna drenaža"
            autoFocus
          />
        </Field>
        <Field label="Cena (vanredna)" htmlFor={ids.price}>
          <Input
            id={ids.price}
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
            trailing="RSD"
          />
        </Field>
      </form>
    </Dialog>
  );
}
