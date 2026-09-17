import { useEffect, useState } from "react";
import { api } from "@shared/api/api";
import ComponentCard from "@shared/ui/common/ComponentCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@shared/ui/table/index";
import Input from "@shared/ui/form/input/InputField";

interface Patient {
  _id: string;
  name: string;
  lastName: string;
}

interface ReserveItem {
  _id: string;
  name: string;
  amount: number;
  source: "home" | "family";
  pricePerUnit?: number;
  createdAt: string;
  patient?: string;
}

export default function MedicineReserveManager() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [reserve, setReserve] = useState<Record<string, ReserveItem[]>>({});
  const [expandedPatient, setExpandedPatient] = useState<string | null>(null);
  const [returnAmounts, setReturnAmounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [returnDestination, setReturnDestination] = useState<Record<string, "family" | "home">>({});



  /* ================= FETCH PACIJENATA ================= */
  const fetchPatients = async () => {
    const res = await api.get("/api/patient");

    setPatients(res.data.patients || []);
  };

  /* ================= FETCH REZERVE PO PACIJENTU ================= */
  const fetchReserve = async (patientId: string) => {
    const res = await api.get(`/api/medicine-reserve?patientId=${patientId}`);

    setReserve((prev) => ({
      ...prev,
      [patientId]: res.data.reserve || [],
    }));
  };

  /* ================= DELETE ================= */
  const deleteReserve = async (id: string, patientId: string) => {
    if (!confirm("Obrisati lek iz rezerve?")) return;

    await api.delete(`/api/medicine-reserve/${id}`);

    fetchReserve(patientId);
  };

  /* ================= RETURN ================= */
  const returnFromReserve = async (reserveId: string, patientId: string) => {
    const amount = returnAmounts[reserveId];
    const destination = returnDestination[reserveId] || "family";

    if (!amount || amount <= 0) return alert("Unesi količinu!");

    await api.post("/api/medicine-reserve/return", { reserveId, amount, destination });

    setReturnAmounts((prev) => ({ ...prev, [reserveId]: 0 }));
    fetchReserve(patientId);
  };


  useEffect(() => {
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter((p) =>
    `${p.name} ${p.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  const togglePatient = async (patientId: string) => {
    if (expandedPatient === patientId) {
      setExpandedPatient(null);
      return;
    }

    setExpandedPatient(patientId);

    if (!reserve[patientId]) {
      await fetchReserve(patientId);
    }
  };

  return (
    <ComponentCard title="REZERVA LEKOVA — PORODICA">
      {/* SEARCH */}
      <div className="mb-6 max-w-md">
        <Input
          type="text"
          placeholder="Pretraži pacijenta..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filteredPatients.map((patient) => (
          <div key={patient._id} className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">

            {/* HEADER */}
            <div
              onClick={() => togglePatient(patient._id)}
              className="flex cursor-pointer justify-between bg-gray-50 p-4 font-semibold text-gray-800 hover:bg-gray-100 dark:bg-white/[0.03] dark:text-white/90 dark:hover:bg-white/5"
            >
              <span>
                {patient.name} {patient.lastName}
              </span>
              <span>
                {expandedPatient === patient._id ? "▲" : "▼"}
              </span>
            </div>

            {/* REZERVA */}
            {expandedPatient === patient._id && (
              <div className="bg-white p-4 dark:bg-white/[0.02]">
                {(reserve[patient._id] || []).length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Nema lekova u rezervi.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableCell isHeader>Lek</TableCell>
                        <TableCell isHeader>Količina</TableCell>
                        <TableCell isHeader>Cena</TableCell>
                        <TableCell isHeader>Datum</TableCell>
                        <TableCell isHeader>Vrati</TableCell>
                        <TableCell isHeader>Obriši</TableCell>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {reserve[patient._id].map((r) => (
                        <TableRow key={r._id}>
                          <TableCell>{r.name}</TableCell>
                          <TableCell>{r.amount}</TableCell>
                          <TableCell>
                            {r.pricePerUnit
                              ? `${r.pricePerUnit} RSD`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {new Date(r.createdAt).toLocaleDateString()}
                          </TableCell>

                          <TableCell className="w-40">
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

                            <select
                              value={returnDestination[r._id] || "family"}
                              onChange={(e) =>
                                setReturnDestination({
                                  ...returnDestination,
                                  [r._id]: e.target.value as "family" | "home",
                                })
                              }
                              className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            >
                              <option value="family">Vrati pacijentu</option>
                              <option value="home">Vrati u dom</option>
                            </select>

                            <button
                              onClick={() => returnFromReserve(r._id, patient._id)}
                              className="mt-2 w-full rounded-md bg-success-500 py-1 text-xs font-medium text-white hover:bg-success-600"
                            >
                              Vrati
                            </button>
                          </TableCell>


                          <TableCell>
                            <button
                              onClick={() =>
                                deleteReserve(r._id, patient._id)
                              }
                              className="rounded-md bg-error-50 px-3 py-1.5 text-xs font-medium text-error-600 hover:bg-error-100 dark:bg-error-500/15 dark:text-error-400 dark:hover:bg-error-500/25"
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
            )}
          </div>
        ))}
      </div>
    </ComponentCard>
  );
}
