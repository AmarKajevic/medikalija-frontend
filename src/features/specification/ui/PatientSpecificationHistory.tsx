import { Link } from "react-router";
import { useSpecificationHistory } from "@features/specification/hooks/useSpecificationHistory";

export default function PatientSpecificationHistory({ patientId }: { patientId: string }) {
  const { data, isLoading, isError } = useSpecificationHistory(patientId);

  if (isLoading) return <p>Učitavanje istorije...</p>;
if (isError) return <p className="text-red-500">Greška pri učitavanju istorije.</p>;

if (!data) return <p>Nema dostupnih podataka.</p>;


const { activeSpec, history } = data;

  return (
    <div className="space-y-8">
      {/* Aktivna specifikacija */}
      {activeSpec ? (
        <div>
          <h2 className="mb-3 text-base font-semibold text-success-600 dark:text-success-500">
            Aktivna specifikacija
          </h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-success-50 text-xs uppercase text-gray-600 dark:bg-success-500/10 dark:text-gray-400">
                <tr>
                  <th className="p-3 font-medium">Period</th>
                  <th className="p-3 font-medium">Ukupna cena</th>
                  <th className="p-3 text-center font-medium">Detalji</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                <tr className="text-gray-700 dark:text-gray-300">
                  <td className="p-3">
                    {new Date(activeSpec.startDate).toLocaleDateString("sr-RS")} —{" "}
                    {activeSpec.dischargeDate
                      ? new Date(activeSpec.dischargeDate).toLocaleDateString("sr-RS")
                      : activeSpec.endDate
                      ? new Date(activeSpec.endDate).toLocaleDateString("sr-RS")
                      : "Otvorena"}
                  </td>
                  <td className="p-3">{(activeSpec.totalPrice ?? 0).toFixed(2)} RSD</td>
                  <td className="p-3 text-center">
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
        <h2 className="mb-3 text-base font-semibold text-gray-800 dark:text-white/90">
          Istorija specifikacija
        </h2>
        {(!history || history.length === 0) ? (
          <p className="text-gray-500 dark:text-gray-400">Nema prethodnih specifikacija.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-50 text-xs uppercase text-gray-600 dark:bg-white/[0.03] dark:text-gray-400">
                <tr>
                  <th className="p-3 font-medium">Period</th>
                  <th className="p-3 font-medium">Ukupna cena</th>
                  <th className="p-3 text-center font-medium">Detalji</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {history.map((s: any) => (
                  <tr key={s._id} className="text-gray-700 dark:text-gray-300">
                    <td className="p-3">
                      {new Date(s.startDate).toLocaleDateString("sr-RS")} —{" "}
                      {s.dischargeDate
                        ? new Date(s.dischargeDate).toLocaleDateString("sr-RS")
                        : s.endDate
                        ? new Date(s.endDate).toLocaleDateString("sr-RS")
                        : "—"}
                    </td>
                    <td className="p-3">{(s.totalPrice ?? 0).toFixed(2)} RSD</td>
                    <td className="p-3 text-center">
                      <Link to={`/specification-view/${s._id}`} className="text-brand-500 hover:underline">
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
}
