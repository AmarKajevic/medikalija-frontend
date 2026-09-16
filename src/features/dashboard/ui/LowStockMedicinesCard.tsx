import Badge from "@shared/ui/badge/Badge";
import { LowStockMedicine } from "@features/dashboard/types";

export default function LowStockMedicinesCard({ medicines }: { medicines: LowStockMedicine[] }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <h3 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
        Lekovi na niskim zalihama
      </h3>
      {medicines.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Nema lekova sa niskim zalihama.
        </p>
      ) : (
        <ul className="space-y-3">
          {medicines.map((medicine) => (
            <li key={medicine._id} className="flex items-center justify-between gap-3">
              <span className="truncate text-sm text-gray-700 dark:text-gray-300">
                {medicine.name}
              </span>
              <Badge color={medicine.quantity === 0 ? "error" : "warning"} size="sm">
                {medicine.quantity} kom
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
