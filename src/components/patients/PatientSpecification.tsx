import { Link } from "react-router";
import axios from "axios";
import { usePatientSpecification } from "../../hooks/Patient/usePatientSpecification";
import { useAuth } from "../../context/AuthContext";

export default function PatientSpecification({ patientId }: { patientId: string }) {
  const { token } = useAuth();
  const { data, isLoading, isError, refetch } = usePatientSpecification(patientId);

  if (isLoading) return <p>Učitavanje...</p>;
  if (isError) return <p>Greška pri učitavanju specifikacije.</p>;
  if (!data) return <p>Nema aktivne specifikacije.</p>;

  // ✅ BRISANJE STAVKE
  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Da li ste sigurni da želite da obrišete ovu stavku?")) return;

    try {
      await axios.delete(
        `https://medikalija-api.vercel.app/api/specification/${data._id}/item/${itemId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      refetch(); // ✅ REFRESH TABELE
    } catch (err) {
      console.error("Greška pri brisanju:", err);
      alert("Greška pri brisanju stavke");
    }
  };

  return (
    <div className="p-4">

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Specifikacija</h2>

        <Link
          to={`/patient/${patientId}/specification-history`}
          className="text-blue-600 hover:underline"
        >
          Pogledaj istoriju
        </Link>
      </div>

      {/* ==== TABELA ==== */}
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Opis</th>
            <th className="border p-2 text-right">Količina</th>
            <th className="border p-2 text-right">Cena (RSD)</th>
            <th className="border p-2 text-center">Akcija</th>
          </tr>
        </thead>

        <tbody>
          {data.items.map((item: any) => (
            <tr key={item._id}>
              <td className="border p-2">{item.formattedName}</td>
              <td className="border p-2 text-right">
                {Number(item.formattedQuantity).toFixed(2)}
              </td>
              <td className="border p-2 text-right">
                {item.price.toFixed(2)}
              </td>
              <td className="border p-2 text-center">
                <button
                  onClick={() => handleDeleteItem(item._id)}
                  className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded"
                >
                  ❌ Obriši
                </button>
              </td>
            </tr>
          ))}

          <tr className="font-semibold bg-gray-50">
            <td></td>
            <td className="border p-2 text-right">Ukupno:</td>
            <td className="border p-2 text-right">
              {data.totalPrice?.toFixed(2)} RSD
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
