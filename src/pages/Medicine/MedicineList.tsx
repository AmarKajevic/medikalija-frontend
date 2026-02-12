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
interface PatientMedicine {
  _id: string;
  quantity: number;
  medicine: {
    _id: string;
    name: string;
  };
}



interface Patient {
  _id: string;
  name: string;
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
  const [patientMedicines, setPatientMedicines] = useState<PatientMedicine[]>([]);


  const [loading, setLoading] = useState(true);
  const [localSearch, setLocalSearch] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const API = "https://medikalija-api.vercel.app/api";

  /* ================= FETCH DOM MEDICINES ================= */
  const fetchMedicines = async () => {
    try {
      const response = await axios.get(`${API}/medicine`, {
        headers: { Authorization: `Bearer ${token}` },
      });

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
      const response = await axios.get(`${API}/patient`, {
        headers: { Authorization: `Bearer ${token}` },
      });

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
      `${API}/medicine/patient/${patientId}/medicines`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("PATIENT MED RESPONSE:", response.data);

    if (response.data.success) {
      setPatientMedicines(response.data.patientStock || []);
    } else {
      setPatientMedicines([]);
    }
  } catch (error) {
    console.log(error);
    setPatientMedicines([]);
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
    `${p.name} ${p.lastName}`
      .toLowerCase()
      .includes(safePatientSearch)
  );

  return (
    <div className="space-y-10">

      {/* ================= DOM LEKOVI ================= */}
      <ComponentCard title="LEKOVI — MEDIKALIJA (DOM)">
        <div className="mb-4">
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Pretraži lek..."
            className="w-full max-w-md border-2 rounded px-3 py-2 bg-white"
          />
        </div>

        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader>Naziv</TableCell>
                <TableCell isHeader>Pakovanja</TableCell>
                <TableCell isHeader>Komada</TableCell>
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

      {/* ================= PACIJENT SEARCH ================= */}
      <ComponentCard title="PACIJENTI — LEKOVI OD PORODICE">
        <div className="relative max-w-md">
          <input
            type="text"
            value={patientSearch}
            onFocus={() => setShowDropdown(true)}
            onChange={(e) => {
              setPatientSearch(e.target.value);
              setShowDropdown(true);
            }}
            placeholder="Pretraži pacijenta..."
            className="w-full border-2 rounded px-3 py-2 bg-white"
          />

          {showDropdown && safePatientSearch && (
            <div className="absolute z-10 w-full bg-white border rounded mt-1 max-h-60 overflow-y-auto shadow">
              {filteredPatients.length > 0 ? (
                filteredPatients.map((p) => (
                  <div
                    key={p._id}
                    onClick={() => {
                      setSelectedPatient(p);
                      setPatientSearch(`${p.name} ${p.lastName}`);
                      setShowDropdown(false);
                      fetchPatientMedicines(p._id);
                    }}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {p.name} {p.lastName}
                  </div>
                ))
              ) : (
                <div className="p-2 text-gray-500">
                  Nema rezultata
                </div>
              )}
            </div>
          )}
        </div>
      </ComponentCard>

      {/* ================= LEKOVI PACIJENTA ================= */}
      {selectedPatient && (
        <ComponentCard
          title={`Lekovi pacijenta: ${selectedPatient.name} ${selectedPatient.lastName}`}
        >
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader>Naziv</TableCell>
                  <TableCell isHeader>Pakovanja</TableCell>
                  <TableCell isHeader>Komada</TableCell>
                  <TableCell isHeader>Izmeni</TableCell>
                  <TableCell isHeader>Obriši</TableCell>
                </TableRow>
              </TableHeader>

              <TableBody>
              {patientMedicines.map((m) => (
                <TableRow key={m._id}>
                  <TableCell>{m.medicine?.name}</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>{m.quantity}</TableCell>

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
                      mode="family"
                      onDeleted={() => fetchPatientMedicines(selectedPatient._id)}
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
