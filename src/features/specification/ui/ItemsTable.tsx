import { memo } from "react";

interface ItemsTableProps {
  items: Array<{ _id: string; name: string; formattedName?: string; amount: number; price: number }>;
  totalPrice: number;
}

export const ItemsTable = memo(({ items, totalPrice }: ItemsTableProps) => {
  return (
    <>
      <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">Specifikacija za ovaj period</h3>
      <table className="mb-6 w-full border-collapse border border-gray-300 dark:border-gray-700">
        <thead>
          <tr className="bg-gray-100 dark:bg-white/[0.03]">
            <th className="border border-gray-300 p-2 text-left text-gray-700 dark:border-gray-700 dark:text-gray-300">Opis</th>
            <th className="border border-gray-300 p-2 text-right text-gray-700 dark:border-gray-700 dark:text-gray-300">Količina</th>
            <th className="border border-gray-300 p-2 text-right text-gray-700 dark:border-gray-700 dark:text-gray-300">Cena (RSD)</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item._id}>
              <td className="border border-gray-300 p-2 text-gray-700 dark:border-gray-700 dark:text-gray-300">{item.formattedName ?? item.name}</td>
              <td className="border border-gray-300 p-2 text-right text-gray-700 dark:border-gray-700 dark:text-gray-300">{item.amount ?? 1}</td>
              <td className="border border-gray-300 p-2 text-right text-gray-700 dark:border-gray-700 dark:text-gray-300">{(item.price ?? 0).toFixed(2)}</td>
            </tr>
          ))}
          <tr className="bg-gray-50 font-bold dark:bg-white/[0.03]">
            <td className="border border-gray-300 p-2 dark:border-gray-700"></td>
            <td className="border border-gray-300 p-2 text-right text-gray-800 dark:border-gray-700 dark:text-white/90">Ukupno:</td>
            <td className="border border-gray-300 p-2 text-right text-gray-800 dark:border-gray-700 dark:text-white/90">{totalPrice.toFixed(2)} RSD</td>
          </tr>
        </tbody>
      </table>
    </>
  );
});