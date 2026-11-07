import { useId, useState } from "react";
import { LuChevronDown, LuCircleAlert, LuCoins } from "react-icons/lu";
import Field, { inputClass } from "@shared/ui/form/Field";
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

const rateText = (n: number) => (n > 0 ? n.toLocaleString("sr-Latn-RS", { maximumFractionDigits: 4 }) : "nije unet");

export default function BillingPanel({ billing, nextPeriodLabel }: Props) {
  const ids = { debt: useId(), lodging: useId(), lower: useId(), middle: useId() };
  const { fields, result, commitRates, rates, dirty, saving, saveBilling } = billing;
  const ratesMissing = !(rates.lower > 0 && rates.middle > 0);
  const [showRates, setShowRates] = useState(false);
  const ratesOpen = showRates || ratesMissing;

  const rows: Array<[string, string, string, string]> = [
    ["Lekovi, artikli, analize i troškovi", "iz koraka 1", formatRSD(result.specTotalRSD), formatEUR(result.specEUR)],
    ...(fields.includeDebt ? [["Dug iz prethodnog perioda", "uneto gore", formatRSD(result.debtRSD), formatEUR(result.debtEUR)] as [string, string, string, string]] : []),
    ...(fields.includeLodging ? [["Smeštaj za naredni period", nextPeriodLabel, formatRSD(result.lodgingRSD), formatEUR(result.lodgingEUR)] as [string, string, string, string]] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Dug i smeštaj su opcioni: isključeno se ne naplaćuje i ne štampa */}
      <div className="grid gap-4 sm:grid-cols-2">
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
      </div>

      {/* Kursna lista: retko se menja i važi za sve pacijente, pa je sklopljena */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800">
        <button
          type="button"
          onClick={() => setShowRates((v) => !v)}
          aria-expanded={ratesOpen}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        >
          <span className="flex min-w-0 items-center gap-3">
            <LuCoins className="h-5 w-5 shrink-0 text-gray-400" />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-gray-800 dark:text-white/90">Kurs evra</span>
              <span className="block text-xs text-gray-500 dark:text-gray-400">
                Niži {rateText(rates.lower)} · Srednji {rateText(rates.middle)} — isti za sve pacijente
              </span>
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400">
            {ratesOpen ? "Sakrij" : "Promeni"}
            <LuChevronDown className={`h-4 w-4 transition ${ratesOpen ? "rotate-180" : ""}`} />
          </span>
        </button>
        {ratesOpen && (
          <div className="space-y-4 border-t border-gray-200 p-4 dark:border-gray-800">
            {ratesMissing && (
              <p className="flex gap-2 rounded-lg bg-warning-50 p-3 text-xs text-warning-700 dark:bg-warning-500/10 dark:text-warning-400">
                <LuCircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                Kurs nije unet, pa iznosi u evrima ne mogu da se izračunaju. Unesite današnji kurs.
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Niži kurs" htmlFor={ids.lower} hint="Za preračun specifikacije iz dinara u evre.">
                <input
                  id={ids.lower}
                  inputMode="decimal"
                  value={fields.lowerRate}
                  onChange={(e) => fields.setLowerRate(e.target.value)}
                  onBlur={commitRates}
                  placeholder="npr. 116,5"
                  className={inputClass}
                />
              </Field>
              <Field label="Srednji kurs" htmlFor={ids.middle} hint="Za preračun duga i smeštaja iz evra u dinare.">
                <input
                  id={ids.middle}
                  inputMode="decimal"
                  value={fields.middleRate}
                  onChange={(e) => fields.setMiddleRate(e.target.value)}
                  onBlur={commitRates}
                  placeholder="npr. 117,2"
                  className={inputClass}
                />
              </Field>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Kurs se čuva automatski kad izađete iz polja.</p>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
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
