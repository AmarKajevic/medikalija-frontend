import { useId } from "react";
import { LuCircleAlert, LuCoins } from "react-icons/lu";
import type { BillingState } from "@features/specification/hooks/useBillingState";

const fieldClass =
  "h-8 w-20 rounded-md border border-gray-300 bg-white px-2 text-right text-sm tabular-nums text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/15 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

// Kurs evra: uvek vidljiv u zaglavlju specifikacije (u svakom koraku) i tu se menja.
// Niži kurs preračunava specifikaciju u evre, srednji dug i smeštaj u dinare.
// Isti je za sve pacijente i čuva se kad se izađe iz polja.
export default function ExchangeRateBox({ billing }: { billing: BillingState }) {
  const ids = { lower: useId(), middle: useId() };
  const { fields, commitRates, rates } = billing;
  const missing = !(rates.lower > 0 && rates.middle > 0);

  return (
    <div
      role="group"
      aria-label="Kurs evra"
      className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border px-3 py-2 ${
        missing ? "border-warning-300 bg-warning-50 dark:border-warning-500/40 dark:bg-warning-500/10" : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
      }`}
    >
      <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300" title="Isti za sve pacijente; čuva se kad izađete iz polja">
        {missing ? <LuCircleAlert className="h-4 w-4 text-warning-600" /> : <LuCoins className="h-4 w-4 text-gray-400" />}
        Kurs €
      </span>
      <label htmlFor={ids.lower} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400" title="Specifikacija iz dinara u evre">
        Niži
        <input
          id={ids.lower}
          inputMode="decimal"
          value={fields.lowerRate}
          onChange={(e) => fields.setLowerRate(e.target.value)}
          onBlur={commitRates}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          placeholder="116,5"
          className={fieldClass}
        />
      </label>
      <label htmlFor={ids.middle} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400" title="Dug i smeštaj iz evra u dinare">
        Srednji
        <input
          id={ids.middle}
          inputMode="decimal"
          value={fields.middleRate}
          onChange={(e) => fields.setMiddleRate(e.target.value)}
          onBlur={commitRates}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          placeholder="117,2"
          className={fieldClass}
        />
      </label>
    </div>
  );
}
