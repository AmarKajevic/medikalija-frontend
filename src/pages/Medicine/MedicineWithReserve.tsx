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

interface Medicine {
  _id: string;
  name: string;
  quantity: number;
  familyQuantity: number;
  pricePerUnit?: number;
}

interface Reserve {
  _id: string;
  name: string;
  amount: number;
  source: "home" | "family";
  pricePerUnit?: number;
  createdAt: string;
}

export default function MedicineWithReserve() {
  const { token } = useAuth();

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [reserve, setReserve] = useState<Reserve[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReserve, setShowReserve] = useState(false);
  const [moveValues, setMoveValues] = useState<Record<string, number>>({});

  // ================= FETCH MEDICINES =================
  const fetchMedicines = async () => {
    const res = await axios.get(
      "https://medikalija-api.vercel.app/api/medicine",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setMedicines(res.data.medicines || []);
  };

  // ================= FETCH RESERVE =================
  const fetchReserve = async () => {
    const res = await axios.get(
      "https://medikalija-api.vercel.app/api/medicine/reserve",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setReserve(res.data.reserve || []);
  };

  useEffect(() => {
    Promise.all([fetchMedicines(), fetchReserve()]).finally(() =>
      setLoading(false)
    );
  }, [token]);

  // ================= MOVE TO RESERVE =================
  const handleMove = async (
    medicineId: string,
    source: "home" | "family"
  ) => {
    const amount = moveValues[`${medicineId}-${source}`];

    if (!amount || amount <= 0)
      return alert("Unesite količinu za premeštanje!");

    await axios.post(
      "https://medikalija-api.vercel.app/api/medicine/move-to-reserve",
      { medicineId, amount, source },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setMoveValues((prev) => ({
      ...prev,
      [`${medicineId}-${source}`]: 0,
    }));

    fetchMedicines();
    fetchReserve();
  };

  if (loading) return <p>Učitavanje...</p>;

  const homeMedicines = medicines.filter((m) => m.quantity > 0);
  const familyMedicines = medicines.filter((m) => m.familyQuantity > 0);

  return (
    <div className="space-y-10">

      {/* ================= HOME MEDICINES ================= */}
      <ComponentCard title="LEKOVI — DOM">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell isHeader>Naziv</TableCell>
              <TableCell isHeader>Količina</TableCell>
              <TableCell isHeader>Cena</TableCell>
              <TableCell isHeader>Premesti</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {homeMedicines.map((m) => (
              <TableRow key={m._id}>
                <TableCell>{m.name}</TableCell>
                <TableCell>{m.quantity.toFixed(2)}</TableCell>
                <TableCell>{m.pricePerUnit ?? "-"} RSD</TableCell>
                <TableCell className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Količina"
                    className="border px-2 py-1 rounded w-24"
                    value={moveValues[`${m._id}-home`] || ""}
                    onChange={(e) =>
                      setMoveValues((p) => ({
                        ...p,
                        [`${m._id}-home`]: Number(e.target.value),
                      }))
                    }
                  />
                  <button
                    onClick={() => handleMove(m._id, "home")}
                    className="bg-blue-500 text-white px-3 py-1 rounded"
                  >
                    Premesti
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ComponentCard>

      {/* ================= FAMILY MEDICINES ================= */}
      <ComponentCard title="LEKOVI — PORODICA">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell isHeader>Naziv</TableCell>
              <TableCell isHeader>Količina</TableCell>
              <TableCell isHeader>Cena</TableCell>
              <TableCell isHeader>Premesti</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {familyMedicines.map((m) => (
              <TableRow key={m._id}>
                <TableCell>{m.name}</TableCell>
                <TableCell>{m.familyQuantity.toFixed(2)}</TableCell>
                <TableCell>{m.pricePerUnit ?? "-"} RSD</TableCell>
                <TableCell className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Količina"
                    className="border px-2 py-1 rounded w-24"
                    value={moveValues[`${m._id}-family`] || ""}
                    onChange={(e) =>
                      setMoveValues((p) => ({
                        ...p,
                        [`${m._id}-family`]: Number(e.target.value),
                      }))
                    }
                  />
                  <button
                    onClick={() => handleMove(m._id, "family")}
                    className="bg-amber-500 text-white px-3 py-1 rounded"
                  >
                    Premesti
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ComponentCard>

      {/* ================= TOGGLE RESERVE ================= */}
      <div className="text-center">
        <button
          onClick={() => setShowReserve((p) => !p)}
          className="bg-gray-900 text-white px-6 py-2 rounded"
        >
          {showReserve ? "Zatvori rezervu" : "Pogledaj rezervu"}
        </button>
      </div>

      {/* ================= RESERVE TABLE ================= */}
      {showReserve && (
        <ComponentCard title="REZERVA LEKOVA">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader>Naziv</TableCell>
                <TableCell isHeader>Količina</TableCell>
                <TableCell isHeader>Izvor</TableCell>
                <TableCell isHeader>Cena</TableCell>
                <TableCell isHeader>Datum</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reserve.map((r) => (
                <TableRow key={r._id}>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>{r.amount}</TableCell>
                  <TableCell>
                    {r.source === "home" ? "DOM" : "PORODICA"}
                  </TableCell>
                  <TableCell>{r.pricePerUnit ?? "-"} RSD</TableCell>
                  <TableCell>
                    {new Date(r.createdAt).toLocaleDateString("sr-RS")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ComponentCard>
      )}
    </div>
  );
}
