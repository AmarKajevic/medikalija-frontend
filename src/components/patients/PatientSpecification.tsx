import { Link } from "react-router";
import { useState } from "react";
import axios from "axios";
import { usePatientSpecification } from "../../hooks/Patient/usePatientSpecification";
import { useAuth } from "../../context/authContext";

export default function PatientSpecification({ patientId }: { patientId: string }) {
  const { data, isLoading, isError, refetch } = usePatientSpecification(patientId);
  const { token } = useAuth();

  // ⭐ lokalni state za nova polja
  const [lodgingPrice, setLodgingPrice] = useState<number>(0);
  const [extraCostAmount, setExtraCostAmount] = useState<number>(0);
  const [extraCostLabel, setExtraCostLabel] = useState<string>("");

  if (isLoading) return <p>Učitavanje...</p>;
  if (isError) return <p>Greška pri učitavanju specifikacije.</p>;
  if (!data) return <p>Nema aktivne specifikacije.</p>;

  // ⭐ FUNKCIJA ZA SLANJE TROŠKOVA
  const addCosts = async () => {
    try {
      await axios.post(
        `http://localhost:5000/api/specification/${data._id}/add-costs`, // ✅ ispravljeno
        { lodgingPrice, extraCostAmount, extraCostLabel },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await refetch(); // ✅ osveži podatke nakon unosa

      // reset input polja
      setLodgingPrice(0);
      setExtraCostAmount(0);
      setExtraCostLabel("");

    } catch (err) {
      console.error("Greška pri dodavanju troškova:", err);
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

      {/* ==== GLAVNA POSTOJEĆA TABELA ==== */}
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Opis</th>
            <th className="border p-2 text-right">Količina</th>
            <th className="border p-2 text-right">Cena (RSD)</th>
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
            </tr>
          ))}

          <tr className="font-semibold bg-gray-50">
            <td></td>
            <td className="border p-2 text-right">Ukupno:</td>
            <td className="border p-2 text-right">
              {data.totalPrice?.toFixed(2)} RSD
            </td>
          </tr>
        </tbody>
      </table>

      {/* ✅ DRUGA TABELA — DODATNI TROŠKOVI */}
      <h3 className="text-lg font-semibold mt-6 mb-2">Dodaj troškove</h3>

      <table className="w-full border-collapse border border-gray-300 mb-4">
        <tbody>

          <tr>
            <td className="border p-2 font-medium">Cena smeštaja</td>
            <td className="border p-2 text-right">
              <input
                type="number"
                value={lodgingPrice}
                onChange={(e) => setLodgingPrice(Number(e.target.value))}
                className="border rounded p-1 w-32 text-right"
              />
            </td>
          </tr>

          <tr>
            <td className="border p-2 font-medium">Dodatni trošak — opis</td>
            <td className="border p-2 text-right">
              <input
                type="text"
                value={extraCostLabel}
                onChange={(e) => setExtraCostLabel(e.target.value)}
                className="border rounded p-1 w-48"
                placeholder="npr. Pranje veša"
              />
            </td>
          </tr>

          <tr>
            <td className="border p-2 font-medium">Dodatni trošak — iznos</td>
            <td className="border p-2 text-right">
              <input
                type="number"
                value={extraCostAmount}
                onChange={(e) => setExtraCostAmount(Number(e.target.value))}
                className="border rounded p-1 w-32 text-right"
              />
            </td>
          </tr>

        </tbody>
      </table>
          <div className="flex justify-end">
          <button 
            onClick={addCosts}
            className="f bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Dodaj troškove
          </button>
          </div>
      

    </div>
  );
}
