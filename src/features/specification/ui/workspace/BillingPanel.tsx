import { useId } from "react";
import { LuCircleAlert, LuCoins } from "react-icons/lu";
import { inputClass } from "@shared/ui/form/Field";
import { Input } from "@shared/ui/form/controls";
import Button from "@shared/ui/button/Button";
import { formatEUR, formatRSD } from "@shared/lib/format";
import type { BillingState } from "@features/specification/hooks/useBillingState";

interface Props {
  billing: BillingState;
  nextPeriodLabel: string;
}

// Iznos u evrima koji se uključuje prekidačem (kad je isključen, ne ide u obračun ni na štampu)
function OptionalAmount({ id, title, hint, enabled, onToggle, value, onChange }: { id: string; title: string; hint: string; enabled: boolean; onToggle: (v: boolean) => void; value: string; onChange: (v: string) => void }) {
  return (
    <div className={`rounded-xl border p-4 transition ${enabled ? "border-brand-300 bg-brand-50/40 dark:border-brand-500/40 dark:bg-brand-500/5" : "border-gray-200 dark:border-gray-800"}`}>
      <label className="flex cursor-pointer items-start justify-between gap-3">
        <span>
          <span className="block text-sm font-medium text-gray-900 dark:text-white">{title}</span>
          <span className="block text-xs text-gray-500 dark:text-gray-400">{enabled ? hint : "Ne naplaćuje se i ne štampa se."}</span>
        </span>
        <span className="relative mt-0.5 inline-flex shrink-0">
          <input type="checkbox" role="switch" checked={enabled} onChange={(e) => onToggle(e.target.checked)} aria-label={`Naplati: ${title}`} className="peer sr-only" />
          <span className="h-6 w-11 rounded-full bg-gray-200 transition peer-checked:bg-brand-500 peer-focus-visible:ring-3 peer-focus-visible:ring-brand-500/30 dark:bg-gray-700" />
          <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
        </span>
      </label>
      {enabled && (
        <div className="mt-3">
          <label htmlFor={id} className="sr-only">
            {title} (EUR)
          </label>
          <Input id={id} inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} placeholder="0,00" trailing="EUR" autoFocus={!value} />
        </div>
      )}
    </div>
  );
}

export default function BillingPanel({ billing, nextPeriodLabel }: Props) {
  const ids = { debt: useId(), lodging: useId(), early: useId(), lower: useId(), middle: useId() };
  const { fields, result, commitRates, rates, dirty, saving, saveBilling } = billing;
  const ratesMissing = !(rates.lower > 0 && rates.middle > 0);

  const rows: Array<[string, string, string, string]> = [
    ["Lekovi, artikli, analize i troškovi", "iz koraka 1", formatRSD(result.specTotalRSD), formatEUR(result.specEUR)],
    ...(fields.includeDebt ? [["Dug iz prethodnog perioda", "uneto gore", formatRSD(result.debtRSD), formatEUR(result.debtEUR)] as [string, string, string, string]] : []),
    ...(fields.includeLodging ? [["Smeštaj za naredni period", nextPeriodLabel, formatRSD(result.lodgingRSD), formatEUR(result.lodgingEUR)] as [string, string, string, string]] : []),
    ...(fields.includeEarly ? [["Vanstandardni period smeštaja", "uneto gore", formatRSD(result.earlyLodgingRSD), formatEUR(result.earlyLodgingEUR)] as [string, string, string, string]] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Kurs evra je uvek vidljiv i menja se ovde (važi za sve pacijente) */}
      <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
        <div className="mb-3 flex items-center gap-2">
          <LuCoins className="h-5 w-5 shrink-0 text-gray-400" />
          <h4 className="text-sm font-medium text-gray-800 dark:text-white/90">Kurs evra</h4>
          <span className="text-xs text-gray-500 dark:text-gray-400">· isti za sve pacijente, čuva se kad izađete iz polja</span>
        </div>
        {ratesMissing && (
          <p className="mb-3 flex gap-2 rounded-lg bg-warning-50 p-3 text-xs text-warning-700 dark:bg-warning-500/10 dark:text-warning-400">
            <LuCircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            Kurs nije unet, pa iznosi u evrima ne mogu da se izračunaju. Unesite današnji kurs.
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor={ids.lower} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Niži kurs
            </label>
            <p className="mb-1.5 text-xs text-gray-500 dark:text-gray-400">Specifikacija iz dinara u evre</p>
            <input
              id={ids.lower}
              inputMode="decimal"
              value={fields.lowerRate}
              onChange={(e) => fields.setLowerRate(e.target.value)}
              onBlur={commitRates}
              placeholder="npr. 116,5"
              className={`${inputClass} tabular-nums`}
            />
          </div>
          <div>
            <label htmlFor={ids.middle} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Srednji kurs
            </label>
            <p className="mb-1.5 text-xs text-gray-500 dark:text-gray-400">Dug i smeštaj iz evra u dinare</p>
            <input
              id={ids.middle}
              inputMode="decimal"
              value={fields.middleRate}
              onChange={(e) => fields.setMiddleRate(e.target.value)}
              onBlur={commitRates}
              placeholder="npr. 117,2"
              className={`${inputClass} tabular-nums`}
            />
          </div>
        </div>
      </div>

      {/* Dug, smeštaj i vanstandardni period smeštaja su opcioni: isključeno se ne naplaćuje i ne štampa */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <OptionalAmount
          id={ids.debt}
          title="Dug iz prethodnog perioda"
          hint="Iznos koji porodica nije platila do sada."
          enabled={fields.includeDebt}
          onToggle={fields.setIncludeDebt}
          value={fields.debt}
          onChange={fields.setDebt}
        />
        <OptionalAmount
          id={ids.lodging}
          title="Smeštaj za naredni period"
          hint={`Plaća se unapred, za period ${nextPeriodLabel}`}
          enabled={fields.includeLodging}
          onToggle={fields.setIncludeLodging}
          value={fields.lodging}
          onChange={fields.setLodging}
        />
        <OptionalAmount
          id={ids.early}
          title="Vanstandardni period smeštaja"
          hint="Smeštaj van redovnog perioda (npr. dani pre početka)."
          enabled={fields.includeEarly}
          onToggle={fields.setIncludeEarly}
          value={fields.early}
          onChange={fields.setEarly}
        />
      </div>

      <div className="relative overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-white/[0.03] dark:text-gray-400">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Šta se plaća</th>
              <th className="px-4 py-2 text-right font-medium">RSD</th>
              <th className="px-4 py-2 text-right font-medium">EUR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 tabular-nums dark:divide-gray-800">
            {rows.map(([label, note, r, e]) => (
              <tr key={label} className="text-gray-700 dark:text-gray-300">
                <td className="px-4 py-2.5">
                  {label}
                  <span className="block text-xs text-gray-400">{note}</span>
                </td>
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

      <div className="flex flex-wrap items-center justify-end gap-3">
        {dirty && <span className="text-xs text-warning-600 dark:text-warning-400">Imate nesačuvane izmene</span>}
        <Button onClick={() => void saveBilling()} loading={saving} size="sm" variant={dirty ? "primary" : "outline"}>
          Sačuvaj obračun
        </Button>
      </div>
    </div>
  );
}
