import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import EditMedicine from "./EditMedicine";
import DeleteMedicine from "./DeleteMedicine";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import ComponentCard from "../../components/common/ComponentCard";

interface Medicine {
  _id: string;
  name: string;
  quantity: number;
  familyQuantity: number;
  pricePerUnit: number;
  unitsPerPackage?: number;
  packageCount?: number;
  familyPackageCount?: number;
}

export default function MedicineList() {
  const { token } = useAuth();

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔍 search
  const [query, setQuery] = useState("");

  // ✏️ aktivni lek za edit
  const [activeMedicineId, setActiveMedicineId] = useState<string | null>(null);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "https://medikalija-api.vercel.app/api/medicine",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.success) {
        setMedicines(response.data.medicines);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, [token]);

  if (loading) return <p>Učitavanje lekova...</p>;

  const normalizedQuery = query.trim().toLowerCase();

  const filteredMedicines = medicines.filter((m) =>
    m.name.toLowerCase().includes(normalizedQuery)
  );

  const familyMedicines = filteredMedicines.filter(
    (m) => m.familyQuantity > 0
  );

  return (
    <div className="space-y-10">

      {/* SEARCH BAR */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Pretraži lek (npr. Aspirin)"
          className="w-full sm:max-w-md border rounded px-3 py-2"
        />
        <span className="text-sm text-gray-500">
          Pronađeno: {filteredMedicines.length}
        </span>
      </div>

      {/* DOM LEKOVI */}
      <ComponentCard title="LEKOVI — MEDIKALIJA (DOM)">
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader>Naziv</TableCell>
                <TableCell isHeader>Pakovanja</TableCell>
                <TableCell isHeader>Tbl / pak.</TableCell>
                <TableCell isHeader>Ukupno</TableCell>
                <TableCell isHeader>Cena</TableCell>
                <TableCell isHeader>Akcije</TableCell>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredMedicines.map((m) => (
                <>
              <TableRow key={m._id} className="hover:bg-gray-50">
                  <TableCell>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveMedicineId(prev =>
                          prev === m._id ? null : m._id
                        )
                      }
                      className="text-left w-full cursor-pointer font-medium hover:underline"
                    >
                      {m.name}
                    </button>
                  </TableCell>

                <TableCell>{m.packageCount ?? 0}</TableCell>
                <TableCell>{m.unitsPerPackage ?? "-"}</TableCell>
                <TableCell>{m.quantity.toFixed(2)}</TableCell>
                <TableCell>
                  {m.pricePerUnit ? `${m.pricePerUnit} RSD` : "-"}
                </TableCell>
                <TableCell>
                  <DeleteMedicine
                    medicineId={m._id}
                    onDeleted={fetchMedicines}
                  />
                </TableCell>
              </TableRow>


                  {/* EDIT PANEL */}
                      {activeMedicineId === m._id && (
                        <TableRow>
                          <td colSpan={6} className="p-4">
                            <div className="bg-gray-50 border rounded p-4">
                              <EditMedicine
                                medicineId={m._id}
                                pricePerUnit={m.pricePerUnit}
                                quantity={m.quantity}
                                onUpdated={() => {
                                  fetchMedicines();
                                  setActiveMedicineId(null);
                                }}
                              />
                            </div>
                          </td>
                        </TableRow>
                      )}
                  
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      </ComponentCard>

      {/* FAMILY LEKOVI */}
      {familyMedicines.length > 0 && (
        <ComponentCard title="LEKOVI OD PORODICE">
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader>Naziv</TableCell>
                  <TableCell isHeader>Pakovanja</TableCell>
                  <TableCell isHeader>Tbl / pak.</TableCell>
                  <TableCell isHeader>Ukupno</TableCell>
                  <TableCell isHeader>Akcije</TableCell>
                </TableRow>
              </TableHeader>

              <TableBody>
                {familyMedicines.map((m) => (
                  <TableRow key={m._id}>
                    <TableCell>{m.name}</TableCell>
                    <TableCell>{m.familyPackageCount ?? 0}</TableCell>
                    <TableCell>{m.unitsPerPackage ?? "-"}</TableCell>
                    <TableCell>{m.familyQuantity}</TableCell>
                    <TableCell className="flex gap-2 flex-wrap">
                      <EditMedicine
                        medicineId={m._id}
                        mode="family"
                        onUpdated={fetchMedicines}
                      />
                      <DeleteMedicine
                        medicineId={m._id}
                        onDeleted={fetchMedicines}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ComponentCard>
      )}
    </div>
  );
}
