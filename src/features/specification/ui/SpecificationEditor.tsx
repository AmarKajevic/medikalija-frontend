import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAddExtraCost } from "@features/specification/hooks/useAddExtraCost";
import { useSaveBilling } from "@features/specification/hooks/useSaveBilling";
import { useExchangeRates } from "@entities/exchange-rate/model/ExchangeRateContext";
import { generateSpecificationPDF } from "@features/specification/lib/generateSpecificationPDF";
import { BillingForm } from "@features/specification/ui/BillingForm";
import { ExtraCostForm } from "@features/specification/ui/ExtraCostForm";
import { SpecificationTable } from "@features/specification/ui/SpecificationTable";
import { Specification } from "@features/specification/types/types";

const RELATED_QUERY_KEYS = ["specification", "patientSpecification", "specificationHistory"];

const getItemDisplayName = (item: any): string => {
  if (item.category === "combination" && Array.isArray(item.analyses) && item.analyses.length > 0) {
    const names = item.analyses.map((a: any) => a.name).join(" + ");
    const prices = item.analyses.map((a: any) => a.price).join(" + ");
    return `${names} = ${prices}`;
  }
  return item.formattedName ?? item.name ?? "Nepoznata stavka";
};

interface SpecificationEditorProps {
  specification: Specification;
  patientName: string;
  onDeleteItem: (itemId: string) => void;
}

