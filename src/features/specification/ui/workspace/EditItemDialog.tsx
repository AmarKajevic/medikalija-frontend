import { FormEvent, useEffect, useId, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Dialog from "@shared/ui/dialog/Dialog";
import Button from "@shared/ui/button/Button";
import Field from "@shared/ui/form/Field";
import { Input } from "@shared/ui/form/controls";
import { notify } from "@shared/lib/notify";
import { formatQty, formatRSD } from "@shared/lib/format";
import { updateSpecificationItem } from "@features/specification/api/specificationApi";
import { refreshAfterSpecChange } from "@features/specification/lib/queries";
import { hasEditablePrice } from "@features/specification/lib/items";
import { SpecificationItem } from "@features/specification/types/types";

const toNumber = (v: string) => Number(v.replace(",", "."));
const round2 = (n: number) => Math.round(n * 100) / 100;

const stockHint = (item: SpecificationItem) => {
  if (item.category === "medicine" || item.category === "articles")
    return (item.entries?.length ?? 0) > 0 ? "Više — razlika se skida sa stanja doma. Manje — razlika se vraća na stanje." : "Starija stavka: stanje na lageru se ne menja.";
  if (item.category === "combination") return "Koliko puta je urađena ova kombinacija analiza.";
  return undefined;
};

// Izmena količine stavke (i cene po komadu za negu i dodatne troškove)
export default function EditItemDialog({ specId, patientId, item, onClose }: { specId: string; patientId: string; item: SpecificationItem | null; onClose: () => void }) {
  const ids = { amount: useId(), price: useId() };
  const qc = useQueryClient();
  const [amount, setAmount] = useState("");
  const [unitPrice, setUnitPrice] = useState("");

  const currentAmount = item?.amount ?? 1;
  const currentUnit = item ? round2(currentAmount > 0 ? (item.price ?? 0) / currentAmount : (item.price ?? 0)) : 0;
  useEffect(() => {
    if (!item) return;
    setAmount(String(currentAmount).replace(".", ","));
    setUnitPrice(String(currentUnit).replace(".", ","));
  }, [item, currentAmount, currentUnit]);

  const save = useMutation({
    mutationFn: (payload: { amount: number; unitPrice?: number }) => updateSpecificationItem(specId, item!._id, payload),
    onSuccess: (spec) => {
      refreshAfterSpecChange(qc, patientId, spec);
      notify.success("Stavka je izmenjena.");
      onClose();
    },
    onError: (e) => notify.error(e, "Stavka nije izmenjena."),
  });

  if (!item) return null;
  const priced = hasEditablePrice(item);
  const qty = toNumber(amount);
  const unit = priced ? toNumber(unitPrice) : currentUnit;
  const wholeOnly = item.category === "combination";
  const qtyError = !(qty > 0) ? "Količina mora biti veća od 0 (za uklanjanje obrišite stavku)." : wholeOnly && !Number.isInteger(qty) ? "Unesite ceo broj." : undefined;
  const priceError = priced && !(unit >= 0) ? "Neispravna cena." : undefined;
  const unchanged = qty === currentAmount && (!priced || unit === currentUnit);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (qtyError || priceError || unchanged) return;
    save.mutate(priced ? { amount: qty, unitPrice: unit } : { amount: qty });
  };

  return (
    <Dialog
      open={!!item}
      onClose={onClose}
      title={`Izmena: ${item.name}`}
      description={`Sada: ${formatQty(currentAmount)} × ${formatRSD(currentUnit)} = ${formatRSD(item.price)}`}
      size="sm"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Otkaži
          </Button>
          <Button size="sm" type="submit" form="edit-spec-item" loading={save.isPending} disabled={!!qtyError || !!priceError || unchanged}>
            Sačuvaj
          </Button>
        </>
      }
    >
      <form id="edit-spec-item" onSubmit={onSubmit} className="space-y-4">
        <div className={`grid gap-3 ${priced ? "grid-cols-2" : ""}`}>
          <Field label="Količina" htmlFor={ids.amount} error={amount ? qtyError : undefined} hint={stockHint(item)}>
            <Input id={ids.amount} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
          </Field>
          {priced && (
            <Field label="Cena po komadu" htmlFor={ids.price} error={priceError}>
              <Input id={ids.price} inputMode="decimal" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} trailing="RSD" />
            </Field>
          )}
        </div>
        {!qtyError && !priceError && (
          <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm tabular-nums text-gray-700 dark:bg-white/[0.03] dark:text-gray-300">
            Novo: {formatQty(qty)} × {formatRSD(unit)} = <strong>{formatRSD(round2(qty * unit))}</strong>
          </p>
        )}
      </form>
    </Dialog>
  );
}
