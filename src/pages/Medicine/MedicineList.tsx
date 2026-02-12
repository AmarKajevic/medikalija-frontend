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

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
}

interface MedicineListProps {
  search?: string;
}

export default function MedicineList({ search }: MedicineListProps) {
  const { token } = useAuth();

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientMedicines, setPatientMedicines] = useState<Medicine[]>([]);

  const [loading, setLoading] = useState(true);
  const [localSearch, setLocalSearch] = useState("");
  const [patientSearch, setPatientSearch] = useState("");

  /* ================= FETCH DOM MEDICINES ================= */
  const fetchMedicines = async () => {
    try {
      const response = await axios.get(
        "https://medikalija-api.vercel.app/api/medicine",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setMedicines(response.data.medicines);
      }
    } catch (error) {
      console.log(error);
    }
  };

  /* ================= FETCH PATIENTS ================= */
  const fetchPatients = async () => {
    try {
      const response = await axios.get(
        "https://medikalija-api.vercel.app/api/patient",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setPatients(response.data.patients);
      }
    } catch (error) {
      console.log(error);
    }
  };

  /* ================= FETCH PATIENT MEDICINES ================= */
  const fetchPatientMedicines = async (patientId: string) => {
    try {
      const response = await axios.get(
        `https://medikalija-api.vercel.app/api/patient/${patientId}/medicines`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setPatientMedicines(response.data.medicines);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchMedicines();
      await fetchPatients();
      setLoading(false);
    };
    loadData();
  }, [token]);

  if (loading) return <p>Učitavanje...</p>;

  /* ================= SEARCH FILTERS ================= */
  const safeHeaderSearch = search?.toLowerCase() ?? "";
  const safeLocalSearch = localSearch.toLowerCase();
  const safePatientSearch = patientSearch.toLowerCase();

  const filteredMedicines = medicines.filter(
    (m) =>
      m.name.toLowerCase().includes(safeHeaderSearch) &&
      m.name.toLowerCase().includes(safeLocalSearch)
  );

  const filteredPatients = patients.filter((p) =>
    `${p.firstName} ${p.lastName}`
      .toLowerCase()
      .includes(safePatientSearch)
  );

  return (
    <div className="space-y-10">
      {/* ================= DOM LEKOVI ================= */}
      <div className="mb-4">
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Pretraži lek..."
          className="w-full max-w-md border-2 rounded px-3 py-2 bg-white"
        />
      </div>

      <ComponentCard title="LEKOVI — MEDIKALIJA (DOM)">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader>Naziv</TableCell>
                <TableCell isHeader>Pakovanja</TableCell>
                <TableCell isHeader>Tableta / pak.</TableCell>
                <TableCell isHeader>Komada ukupno</TableCell>
                <TableCell isHeader>Cena</TableCell>
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
                  <TableCell>{m.quantity}</TableCell>
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

      {/* ================= PACIJENTI ================= */}
      <ComponentCard title="PACIJENTI — LEKOVI OD PORODICE">
        <div className="mb-4">
          <input
            type="text"
            value={patientSearch}
            onChange={(e) => setPatientSearch(e.target.value)}
            placeholder="Pretraži pacijenta..."
            className="w-full max-w-md border-2 rounded px-3 py-2 bg-white"
          />
        </div>

        <div className="space-y-2">
          {filteredPatients.map((p) => (
            <div
              key={p._id}
              onClick={() => {
                setSelectedPatient(p);
                fetchPatientMedicines(p._id);
              }}
              className="cursor-pointer p-3 border rounded hover:bg-gray-100"
            >
              {p.firstName} {p.lastName}
            </div>
          ))}
        </div>
      </ComponentCard>

      {/* ================= TABELA LEKOVA PACIJENTA ================= */}
      {selectedPatient && (
        <ComponentCard
          title={`Lekovi pacijenta: ${selectedPatient.firstName} ${selectedPatient.lastName}`}
        >
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader>Naziv</TableCell>
                  <TableCell isHeader>Pakovanja</TableCell>
                  <TableCell isHeader>Tableta / pak.</TableCell>
                  <TableCell isHeader>Ukupno komada</TableCell>
                  <TableCell isHeader>Izmeni</TableCell>
                  <TableCell isHeader>Obriši</TableCell>
                </TableRow>
              </TableHeader>

              <TableBody>
                {patientMedicines.map((m) => (
                  <TableRow key={m._id}>
                    <TableCell>{m.name}</TableCell>
                    <TableCell>{m.familyPackageCount ?? 0}</TableCell>
                    <TableCell>{m.unitsPerPackage ?? "-"}</TableCell>
                    <TableCell>{m.familyQuantity}</TableCell>
                    <TableCell>
                      <EditMedicine
                        medicineId={m._id}
                        mode="family"
                        onUpdated={() =>
                          fetchPatientMedicines(selectedPatient._id)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <DeleteMedicine
                        medicineId={m._id}
                        onDeleted={() =>
                          fetchPatientMedicines(selectedPatient._id)
                        }
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
