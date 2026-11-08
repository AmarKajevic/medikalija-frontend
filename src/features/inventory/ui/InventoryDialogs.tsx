import { useEffect, useId, useState } from "react";
import { LuInfo } from "react-icons/lu";
import Dialog from "@shared/ui/dialog/Dialog";
import Button from "@shared/ui/button/Button";
import Field from "@shared/ui/form/Field";
import { Input } from "@shared/ui/form/controls";
import { notify } from "@shared/lib/notify";
import { formatQty, formatRSD } from "@shared/lib/format";
import { normalizeSearch } from "@shared/lib/search";
import { InventoryConfig, InventoryItem, useCreateItem, useInventoryList, useUpdateItem, MEDICINE_FORM_LABEL, type MedicineForm } from "@features/inventory/model";

const num = (v: string) => Number(v.replace(",", ".")) || 0;

interface ItemDialogProps {
  cfg: InventoryConfig;
  open: boolean;
  onClose: () => void;
  /** Ako je zadat, dijalog menja postojeću stavku */
  item?: InventoryItem | null;
  /** Novi lek: unapred izabrana vrsta (dugme "Tablete" ili "Ampule") */
  defaultForm?: MedicineForm;
}

// Nova stavka u šifarniku ili izmena postojeće (naziv, cena, pakovanje, ispravka stanja)
export function ItemDialog({ cfg, open, onClose, item, defaultForm = "oral" }: ItemDialogProps) {
  const formId = useId();
  const editing = !!item;
  const { data: all = [] } = useInventoryList(cfg);
  const create = useCreateItem(cfg);
  const update = useUpdateItem(cfg);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [upp, setUpp] = useState("");
  const [packages, setPackages] = useState("");
  const [units, setUnits] = useState("");
  const [correction, setCorrection] = useState("");
  const [form, setForm] = useState<MedicineForm>("oral");
  const isMedicine = cfg.kind === "medicine";

  useEffect(() => {
    if (!open) return;
    setForm(item?.form ?? defaultForm);
    setName(item?.name ?? "");
    setPrice(item ? String(item.price) : "");
    setUpp(item?.unitsPerPackage ? String(item.unitsPerPackage) : "");
    setPackages("");
    setUnits("");
    setCorrection("");
  }, [open, item, defaultForm]);

  const duplicate = all.find((i) => i._id !== item?._id && normalizeSearch(i.name) === normalizeSearch(name.trim()));
  const initialTotal = num(packages) * num(upp) + num(units);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return notify.error("Unesite naziv.");
    if (duplicate) return notify.error(`${cfg.singularCap} „${duplicate.name}“ već postoji.`);
    if (price === "" || num(price) < 0) return notify.error("Unesite cenu.");

    if (editing) {
      const body: Record<string, unknown> = { name: name.trim(), [cfg.priceField]: num(price), unitsPerPackage: num(upp), ...(isMedicine ? { form } : {}) };
      if (correction !== "") body.quantity = num(correction);
      update.mutate(
        { id: item!._id, ...body },
        {
          onSuccess: () => {
            notify.success("Izmene su sačuvane.");
            onClose();
          },
          onError: (err) => notify.error(err),
        }
      );
    } else {
      if (initialTotal <= 0) return notify.error("Unesite početno stanje (pakovanja ili komade).");
      create.mutate(
        { name: name.trim(), price: num(price), unitsPerPackage: num(upp), packages: num(packages), units: num(units), ...(isMedicine ? { form } : {}) },
        {
          onSuccess: () => {
            notify.success(`${cfg.singularCap} „${name.trim()}“ je dodat.`);
            onClose();
          },
          onError: (err) => notify.error(err),
        }
      );
    }
  };

  const id = (k: string) => `${formId}-${k}`;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="md"
      title={editing ? `Izmena: ${item?.name}` : isMedicine ? `Novi lek — ${MEDICINE_FORM_LABEL[form].toLowerCase()}` : `Novi ${cfg.singular}`}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Otkaži
          </Button>
          <Button size="sm" type="submit" form={formId} loading={create.isPending || update.isPending}>
            {editing ? "Sačuvaj izmene" : `Dodaj ${cfg.singular}`}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Naziv" htmlFor={id("name")} error={duplicate ? `Već postoji „${duplicate.name}“ — za dopunu stanja koristite „Dopuni“.` : undefined}>
          <Input id={id("name")} autoFocus value={name} onChange={(e) => setName(e.target.value)} invalid={!!duplicate} />
        </Field>
        {isMedicine && (
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Vrsta leka</legend>
            <div role="radiogroup" className="grid grid-cols-2 gap-2">
              {(Object.keys(MEDICINE_FORM_LABEL) as MedicineForm[]).map((f) => (
                <label
                  key={f}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                    form === f ? "border-brand-400 bg-brand-50 font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-300" : "border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
                  }`}
                >
                  <input type="radio" name={id("form")} value={f} checked={form === f} onChange={() => setForm(f)} className="accent-brand-600" />
                  {MEDICINE_FORM_LABEL[f]}
                </label>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">U specifikaciji se tablete i ampule vode kao posebne grupe.</p>
          </fieldset>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cena po jedinici" htmlFor={id("price")}>
            <Input id={id("price")} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} trailing="RSD" placeholder="0,00" />
          </Field>
          <Field label={cfg.unitLabel} htmlFor={id("upp")} hint="Za preračun pakovanja.">
            <Input id={id("upp")} inputMode="numeric" value={upp} onChange={(e) => setUpp(e.target.value)} placeholder="npr. 30" />
          </Field>
        </div>

        {editing ? (
          <Field
            label="Ispravka stanja (opciono)"
            htmlFor={id("corr")}
            hint={`Trenutno ${formatQty(item?.quantity)} kom. Unesite tačno stanje posle popisa; za prijem robe koristite „Dopuni“.`}
          >
            <Input id={id("corr")} inputMode="decimal" value={correction} onChange={(e) => setCorrection(e.target.value)} trailing="kom." />
          </Field>
        ) : (
          <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Početno stanje</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Pakovanja" htmlFor={id("pkg")}>
                <Input id={id("pkg")} inputMode="numeric" value={packages} onChange={(e) => setPackages(e.target.value)} placeholder="0" />
              </Field>
              <Field label="Pojedinačno" htmlFor={id("units")}>
                <Input id={id("units")} inputMode="decimal" value={units} onChange={(e) => setUnits(e.target.value)} placeholder="0" trailing="kom." />
              </Field>
            </div>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              Ukupno: <span className="font-semibold text-gray-900 dark:text-white">{formatQty(initialTotal)} kom.</span>
              {num(price) > 0 && initialTotal > 0 && <span> · vrednost {formatRSD(initialTotal * num(price))}</span>}
            </p>
          </div>
        )}
      </form>
    </Dialog>
  );
}

// Prijem robe: dodaje pakovanja i/ili komade na stanje doma
export function RestockDialog({ cfg, open, onClose, item }: { cfg: InventoryConfig; open: boolean; onClose: () => void; item: InventoryItem | null }) {
  const formId = useId();
  const update = useUpdateItem(cfg);
  const [packages, setPackages] = useState("");
  const [units, setUnits] = useState("");

  useEffect(() => {
    if (open) {
      setPackages("");
      setUnits("");
    }
  }, [open]);

  if (!item) return null;
  const upp = item.unitsPerPackage ?? 0;
  const added = num(packages) * upp + num(units);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (added <= 0) return notify.error("Unesite količinu.");
    update.mutate(
      { id: item._id, packages: upp > 0 ? num(packages) : 0, addQuantity: num(units) },
      {
        onSuccess: () => {
          notify.success(`${item.name}: dodato ${formatQty(added)} kom.`);
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
      size="sm"
      title={`Dopuni: ${item.name}`}
      description={`Trenutno na stanju: ${formatQty(item.quantity)} kom.`}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Otkaži
          </Button>
          <Button size="sm" type="submit" form={formId} loading={update.isPending} disabled={added <= 0}>
            Dodaj na stanje
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Pakovanja" htmlFor={`${formId}-p`} hint={upp > 0 ? `po ${upp} kom.` : "Pakovanje nije definisano"}>
            <Input id={`${formId}-p`} inputMode="numeric" autoFocus value={packages} onChange={(e) => setPackages(e.target.value)} disabled={upp <= 0} placeholder="0" />
          </Field>
          <Field label="Pojedinačno" htmlFor={`${formId}-u`}>
            <Input id={`${formId}-u`} inputMode="decimal" value={units} onChange={(e) => setUnits(e.target.value)} placeholder="0" trailing="kom." />
          </Field>
        </div>
        <p className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2.5 text-sm text-gray-700 dark:bg-white/[0.03] dark:text-gray-300">
          <LuInfo className="h-4 w-4 shrink-0 text-gray-400" />
          Novo stanje: <span className="font-semibold tabular-nums text-gray-900 dark:text-white">{formatQty(item.quantity + added)} kom.</span>
        </p>
      </form>
    </Dialog>
  );
}
