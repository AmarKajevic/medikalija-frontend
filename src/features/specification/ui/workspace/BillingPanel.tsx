import { useEffect, useId, useState } from "react";
import Field, { inputClass } from "@shared/ui/form/Field";
import Button from "@shared/ui/button/Button";
import { notify } from "@shared/lib/notify";
import { formatEUR, formatRSD } from "@shared/lib/format";
import { useSaveBilling } from "@features/specification/hooks/useSaveBilling";
import { useBillingState } from "@features/specification/hooks/useBillingState";
import { Specification } from "@features/specification/types/types";

type BillingState = ReturnType<typeof useBillingState>;

interface Props {
  specification: Specification;
  patientId: string;
  billing: BillingState;
  nextPeriodLabel: string;
}

export default function BillingPanel({ specification: spec, patientId, billing, nextPeriodLabel }: Props) {
  const ids = { debt: useId(), lodging: useId(), lower: useId(), middle: useId() };
  const { fields, result, commitRates } = billing;
  const save = useSaveBilling(spec._id, patientId);
  const [dirty, setDirty] = useState(false);

  useEffect(() => setDirty(false), [spec._id]);

  const onSave = () =>
    save.mutate(
      { previousDebtEUR: result.debtEUR, nextLodgingEUR: result.lodgingEUR },
      {
        onSuccess: () => {
          setDirty(false);
          notify.success("Obračun je sačuvan.");
        },
        onError: (err) => notify.error(err),
      }
    );

  const rows: Array<[string, string, string]> = [
    ["Specifikacija", formatRSD(result.specTotalRSD), formatEUR(result.specEUR)],
    ["Dug iz prethodnog perioda", formatRSD(result.debtRSD), formatEUR(result.debtEUR)],
    ["Smeštaj za naredni period", formatRSD(result.lodgingRSD), formatEUR(result.lodgingEUR)],
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Dug iz prethodnog perioda (EUR)" htmlFor={ids.debt}>
          <input
            id={ids.debt}
            inputMode="decimal"
            value={fields.debt}
            onChange={(e) => {
              fields.setDebt(e.target.value);
              setDirty(true);
            }}
            placeholder="0,00"
            className={inputClass}
          />
        </Field>
        <Field label="Smeštaj za naredni period (EUR)" htmlFor={ids.lodging} hint={nextPeriodLabel}>
          <input
            id={ids.lodging}
            inputMode="decimal"
            value={fields.lodging}
            onChange={(e) => {
              fields.setLodging(e.target.value);
              setDirty(true);
            }}
            placeholder="0,00"
            className={inputClass}
          />
        </Field>
        <Field label="Niži kurs (specifikacija)" htmlFor={ids.lower} hint="Važi za sve pacijente.">
          <input
            id={ids.lower}
            inputMode="decimal"
            value={fields.lowerRate}
            onChange={(e) => fields.setLowerRate(e.target.value)}
            onBlur={commitRates}
            className={inputClass}
          />
        </Field>
        <Field label="Srednji kurs (dug i smeštaj)" htmlFor={ids.middle} hint="Važi za sve pacijente.">
          <input
            id={ids.middle}
            inputMode="decimal"
            value={fields.middleRate}
            onChange={(e) => fields.setMiddleRate(e.target.value)}
            onBlur={commitRates}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-white/[0.03] dark:text-gray-400">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Stavka</th>
              <th className="px-4 py-2 text-right font-medium">RSD</th>
              <th className="px-4 py-2 text-right font-medium">EUR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 tabular-nums dark:divide-gray-800">
            {rows.map(([label, r, e]) => (
              <tr key={label} className="text-gray-700 dark:text-gray-300">
                <td className="px-4 py-2.5">{label}</td>
                <td className="px-4 py-2.5 text-right">{r}</td>
                <td className="px-4 py-2.5 text-right">{e}</td>
              </tr>
            ))}
            <tr className="bg-gray-50 font-semibold text-gray-900 dark:bg-white/[0.03] dark:text-white">
              <td className="px-4 py-3">Ukupno za uplatu</td>
              <td className="px-4 py-3 text-right">{formatRSD(result.totalRSD)}</td>
              <td className="px-4 py-3 text-right">{formatEUR(result.totalEUR)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-3">
        {dirty && <span className="text-xs text-warning-600 dark:text-warning-400">Imate nesačuvane izmene</span>}
        <Button onClick={onSave} loading={save.isPending} size="sm">
          Sačuvaj obračun
        </Button>
      </div>
    </div>
  );
}
