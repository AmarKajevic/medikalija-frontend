// pages/Medicine/MedicineList.tsx
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

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/api/medicine", {
        headers: { Authorization: `Bearer ${token}` },
      });
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

  const familyMedicines = medicines.filter(
    (m) => m.familyQuantity > 0
  );

  return (
    <div className="space-y-10">

      {/* 🔵 TABELA DOM LEKOVA */}
      <ComponentCard title="LEKOVI — MEDIKALIJA (DOM)">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-large text-gray-500 text-start text-theme-xs dark:text-gray-400">Naziv</TableCell>
                <TableCell isHeader className="px-5 py-3 font-large text-gray-500 text-start text-theme-xs dark:text-gray-400">Pakovanja</TableCell>
                <TableCell isHeader className="px-5 py-3 font-large text-gray-500 text-start text-theme-xs dark:text-gray-400">Tableta / pak.</TableCell>
                <TableCell isHeader className="px-5 py-3 font-large text-gray-500 text-start text-theme-xs dark:text-gray-400">Komada ukupno</TableCell>
                <TableCell isHeader className="px-5 py-3 font-large text-gray-500 text-start text-theme-xs dark:text-gray-400">Cena po komadu</TableCell>

                <TableCell isHeader className="px-5 py-3 font-large text-gray-500 text-start text-theme-xs dark:text-gray-400">Izmeni</TableCell>
                <TableCell isHeader className="px-5 py-3 font-large text-gray-500 text-start text-theme-xs dark:text-gray-400">Obriši</TableCell>
              </TableRow>
            </TableHeader>

            <TableBody>
              {medicines.map((m) => {

                return (
                  <TableRow key={m._id}>
                    <TableCell className="px-5 py-4 sm:px-6 text-start">{m.name}</TableCell>

                    <TableCell className="px-5 py-4 sm:px-6 text-start">{m.packageCount ?? 0}</TableCell>

                    <TableCell className="px-5 py-4 sm:px-6 text-start">{m.unitsPerPackage ?? "-"}</TableCell>

                    <TableCell className="px-5 py-4 sm:px-6 text-start">{m.quantity.toFixed(2)}</TableCell>

                    <TableCell className="px-5 py-4 sm:px-6 text-start">
                      {m.pricePerUnit ? `${m.pricePerUnit} RSD` : "-"}
                    </TableCell>


                    <TableCell className="px-5 py-4 sm:px-6 text-start">
                      <EditMedicine
                        medicineId={m._id}
                        onUpdated={fetchMedicines}
                      />
                    </TableCell>

                    <TableCell className="px-5 py-4 sm:px-6 text-start">
                      <DeleteMedicine
                        medicineId={m._id}
                        onDeleted={fetchMedicines}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </ComponentCard>

      {/* 🟡 TABELA LEKOVA OD PORODICE */}
      {familyMedicines.length > 0 && (
        <ComponentCard title="LEKOVI OD PORODICE">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 font-large text-gray-500 text-start text-theme-xs dark:text-gray-400">Naziv</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-large text-gray-500 text-start text-theme-xs dark:text-gray-400">Pakovanja</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-large text-gray-500 text-start text-theme-xs dark:text-gray-400">Tableta / pak.</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-large text-gray-500 text-start text-theme-xs dark:text-gray-400">Ukupno komada</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-large text-gray-500 text-start text-theme-xs dark:text-gray-400">Dodaj</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-large text-gray-500 text-start text-theme-xs dark:text-gray-400">Obriši</TableCell>
                </TableRow>
              </TableHeader>

              <TableBody>
                {familyMedicines.map((m) => (
                  <TableRow key={m._id}>
                    <TableCell className="px-5 py-4 sm:px-6 text-start">{m.name}</TableCell>

                    <TableCell className="px-5 py-4 sm:px-6 text-start">{m.familyPackageCount ?? 0}</TableCell>

                    <TableCell className="px-5 py-4 sm:px-6 text-start">{m.unitsPerPackage ?? "-"}</TableCell>

                    <TableCell className="px-5 py-4 sm:px-6 text-start">{m.familyQuantity}</TableCell>

                    <TableCell className="px-5 py-4 sm:px-6 text-start">
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
