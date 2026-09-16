import { memo } from "react";

interface BillingFormProps {
  previousDebtEUR: string;
  nextLodgingEUR: string;
  lowerRate: string;
  middleRate: string;
  nextPeriodLabel: string;
  onDebtChange: (val: string) => void;
  onLodgingChange: (val: string) => void;
  onLowerRateChange: (val: string) => void;
  onMiddleRateChange: (val: string) => void;
  onLowerRateCommit?: (val: string) => void;
  onMiddleRateCommit?: (val: string) => void;
}

const inputClass =
  "w-32 rounded-md border border-gray-300 p-1.5 text-right text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white";
const rowLabelClass = "p-3 text-sm text-gray-600 dark:text-gray-400";

export const BillingForm = memo(({
  previousDebtEUR,
  nextLodgingEUR,
  lowerRate,
  middleRate,
  nextPeriodLabel,
  onDebtChange,
  onLodgingChange,
  onLowerRateChange,
  onMiddleRateChange,
  onLowerRateCommit,
  onMiddleRateCommit,
}: BillingFormProps) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 mb-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <h3 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
        Obračun naplate (unos u EUR)
      </h3>
      <table className="w-full">
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          <tr>
            <td className={rowLabelClass}>Dug iz prethodnog perioda (EUR)</td>
            <td className="p-3 text-right">
              <input
                type="number"
                value={previousDebtEUR}
                onChange={(e) => onDebtChange(e.target.value)}
                className={inputClass}
              />
            </td>
          </tr>
          <tr>
            <td className={rowLabelClass}>
              Smeštaj za narednih 30 dana (EUR)
              <br />
              <span className="text-xs text-gray-400">Period: {nextPeriodLabel}</span>
            </td>
            <td className="p-3 text-right">
              <input
                type="number"
                value={nextLodgingEUR}
                onChange={(e) => onLodgingChange(e.target.value)}
                className={inputClass}
              />
            </td>
          </tr>
          <tr>
            <td className={rowLabelClass}>Niži kurs (specifikacija)</td>
            <td className="p-3 text-right">
              <input
                type="number"
                value={lowerRate}
                onChange={(e) => onLowerRateChange(e.target.value)}
                onBlur={(e) => onLowerRateCommit?.(e.target.value)}
                className={inputClass}
              />
            </td>
          </tr>
          <tr>
            <td className={rowLabelClass}>Srednji kurs (dug + smeštaj)</td>
            <td className="p-3 text-right">
              <input
                type="number"
                value={middleRate}
                onChange={(e) => onMiddleRateChange(e.target.value)}
                onBlur={(e) => onMiddleRateCommit?.(e.target.value)}
                className={inputClass}
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
});
