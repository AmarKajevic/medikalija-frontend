import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import ComponentCard from "../../components/common/ComponentCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Input from "../../components/form/input/InputField";

export default function MedicineReserveList() {
  const { token } = useAuth();
  const [reserve, setReserve] = useState<any[]>([]);
  const [returnAmounts, setReturnAmounts] = useState<Record<string, number>>(
    {}
  );
  const [loading, setLoading] = useState(false);

  // ✅ UČITAVANJE REZERVE
  const fetchReserve = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        "https://medikalija-api.vercel.app/api/medicine-reserve",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setReserve(res.data.reserve || []);
    } catch (err) {
      console.error("Greška pri učitavanju rezerve:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReserve();
  }, []);

  // ✅ BRISANJE IZ REZERVE
  const deleteReserve = async (id: string) => {
    if (!confirm("Obrisati lek iz rezerve?")) return;

    await axios.delete(
      `https://medikalija-api.vercel.app/api/medicine-reserve/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    fetchReserve();
  };

  // ✅ VRAĆANJE NAZAD U DOM / PORODICU
  const returnFromReserve = async (reserveId: string) => {
    const amount = returnAmounts[reserveId];
    if (!amount || amount <= 0)
      return alert("Unesi količinu za vraćanje!");

    await axios.post(
      "https://medikalija-api.vercel.app/api/medicine-reserve/return",
      { reserveId, amount },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setReturnAmounts((prev) => ({ ...prev, [reserveId]: 0 }));
    fetchReserve();
  };

  return (
    <ComponentCard title="REZERVA LEKOVA">
      <div className="overflow-x-auto">

        {loading ? (
          <p className="text-sm text-gray-500">Učitavanje rezerve...</p>
        ) : reserve.length === 0 ? (
          <p className="text-sm text-gray-500">Rezerva je prazna.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader>Lek</TableCell>
                <TableCell isHeader>Količina</TableCell>
                <TableCell isHeader>Izvor</TableCell>
                <TableCell isHeader>Cena</TableCell>
                <TableCell isHeader>Datum</TableCell>
                <TableCell isHeader>Vrati</TableCell>
                <TableCell isHeader>Akcija</TableCell>
              </TableRow>
            </TableHeader>

            <TableBody>
              {reserve.map((r) => (
                <TableRow key={r._id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">

                  {/* NAZIV */}
                  <TableCell className="font-medium">{r.name}</TableCell>

                  {/* KOLIČINA */}
                  <TableCell>
                    <span className="font-semibold text-blue-600">
                      {r.amount}
                    </span>{" "}
                    kom
                  </TableCell>

                  {/* IZVOR */}
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        r.source === "home"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {r.source === "home" ? "Dom" : "Porodica"}
                    </span>
                  </TableCell>

                  {/* CENA */}
                  <TableCell>
                    {r.pricePerUnit ? `${r.pricePerUnit} RSD` : "-"}
                  </TableCell>

                  {/* DATUM */}
                  <TableCell className="text-xs text-gray-500">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </TableCell>

                  {/* INPUT ZA VRAĆANJE */}
                  <TableCell className="w-32">
                    <Input
                      type="number"
                      placeholder="Količina"
                      value={returnAmounts[r._id] || ""}
                      onChange={(e) =>
                        setReturnAmounts({
                          ...returnAmounts,
                          [r._id]: Number(e.target.value),
                        })
                      }
                    />

                    <button
                      onClick={() => returnFromReserve(r._id)}
                      className="mt-2 w-full bg-green-600 hover:bg-green-700 text-white py-1 rounded text-xs"
                    >
                      Vrati nazad
                    </button>
                  </TableCell>

                  {/* BRISANJE */}
                  <TableCell>
                    <button
                      onClick={() => deleteReserve(r._id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs"
                    >
                      Obriši
                    </button>
                  </TableCell>

                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </ComponentCard>
  );
}
