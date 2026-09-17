import { useEffect, useState } from "react";
import { api } from "@shared/api/api";
import EditMedicine from "@pages/Medicine/EditMedicine";
import DeleteMedicine from "@pages/Medicine/DeleteMedicine";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@shared/ui/table/index";
import ComponentCard from "@shared/ui/common/ComponentCard";

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

  /* ================= FETCH PATIENTS ================= */
  const fetchPatients = async () => {
    try {
      const response = await api.get("/api/patient");

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
      const response = await api.get(`/api/medicine/patient/${patientId}/medicines`);

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
    await api.post("/api/medicine-reserve/move", {
      medicineId: patientMedicineId, // 🔥 mora da se zove medicineId
      amount,
      source: "family",
      patientId, // 🔥 OBAVEZNO
    });

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
  }, []);

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
          className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
        />
      </div>

      {/* LISTA PACIJENATA */}
      <div className="space-y-4">
        {filteredPatients.map((patient) => (
          <div
            key={patient._id}
            className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800"
          >
            {/* HEADER PACIJENTA */}
            <div
              onClick={() => togglePatient(patient._id)}
              className="flex cursor-pointer justify-between bg-gray-50 p-4 font-semibold text-gray-800 hover:bg-gray-100 dark:bg-white/[0.03] dark:text-white/90 dark:hover:bg-white/5"
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
              <div className="bg-white p-4 dark:bg-white/[0.02]">
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
                            className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        />

                        <button
                            onClick={() =>
                            transferToReserve(m._id, patient._id,m.quantity)
                            }
                            className="mt-2 w-full rounded-md bg-warning-500 py-1 text-xs font-medium text-white hover:bg-warning-600"
                        >
                            Prebaci u rezervu
                        </button>
                        </TableCell>

                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell className="text-gray-500 dark:text-gray-400">
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
