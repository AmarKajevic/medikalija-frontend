// ui/SpecificationHistoryTable.tsx
import { Link } from "react-router";
import { useSpecificationHistory } from "@features/specification/hooks/useSpecificationHistory";
import { formatDate } from "@features/specification/lib/helpers";

interface SpecificationHistoryTableProps {
  patientId: string;
}

export const SpecificationHistoryTable = ({ patientId }: SpecificationHistoryTableProps) => {
  const { data, isLoading, isError } = useSpecificationHistory(patientId);

  if (isLoading) return <p className="text-sm text-gray-500 dark:text-gray-400">Učitavanje istorije...</p>;
  if (isError) return <p className="text-sm text-error-500">Greška pri učitavanju istorije.</p>;
  if (!data) return <p className="text-sm text-gray-500 dark:text-gray-400">Nema dostupnih podataka.</p>;

  const { activeSpec, history } = data;

  return (
    <div className="space-y-8">
      {/* Aktivna specifikacija */}
      {activeSpec ? (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-success-600 dark:text-success-500">Aktivna specifikacija</h2>
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-theme-xs dark:border-gray-800">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-success-50 text-gray-700 dark:bg-success-500/10 dark:text-gray-300">
                <tr>
                  <th className="border border-gray-200 p-3 dark:border-gray-800">Period</th>
                  <th className="border border-gray-200 p-3 dark:border-gray-800">Ukupna cena</th>
                  <th className="border border-gray-200 p-3 text-center dark:border-gray-800">Detalji</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-gray-50 dark:hover:bg-white/[0.03]">
                  <td className="border border-gray-200 p-3 text-gray-700 dark:border-gray-800 dark:text-gray-300">
                    {formatDate(activeSpec.startDate)} —{" "}
                    {activeSpec.dischargeDate
                      ? formatDate(activeSpec.dischargeDate)
                      : activeSpec.endDate
                      ? formatDate(activeSpec.endDate)
                      : "Otvorena"}
                  </td>
                  <td className="border border-gray-200 p-3 text-gray-700 dark:border-gray-800 dark:text-gray-300">{(activeSpec.totalPrice ?? 0).toFixed(2)} RSD</td>
                  <td className="border border-gray-200 p-3 text-center dark:border-gray-800">
                    <Link to={`/specification-view/${activeSpec._id}`} className="text-brand-500 hover:underline">
                      Otvori
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="italic text-gray-500 dark:text-gray-400">Nema aktivne specifikacije.</p>
      )}

      {/* Istorija specifikacija */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-800 dark:text-white/90">Istorija specifikacija</h2>
        {!history || history.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Nema prethodnih specifikacija.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-theme-xs dark:border-gray-800">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-700 dark:bg-white/[0.03] dark:text-gray-300">
                <tr>
                  <th className="border border-gray-200 p-3 dark:border-gray-800">Period</th>
                  <th className="border border-gray-200 p-3 dark:border-gray-800">Ukupna cena</th>
                  <th className="border border-gray-200 p-3 text-center dark:border-gray-800">Detalji</th>
                </tr>
              </thead>
              <tbody>
                {history.map((spec: any) => (
                  <tr key={spec._id} className="hover:bg-gray-50 dark:hover:bg-white/[0.03]">
                    <td className="border border-gray-200 p-3 text-gray-700 dark:border-gray-800 dark:text-gray-300">
                      {formatDate(spec.startDate)} —{" "}
                      {spec.dischargeDate
                        ? formatDate(spec.dischargeDate)
                        : spec.endDate
                        ? formatDate(spec.endDate)
                        : "—"}
                    </td>
                    <td className="border border-gray-200 p-3 text-gray-700 dark:border-gray-800 dark:text-gray-300">{(spec.totalPrice ?? 0).toFixed(2)} RSD</td>
                    <td className="border border-gray-200 p-3 text-center dark:border-gray-800">
                      <Link to={`/specification-view/${spec._id}`} className="text-brand-500 hover:underline">
                        Otvori
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};