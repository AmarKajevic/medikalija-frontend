import { useState } from "react";
import Dialog from "@shared/ui/dialog/Dialog";
import Tabs from "@shared/ui/tabs/Tabs";
import EmptyState from "@shared/ui/feedback/EmptyState";
import { Skeleton } from "@shared/ui/feedback/Spinner";
import { formatQty } from "@shared/lib/format";
import { useGetPatientStockMedicines } from "@features/medicine/hooks/useGetPatientStockMedicines";
import { useGetPatientStockArticles } from "@features/articles/hooks/useGetPatientStockArticles";

type StockRow = { _id: string; name: string; familyQuantity: number; familyPackageCount?: number; unitsPerPackage?: number };

function StockList({ rows, loading, empty }: { rows: StockRow[]; loading: boolean; empty: string }) {
  if (loading) return <Skeleton className="h-32" />;
  if (rows.length === 0) return <EmptyState compact title={empty} />;
  return (
    <ul className="divide-y divide-gray-100 dark:divide-gray-800">
      {rows.map((r) => (
        <li key={r._id} className="flex items-center justify-between gap-3 py-3">
          <span className="text-sm font-medium text-gray-800 dark:text-white/90">{r.name}</span>
          <span className="text-sm tabular-nums text-gray-700 dark:text-gray-300">
            {formatQty(r.familyQuantity)} kom.
            {!!r.unitsPerPackage && r.familyPackageCount !== undefined && (
              <span className="ml-1 text-xs text-gray-500">({r.familyPackageCount} pak.)</span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

const asRows = (data: unknown): StockRow[] =>
  Array.isArray(data) ? (data as StockRow[]).filter((r) => r.familyQuantity > 0) : [];

export default function FamilyStockDialog({ open, onClose, patientId }: { open: boolean; onClose: () => void; patientId: string }) {
  const [tab, setTab] = useState<"medicines" | "articles">("medicines");
  const medicines = useGetPatientStockMedicines(patientId);
  const articles = useGetPatientStockArticles(patientId);

  const medicineRows = asRows(medicines.data);
  const articleRows = asRows(articles.data);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="md"
      title="Porodično stanje"
      description="Ono što je porodica donela troši se prvo i ne naplaćuje se."
    >
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: "medicines", label: "Lekovi", count: medicineRows.length },
          { value: "articles", label: "Artikli", count: articleRows.length },
        ]}
        className="mb-2"
      />
      {tab === "medicines" ? (
        <StockList rows={medicineRows} loading={medicines.isLoading} empty="Nema porodičnih lekova" />
      ) : (
        <StockList rows={articleRows} loading={articles.isLoading} empty="Nema porodičnih artikala" />
      )}
    </Dialog>
  );
}
