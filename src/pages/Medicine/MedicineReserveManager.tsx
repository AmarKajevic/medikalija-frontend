import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import ComponentCard from "../../components/common/ComponentCard";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import Input from "../../components/form/input/InputField";

interface Medicine {
  _id: string;
  name: string;
  quantity: number;
  familyQuantity: number;
  pricePerUnit: number;
}

export default function MedicineReserveManager() {
  const { token } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [amounts, setAmounts] = useState<Record<string, number>>({});

  const fetchMedicines = async () => {
    const res = await axios.get(
      "https://medikalija-api.vercel.app/api/medicine",
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setMedicines(res.data.medicines || []);
  };

  const moveToReserve = async (medicineId: string, source: "home" | "family") => {
    const amount = amounts[medicineId];
    if (!amount || amount <= 0) return alert("Unesi količinu!");

    await axios.post(
      "https://medikalija-api.vercel.app/api/medicine-reserve/move",
      { medicineId, amount, source },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setAmounts((prev) => ({ ...prev, [medicineId]: 0 }));
    fetchMedicines();
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  return (
    <div className="space-y-10">
      <ComponentCard title="PRENOS LEKOVA U REZERVU">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader>Naziv</TableCell>
                <TableCell isHeader>Dom</TableCell>
                <TableCell isHeader>Porodica</TableCell>
                <TableCell isHeader>Količina</TableCell>
                <TableCell isHeader>Akcija</TableCell>
              </TableRow>
            </TableHeader>

            <TableBody>
              {medicines.map((m) => (
                <TableRow key={m._id}>
                  <TableCell>{m.name}</TableCell>
                  <TableCell>{m.quantity}</TableCell>
                  <TableCell>{m.familyQuantity}</TableCell>

                  <TableCell>
                    <Input
                      type="number"
                      placeholder="Količina"
                      value={amounts[m._id] || ""}
                      onChange={(e) =>
                        setAmounts({ ...amounts, [m._id]: Number(e.target.value) })
                      }
                    />
                  </TableCell>

                  <TableCell className="flex gap-2">
                    <button
                      onClick={() => moveToReserve(m._id, "home")}
                      className="bg-blue-600 text-white px-3 py-1 rounded"
                    >
                      Dom → Rezerva
                    </button>

                    <button
                      onClick={() => moveToReserve(m._id, "family")}
                      className="bg-green-600 text-white px-3 py-1 rounded"
                    >
                      Porodica → Rezerva
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ComponentCard>
    </div>
  );
}
