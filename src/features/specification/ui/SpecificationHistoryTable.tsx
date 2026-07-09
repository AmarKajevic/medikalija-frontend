// ui/SpecificationHistoryTable.tsx
import { Link } from "react-router";
import { useSpecificationHistory } from "../hooks/useSpecificationHistory";
import { formatDate } from "../lib/helpers";

interface SpecificationHistoryTableProps {
  patientId: string;
}

export const SpecificationHistoryTable = ({ patientId }: SpecificationHistoryTableProps) => {
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
          <h2 className="text-lg font-semibold mb-3 text-green-700">Aktivna specifikacija</h2>
          <div className="overflow-x-auto shadow border border-gray-200 rounded-lg">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-green-50 text-gray-700">
                <tr>
                  <th className="p-3 border">Period</th>
                  <th className="p-3 border">Ukupna cena</th>
                  <th className="p-3 border text-center">Detalji</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-gray-50">
                  <td className="p-3 border">
                    {formatDate(activeSpec.startDate)} —{" "}
                    {activeSpec.dischargeDate
                      ? formatDate(activeSpec.dischargeDate)
                      : activeSpec.endDate
                      ? formatDate(activeSpec.endDate)
                      : "Otvorena"}
                  </td>
                  <td className="p-3 border">{(activeSpec.totalPrice ?? 0).toFixed(2)} RSD</td>
                  <td className="p-3 border text-center">
                    <Link to={`/specification-view/${activeSpec._id}`} className="text-blue-600 hover:underline">
                      Otvori
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="text-gray-600 italic">Nema aktivne specifikacije.</p>
      )}

      {/* Istorija specifikacija */}
      <div>
        <h2 className="text-lg font-semibold mb-3 text-gray-800">Istorija specifikacija</h2>
        {!history || history.length === 0 ? (
          <p>Nema prethodnih specifikacija.</p>
        ) : (
          <div className="overflow-x-auto shadow border border-gray-200 rounded-lg">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-3 border">Period</th>
                  <th className="p-3 border">Ukupna cena</th>
                  <th className="p-3 border text-center">Detalji</th>
                </tr>
              </thead>
              <tbody>
                {history.map((spec: any) => (
                  <tr key={spec._id} className="hover:bg-gray-50">
                    <td className="p-3 border">
                      {formatDate(spec.startDate)} —{" "}
                      {spec.dischargeDate
                        ? formatDate(spec.dischargeDate)
                        : spec.endDate
                        ? formatDate(spec.endDate)
                        : "—"}
                    </td>
                    <td className="p-3 border">{(spec.totalPrice ?? 0).toFixed(2)} RSD</td>
                    <td className="p-3 border text-center">
                      <Link to={`/specification-view/${spec._id}`} className="text-blue-600 hover:underline">
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