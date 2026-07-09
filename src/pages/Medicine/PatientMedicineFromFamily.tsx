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

interface Patient {
  _id: string;
  name: string;
  lastName: string;
}

interface PatientMedicine {
  _id: string;
  quantity: number;
  medicine: {
    _id: string;
    name: string;
  };
}

export default function PatientMedicineFromFamily() {
  const { token } = useAuth();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientMedicines, setPatientMedicines] = useState<
    Record<string, PatientMedicine[]>
  >({});
  const [expandedPatientId, setExpandedPatientId] = useState<string | null>(
    null
  );
  const [transferAmounts, setTransferAmounts] = useState<Record<string, number>>({});


  const [patientSearch, setPatientSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const API = "https://medikalija-api.vercel.app/api";

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

  /* ================= FETCH MEDICINES FOR ONE PATIENT ================= */
  const fetchPatientMedicines = async (patientId: string) => {
    try {
      const response = await axios.get(
        `${API}/medicine/patient/${patientId}/medicines`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setPatientMedicines((prev) => ({
          ...prev,
          [patientId]: response.data.patientStock || [],
        }));
      } else {
        setPatientMedicines((prev) => ({
          ...prev,
          [patientId]: [],
        }));
      }
    } catch (error) {
      console.log(error);
      setPatientMedicines((prev) => ({
        ...prev,
        [patientId]: [],
      }));
    }
  };
const transferToReserve = async (
  patientMedicineId: string,
  patientId: string,
  maxQuantity: number
) => {
  const amount = transferAmounts[patientMedicineId];

  if (!amount || amount <= 0) {
    return alert("Unesi količinu za prebacivanje!");
  }

  if (amount > maxQuantity) {
    return alert("Nema dovoljno leka kod pacijenta!");
  }

  try {
    await axios.post(
      `${API}/medicine-reserve/move`,
      {
        medicineId: patientMedicineId, // 🔥 mora da se zove medicineId
        amount,
        source: "family",
        patientId, // 🔥 OBAVEZNO
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    setTransferAmounts((prev) => ({
      ...prev,
      [patientMedicineId]: 0,
    }));

    await fetchPatientMedicines(patientId);

  } catch (err: any) {
    console.error("Greška:", err.response?.data);
    alert(err.response?.data?.message || "Greška pri prebacivanju");
  }
};



  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchPatients();
      setLoading(false);
    };

    loadData();
  }, [token]);

  if (loading) return <p>Učitavanje...</p>;

  /* ================= SEARCH ================= */
  const filteredPatients = patients.filter((p) =>
    `${p.name} ${p.lastName}`
      .toLowerCase()
      .includes(patientSearch.toLowerCase())
  );

  /* ================= TOGGLE ================= */
  const togglePatient = async (patientId: string) => {
    if (expandedPatientId === patientId) {
      setExpandedPatientId(null);
      return;
    }

    setExpandedPatientId(patientId);

    if (!patientMedicines[patientId]) {
      await fetchPatientMedicines(patientId);
    }
  };

  return (
    <ComponentCard title="PACIJENTI — LEKOVI OD PORODICE">
      {/* SEARCH */}
      <div className="mb-6 max-w-md">
        <input
          type="text"
          value={patientSearch}
          onChange={(e) => setPatientSearch(e.target.value)}
          placeholder="Pretraži pacijenta..."
          className="w-full border-2 rounded px-3 py-2 bg-white"
        />
      </div>

      {/* LISTA PACIJENATA */}
      <div className="space-y-4">
        {filteredPatients.map((patient) => (
          <div
            key={patient._id}
            className="border rounded-lg overflow-hidden"
          >
            {/* HEADER PACIJENTA */}
            <div
              onClick={() => togglePatient(patient._id)}
              className="p-4 bg-gray-100 cursor-pointer hover:bg-gray-200 font-semibold flex justify-between"
            >
              <span>
                {patient.name} {patient.lastName}
              </span>
              <span>
                {expandedPatientId === patient._id ? "▲" : "▼"}
              </span>
            </div>

            {/* LEKOVI ISPOD PACIJENTA */}
            {expandedPatientId === patient._id && (
              <div className="p-4 bg-white">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell isHeader>Naziv</TableCell>
                      <TableCell isHeader>Količina</TableCell>
                      <TableCell isHeader>Izmeni</TableCell>
                      <TableCell isHeader>Obriši</TableCell>
                      <TableCell isHeader>Rezerva</TableCell>

                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {(patientMedicines[patient._id] || []).length > 0 ? (
                      patientMedicines[patient._id].map((m) => (
                        <TableRow key={m._id}>
                          <TableCell>
                            {m.medicine?.name}
                          </TableCell>

                          <TableCell>{m.quantity}</TableCell>

                          <TableCell>
                            <EditMedicine
                              medicineId={m._id}
                              mode="family"
                              onUpdated={() =>
                                fetchPatientMedicines(patient._id)
                              }
                            />
                          </TableCell>

                          <TableCell>
                            <DeleteMedicine
                              medicineId={m._id}
                              mode="family"
                              onDeleted={() =>
                                fetchPatientMedicines(patient._id)
                              }
                            />
                          </TableCell>
                        <TableCell className="w-40">
                        <input
                            type="number"
                            placeholder="Količina"
                            value={transferAmounts[m._id] || ""}
                            onChange={(e) =>
                            setTransferAmounts({
                                ...transferAmounts,
                                [m._id]: Number(e.target.value),
                            })
                            }
                            className="w-full border rounded px-2 py-1 text-sm"
                        />

                        <button
                            onClick={() =>
                            transferToReserve(m._id, patient._id,m.quantity)
                            }
                            className="mt-2 w-full bg-yellow-600 hover:bg-yellow-700 text-white py-1 rounded text-xs"
                        >
                            Prebaci u rezervu
                        </button>
                        </TableCell>

                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell >
                          Nema lekova za ovog pacijenta
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        ))}
      </div>
    </ComponentCard>
  );
}