export function SpecificationEditor({
  specification: spec,
  patientName,
  onDeleteItem,
}: SpecificationEditorProps) {
  const queryClient = useQueryClient();
  const { mutate: addExtraCost } = useAddExtraCost(spec._id);
  const { mutate: saveBilling, isPending: isSavingBilling } = useSaveBilling(spec._id);
  const { rates, updateRates } = useExchangeRates();

  const [extraCostAmount, setExtraCostAmount] = useState<number | "">("");
  const [extraCostLabel, setExtraCostLabel] = useState("");
  const [previousDebtEUR, setPreviousDebtEUR] = useState("");
  const [nextLodgingEUR, setNextLodgingEUR] = useState("");
  const [lowerRateInput, setLowerRateInput] = useState(rates.lower.toString());
  const [middleRateInput, setMiddleRateInput] = useState(rates.middle.toString());

  useEffect(() => {
    setPreviousDebtEUR(spec.billing?.previousDebtEUR ? spec.billing.previousDebtEUR.toString() : "");
    setNextLodgingEUR(spec.billing?.nextLodgingEUR ? spec.billing.nextLodgingEUR.toString() : "");
  }, [spec._id, spec.billing?.previousDebtEUR, spec.billing?.nextLodgingEUR]);

  useEffect(() => {
    setLowerRateInput(rates.lower.toString());
    setMiddleRateInput(rates.middle.toString());
  }, [rates.lower, rates.middle]);

  const invalidateRelated = () => {
    queryClient.invalidateQueries({
      predicate: (q) => RELATED_QUERY_KEYS.includes(q.queryKey[0] as string),
    });
  };

  const commitLowerRate = (value: string) => {
    const parsed = Number(value);
    if (value !== "" && !isNaN(parsed)) updateRates(parsed, rates.middle);
  };

  const commitMiddleRate = (value: string) => {
    const parsed = Number(value);
    if (value !== "" && !isNaN(parsed)) updateRates(rates.lower, parsed);
  };

  const specTotalRSD = spec.totalPrice ?? 0;

  const currentEndDate = new Date(spec.endDate);
  const nextStartDate = new Date(currentEndDate);
  nextStartDate.setDate(nextStartDate.getDate() + 1);
  const nextEndDate = new Date(nextStartDate);
  nextEndDate.setDate(nextEndDate.getDate() + 29);
  const nextPeriodLabel = `${nextStartDate.toLocaleDateString("sr-RS")} — ${nextEndDate.toLocaleDateString("sr-RS")}`;

  const debtEUR = previousDebtEUR === "" ? 0 : Number(previousDebtEUR);
  const lodgingEUR = nextLodgingEUR === "" ? 0 : Number(nextLodgingEUR);
  const lowRate = rates.lower;
  const midRate = rates.middle;
  const specEUR = lowRate > 0 ? specTotalRSD / lowRate : 0;
  const debtRSD = midRate > 0 ? debtEUR * midRate : 0;
  const lodgingRSD = midRate > 0 ? lodgingEUR * midRate : 0;
  const totalRSD = specTotalRSD + debtRSD + lodgingRSD;
  const totalEUR = specEUR + debtEUR + lodgingEUR;

  const handleAddCosts = () => {
    if (extraCostAmount && extraCostLabel) {
      addExtraCost(
        { amount: Number(extraCostAmount), label: extraCostLabel },
        { onSuccess: invalidateRelated }
      );
      setExtraCostAmount("");
      setExtraCostLabel("");
    }
  };

  const handleSaveBilling = () => {
    saveBilling(
      { previousDebtEUR: debtEUR, nextLodgingEUR: lodgingEUR },
      { onSuccess: invalidateRelated }
    );
  };

  const handlePDFExport = () => {
    generateSpecificationPDF({
      patientName,
      startDate: spec.startDate,
      endDate: spec.endDate,
      items: spec.items.map((item: any) => ({
        formattedName: getItemDisplayName(item),
        amount: item.amount ?? 1,
        price: item.price ?? 0,
      })),
      debtEUR,
      debtRSD,
      lodgingEUR,
      lodgingRSD,
      specEUR,
      specTotalRSD,
      totalRSD,
      totalEUR,
      nextPeriodLabel,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div data-print-area>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
            Specifikacija — {patientName}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Period: {new Date(spec.startDate).toLocaleDateString("sr-RS")} —{" "}
            {new Date(spec.endDate).toLocaleDateString("sr-RS")}
            {spec.isActive && (
              <span className="ml-2 inline-flex items-center rounded-full bg-success-50 px-2 py-0.5 text-xs font-medium text-success-600 dark:bg-success-500/15 dark:text-success-500">
                Aktivan period
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600"
          >
            🖨️ Štampaj
          </button>
          <button
            onClick={handlePDFExport}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            ⬇️ Preuzmi PDF
          </button>
        </div>
      </div>

      {/* Vidljivo samo pri štampi/PDF-u — kompaktan naslov perioda */}
      <p className="hidden print:block mb-4 text-sm text-gray-600">
        {patientName} — period {new Date(spec.startDate).toLocaleDateString("sr-RS")} —{" "}
        {new Date(spec.endDate).toLocaleDateString("sr-RS")}
      </p>

      <BillingForm
        previousDebtEUR={previousDebtEUR}
        nextLodgingEUR={nextLodgingEUR}
        lowerRate={lowerRateInput}
        middleRate={middleRateInput}
        nextPeriodLabel={nextPeriodLabel}
        onDebtChange={setPreviousDebtEUR}
        onLodgingChange={setNextLodgingEUR}
        onLowerRateChange={setLowerRateInput}
        onMiddleRateChange={setMiddleRateInput}
        onLowerRateCommit={commitLowerRate}
        onMiddleRateCommit={commitMiddleRate}
      />

      <h3 className="mb-2 text-base font-semibold text-gray-800 dark:text-white/90">
        Specifikacija za ovaj period
      </h3>
      <div className="mb-6">
        <SpecificationTable data={spec} onDelete={onDeleteItem} />
      </div>

      <ExtraCostForm
        label={extraCostLabel}
        amount={extraCostAmount}
        onLabelChange={setExtraCostLabel}
        onAmountChange={setExtraCostAmount}
        onAdd={handleAddCosts}
      />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 mb-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
          Konverzija
        </h3>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            <tr>
              <td className="p-3 text-gray-600 dark:text-gray-400">Specifikacija (EUR, niži kurs)</td>
              <td className="p-3 text-right text-gray-700 dark:text-gray-300">{specEUR.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="p-3 text-gray-600 dark:text-gray-400">Dug iz prethodnog perioda (EUR)</td>
              <td className="p-3 text-right text-gray-700 dark:text-gray-300">{debtEUR.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="p-3 text-gray-600 dark:text-gray-400">Smeštaj narednih 30 dana (EUR)</td>
              <td className="p-3 text-right text-gray-700 dark:text-gray-300">{lodgingEUR.toFixed(2)}</td>
            </tr>
            <tr className="font-bold text-gray-800 dark:text-white/90">
              <td className="p-3">UKUPNO (RSD)</td>
              <td className="p-3 text-right">{totalRSD.toFixed(2)}</td>
            </tr>
            <tr className="font-bold text-gray-800 dark:text-white/90">
              <td className="p-3">UKUPNO (EUR)</td>
              <td className="p-3 text-right">{totalEUR.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex justify-end gap-3 mb-10 print:hidden">
        <button
          onClick={handleSaveBilling}
          disabled={isSavingBilling}
          className="rounded-lg bg-success-500 px-4 py-2 text-sm font-medium text-white hover:bg-success-600 disabled:opacity-50"
        >
          {isSavingBilling ? "Čuvanje..." : "Sačuvaj obračun"}
        </button>
      </div>
    </div>
  );
}
