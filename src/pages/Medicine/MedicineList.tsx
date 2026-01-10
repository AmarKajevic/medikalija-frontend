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

interface MedicineListProps {
  search?: string; // search iz Header-a (postojeće)
}

export default function MedicineList({ search }: MedicineListProps) {
  const { token } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ NOVO: lokalni search (NIŠTA DRUGO)
  const [localSearch, setLocalSearch] = useState("");

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

  // postojeći search iz Header-a + novi lokalni
  const safeHeaderSearch = search?.toLowerCase() ?? "";
  const safeLocalSearch = localSearch.toLowerCase();

  const filteredMedicines = medicines.filter((m) =>
    m.name.toLowerCase().includes(safeHeaderSearch) &&
    m.name.toLowerCase().includes(safeLocalSearch)
  );

  const familyMedicines = filteredMedicines.filter(
    (m) => m.familyQuantity > 0
  );

  return (
    <div className="space-y-10">

      {/* ✅ SEARCH BAR (NOVO – ne dira dizajn) */}
      <div className="mb-4">
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Pretraži lek..."
          className="w-full max-w-md border rounded px-3 py-2"
        />
      </div>

      {/* DOM LEKOVI */}
      <ComponentCard title="LEKOVI — MEDIKALIJA (DOM)">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader>Naziv</TableCell>
                <TableCell isHeader>Pakovanja</TableCell>
                <TableCell isHeader>Tableta / pak.</TableCell>
                <TableCell isHeader>Komada ukupno</TableCell>
                <TableCell isHeader>Cena po komadu</TableCell>
                <TableCell isHeader>Izmeni</TableCell>
                <TableCell isHeader>Obriši</TableCell>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredMedicines.map((m) => (
                <TableRow key={m._id}>
                  <TableCell>{m.name}</TableCell>
                  <TableCell>{m.packageCount ?? 0}</TableCell>
                  <TableCell>{m.unitsPerPackage ?? "-"}</TableCell>
                  <TableCell>{m.quantity.toFixed(2)}</TableCell>
                  <TableCell>
                    {m.pricePerUnit ? `${m.pricePerUnit} RSD` : "-"}
                  </TableCell>
                  <TableCell>
                    <EditMedicine
                      medicineId={m._id}
                      onUpdated={fetchMedicines}
                    />
                  </TableCell>
                  <TableCell>
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

      {/* FAMILY LEKOVI */}
      {familyMedicines.length > 0 && (
        <ComponentCard title="LEKOVI OD PORODICE">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader>Naziv</TableCell>
                  <TableCell isHeader>Pakovanja</TableCell>
                  <TableCell isHeader>Tableta / pak.</TableCell>
                  <TableCell isHeader>Ukupno komada</TableCell>
                  <TableCell isHeader>Dodaj</TableCell>
                  <TableCell isHeader>Obriši</TableCell>
                </TableRow>
              </TableHeader>

              <TableBody>
                {familyMedicines.map((m) => (
                  <TableRow key={m._id}>
                    <TableCell>{m.name}</TableCell>
                    <TableCell>{m.familyPackageCount ?? 0}</TableCell>
                    <TableCell>{m.unitsPerPackage ?? "-"}</TableCell>
                    <TableCell>{m.familyQuantity}</TableCell>
                    <TableCell>
                      <EditMedicine
                        medicineId={m._id}
                        mode="family"
                        onUpdated={fetchMedicines}
                      />
                    </TableCell>
                    <TableCell>
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
