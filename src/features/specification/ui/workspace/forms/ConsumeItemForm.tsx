import { FormEvent, useId, useState } from "react";
import { LuCalculator, LuChevronDown, LuInfo } from "react-icons/lu";
import StockCombobox from "@shared/ui/combobox/StockCombobox";
import Field, { inputClass } from "@shared/ui/form/Field";
import Button from "@shared/ui/button/Button";
import { notify } from "@shared/lib/notify";
import { formatQty, formatRSD } from "@shared/lib/format";
import { useMedicineOptions } from "@features/medicine/hooks/useMedicineOptions";
import { useArticleOptions } from "@features/articles/ui/useArticleOptions";
import { useUseMedicine } from "@features/medicine/hooks/useUseMedicine";
import { useUseArticle } from "@features/articles/hooks/useUseArticle";

const PORTIONS = [
  { label: "Cela tableta", value: 1 },
  { label: "Polovina", value: 0.5 },
  { label: "Trećina", value: 0.33 },
  { label: "Četvrtina", value: 0.25 },
  { label: "1 i četvrtina", value: 1.25 },
  { label: "1 i trećina", value: 1.33 },
  { label: "1 i po", value: 1.5 },
  { label: "Dve cele", value: 2 },
];

const round2 = (n: number) => Math.round(n * 100) / 100;

interface Props {
  kind: "medicine" | "article";
  patientId: string;
}

export default function ConsumeItemForm({ kind, patientId }: Props) {
  const isMedicine = kind === "medicine";
  const ids = { item: useId(), amount: useId(), days: useId(), times: useId(), portion: useId() };

  const medicineOptions = useMedicineOptions(isMedicine ? patientId : "");
  const articleOptions = useArticleOptions(isMedicine ? "" : patientId);
  const { options, isLoading } = isMedicine ? medicineOptions : articleOptions;

  const useMedicine = useUseMedicine(patientId);
  const useArticle = useUseArticle(patientId);
  const mutation = isMedicine ? useMedicine : useArticle;

  const [itemId, setItemId] = useState("");
  const [amount, setAmount] = useState("");
  const [showCalc, setShowCalc] = useState(false);
  const [days, setDays] = useState("");
  const [timesPerDay, setTimesPerDay] = useState("");
  const [portion, setPortion] = useState(1);

  const selected = options.find((o) => o.value === itemId);
  const qty = round2(Number(amount.replace(",", ".")) || 0);

  // Isto pravilo kao na backendu: prvo porodično stanje, ostatak sa stanja doma
  const fromFamily = selected ? Math.min(selected.family, qty) : 0;
  const fromHome = round2(qty - fromFamily);
  const charge = fromHome * (selected?.price ?? 0);
  const notEnough = !!selected && fromHome > selected.home + 1e-6;

  const applyCalculator = (d: string, t: string, p: number) => {
    const total = round2((Number(d) || 0) * (Number(t) || 0) * p);
    if (total > 0) setAmount(String(total));
  };

  const reset = () => {
    setAmount("");
    setDays("");
    setTimesPerDay("");
    setPortion(1);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!itemId) return notify.error("Izaberite stavku sa liste.");
    if (qty <= 0) return notify.error("Unesite količinu veću od nule.");

    const payload = isMedicine ? { medicineId: itemId, amount: qty } : { articleId: itemId, amount: qty };
    // TS ne može da suzi uniju mutacija preko `isMedicine`, pa je poziv eksplicitan
    const run = isMedicine
      ? useMedicine.mutateAsync(payload as { medicineId: string; amount: number })
      : useArticle.mutateAsync(payload as { articleId: string; amount: number });

    run
      .then((res) => {
        notify.success(`${selected?.label}: ${res.message}`);
        reset();
      })
      .catch((err) => notify.error(err));
  };

  const noun = isMedicine ? "lek" : "artikal";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label={isMedicine ? "Lek" : "Artikal"} htmlFor={ids.item}>
        <StockCombobox
          id={ids.item}
          value={itemId}
          onChange={setItemId}
          options={options}
          loading={isLoading}
          placeholder={`Pretraži ${isMedicine ? "lekove" : "artikle"}...`}
        />
      </Field>

      {isMedicine && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800">
          <button
            type="button"
            onClick={() => setShowCalc((v) => !v)}
            className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            <span className="flex items-center gap-2">
              <LuCalculator className="h-4 w-4 text-gray-400" />
              Kalkulator doze
            </span>
            <LuChevronDown className={`h-4 w-4 text-gray-400 transition ${showCalc ? "rotate-180" : ""}`} />
          </button>
          {showCalc && (
            <div className="grid grid-cols-3 gap-2 border-t border-gray-200 p-3 dark:border-gray-800">
              <Field label="Dana" htmlFor={ids.days}>
                <input
                  id={ids.days}
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={days}
                  onChange={(e) => {
                    setDays(e.target.value);
                    applyCalculator(e.target.value, timesPerDay, portion);
                  }}
                  className={inputClass}
                />
              </Field>
              <Field label="Puta dnevno" htmlFor={ids.times}>
                <input
                  id={ids.times}
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={timesPerDay}
                  onChange={(e) => {
                    setTimesPerDay(e.target.value);
                    applyCalculator(days, e.target.value, portion);
                  }}
                  className={inputClass}
                />
              </Field>
              <Field label="Doza" htmlFor={ids.portion}>
                <select
                  id={ids.portion}
                  value={portion}
                  onChange={(e) => {
                    const p = Number(e.target.value);
                    setPortion(p);
                    applyCalculator(days, timesPerDay, p);
                  }}
                  className={inputClass}
                >
                  {PORTIONS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          )}
        </div>
      )}

      <Field label="Količina" htmlFor={ids.amount} hint={isMedicine ? "Broj tableta/doza. Može i decimalno (npr. 0,5)." : undefined}>
        <input
          id={ids.amount}
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          className={inputClass}
        />
      </Field>

      {selected && qty > 0 && (
        <div
          className={`rounded-xl border p-3 text-sm ${
            notEnough
              ? "border-error-200 bg-error-50 text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400"
              : "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300"
          }`}
        >
          {notEnough ? (
            <p className="flex gap-2">
              <LuInfo className="mt-0.5 h-4 w-4 shrink-0" />
              Nema dovoljno na stanju doma: potrebno {formatQty(fromHome)}, dostupno {formatQty(selected.home)}.
            </p>
          ) : (
            <dl className="space-y-1">
              {fromFamily > 0 && (
                <div className="flex justify-between">
                  <dt>Sa porodičnog stanja (ne naplaćuje se)</dt>
                  <dd className="font-medium">{formatQty(fromFamily)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt>Sa stanja doma</dt>
                <dd className="font-medium">{formatQty(fromHome)}</dd>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-1 font-semibold text-gray-900 dark:border-gray-700 dark:text-white">
                <dt>Ulazi u specifikaciju</dt>
                <dd>{formatRSD(charge)}</dd>
              </div>
            </dl>
          )}
        </div>
      )}

      <Button type="submit" className="w-full" loading={mutation.isPending} disabled={notEnough || !itemId || qty <= 0}>
        Dodaj {noun}
      </Button>
    </form>
  );
}
