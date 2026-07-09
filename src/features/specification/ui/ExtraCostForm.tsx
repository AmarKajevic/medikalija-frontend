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
    <div>
      <h3 className="text-lg font-semibold mb-2">Dodaj dodatne troškove</h3>
      <table className="w-full border-collapse border border-gray-300 mb-4">
        <tbody>
          <tr>
            <td className="border p-2 font-medium">Opis</td>
            <td className="border p-2">
              <input
                type="text"
                value={label}
                onChange={(e) => onLabelChange(e.target.value)}
                className="border p-1 rounded w-full"
              />
            </td>
          </tr>
          <tr>
            <td className="border p-2 font-medium">Iznos (RSD)</td>
            <td className="border p-2 text-right">
              <input
                type="number"
                value={amount}
                onChange={(e) => onAmountChange(e.target.value === "" ? "" : Number(e.target.value))}
                className="border p-1 rounded w-32 text-right"
              />
            </td>
          </tr>
        </tbody>
      </table>
      <div className="flex justify-end mb-4">
        <button onClick={onAdd} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          Sačuvaj dodatne troškove
        </button>
      </div>
    </div>
  );
});