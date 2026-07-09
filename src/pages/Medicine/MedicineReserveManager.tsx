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
import Input from "../../components/form/input/InputField";

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
  const { token } = useAuth();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [reserve, setReserve] = useState<Record<string, ReserveItem[]>>({});
  const [expandedPatient, setExpandedPatient] = useState<string | null>(null);
  const [returnAmounts, setReturnAmounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [returnDestination, setReturnDestination] = useState<Record<string, "family" | "home">>({});



  const API = "https://medikalija-api.vercel.app/api";

  /* ================= FETCH PACIJENATA ================= */
  const fetchPatients = async () => {
    const res = await axios.get(`${API}/patient`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    setPatients(res.data.patients || []);
  };

  /* ================= FETCH REZERVE PO PACIJENTU ================= */
  const fetchReserve = async (patientId: string) => {
    const res = await axios.get(
      `${API}/medicine-reserve?patientId=${patientId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setReserve((prev) => ({
      ...prev,
      [patientId]: res.data.reserve || [],
    }));
  };

  /* ================= DELETE ================= */
  const deleteReserve = async (id: string, patientId: string) => {
    if (!confirm("Obrisati lek iz rezerve?")) return;

    await axios.delete(`${API}/medicine-reserve/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    fetchReserve(patientId);
  };

  /* ================= RETURN ================= */
  const returnFromReserve = async (reserveId: string, patientId: string) => {
    const amount = returnAmounts[reserveId];
    const destination = returnDestination[reserveId] || "family";

    if (!amount || amount <= 0) return alert("Unesi količinu!");

    await axios.post(
      `${API}/medicine-reserve/return`,
      { reserveId, amount, destination },
      { headers: { Authorization: `Bearer ${token}` } }
    );

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
          <div key={patient._id} className="border rounded-lg overflow-hidden">
            
            {/* HEADER */}
            <div
              onClick={() => togglePatient(patient._id)}
              className="p-4 bg-gray-100 cursor-pointer hover:bg-gray-200 font-semibold flex justify-between"
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
              <div className="p-4 bg-white">
                {(reserve[patient._id] || []).length === 0 ? (
                  <p className="text-sm text-gray-500">
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
                              className="mt-1 w-full border rounded px-2 py-1 text-xs"
                            >
                              <option value="family">Vrati pacijentu</option>
                              <option value="home">Vrati u dom</option>
                            </select>

                            <button
                              onClick={() => returnFromReserve(r._id, patient._id)}
                              className="mt-2 w-full bg-green-600 hover:bg-green-700 text-white py-1 rounded text-xs"
                            >
                              Vrati
                            </button>
                          </TableCell>


                          <TableCell>
                            <button
                              onClick={() =>
                                deleteReserve(r._id, patient._id)
                              }
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs"
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
