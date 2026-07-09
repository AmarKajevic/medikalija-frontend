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
}

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
}: BillingFormProps) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mt-4 mb-2">Obračun naplate (unos u EUR)</h3>
      <table className="w-full border-collapse border border-gray-400 mb-6">
        <tbody>
          <tr>
            <td className="border p-2">Dug iz prethodnog perioda (EUR)</td>
            <td className="border p-2 text-right">
              <input
                type="number"
                value={previousDebtEUR}
                onChange={(e) => onDebtChange(e.target.value)}
                className="border p-1 rounded w-32 text-right"
              />
            </td>
          </tr>
          <tr>
            <td className="border p-2">
              Smeštaj za narednih 30 dana (EUR)
              <br />
              <span className="text-xs text-gray-500">Period: {nextPeriodLabel}</span>
            </td>
            <td className="border p-2 text-right">
              <input
                type="number"
                value={nextLodgingEUR}
                onChange={(e) => onLodgingChange(e.target.value)}
                className="border p-1 rounded w-32 text-right"
              />
            </td>
          </tr>
          <tr>
            <td className="border p-2">Niži kurs (specifikacija)</td>
            <td className="border p-2 text-right">
              <input
                type="number"
                value={lowerRate}
                onChange={(e) => onLowerRateChange(e.target.value)}
                className="border p-1 rounded w-32 text-right"
              />
            </td>
          </tr>
          <tr>
            <td className="border p-2">Srednji kurs (dug + smeštaj)</td>
            <td className="border p-2 text-right">
              <input
                type="number"
                value={middleRate}
                onChange={(e) => onMiddleRateChange(e.target.value)}
                className="border p-1 rounded w-32 text-right"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
});