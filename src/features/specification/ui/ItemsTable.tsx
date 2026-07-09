import { memo } from "react";

interface ItemsTableProps {
  items: Array<{ _id: string; name: string; formattedName?: string; amount: number; price: number }>;
  totalPrice: number;
}

export const ItemsTable = memo(({ items, totalPrice }: ItemsTableProps) => {
  return (
    <>
      <h3 className="text-lg font-semibold mb-2">Specifikacija za ovaj period</h3>
      <table className="w-full border-collapse border border-gray-300 mb-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Opis</th>
            <th className="border p-2 text-right">Količina</th>
            <th className="border p-2 text-right">Cena (RSD)</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item._id}>
              <td className="border p-2">{item.formattedName ?? item.name}</td>
              <td className="border p-2 text-right">{item.amount ?? 1}</td>
              <td className="border p-2 text-right">{(item.price ?? 0).toFixed(2)}</td>
            </tr>
          ))}
          <tr className="font-bold bg-gray-50">
            <td className="border p-2"></td>
            <td className="border p-2 text-right">Ukupno:</td>
            <td className="border p-2 text-right">{totalPrice.toFixed(2)} RSD</td>
          </tr>
        </tbody>
      </table>
    </>
  );
});