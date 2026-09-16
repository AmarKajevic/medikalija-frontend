import { memo } from "react";

interface ExtraCostFormProps {
  label: string;
  amount: number | "";
  onLabelChange: (val: string) => void;
  onAmountChange: (val: number | "") => void;
  onAdd: () => void;
}

export const ExtraCostForm = memo(({ label, amount, onLabelChange, onAmountChange, onAdd }: ExtraCostFormProps) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 mb-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <h3 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
        Dodaj dodatne troškove
      </h3>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">Opis</label>
          <input
            type="text"
            value={label}
            onChange={(e) => onLabelChange(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-1.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">Iznos (RSD)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-32 rounded-md border border-gray-300 p-1.5 text-right text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
        </div>
        <button
          onClick={onAdd}
          className="rounded-md bg-success-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-success-600"
        >
          Sačuvaj dodatne troškove
        </button>
      </div>
    </div>
  );
});
