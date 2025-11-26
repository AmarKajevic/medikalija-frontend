import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

interface Patient {
  _id: string;
  name: string;
  lastName: string;
  dateOfBirth: string;
  address: string;
  admissionDate: string;
  dischargeDate?: string | null;
}

function PatientList() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("https://medikalija-api.vercel.app/api/patient", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setPatients(
          response.data.patients.map((p: any) => ({
            ...p,
            _id: p._id.toString(),
          }))
        );
      } else {
        setError("Nije moguće učitati pacijente");
      }
    } catch (err) {
      console.error(err);
      setError("Greška sa serverom");
    } finally {
      setLoading(false);
    }
  };

  const updateDischargeDate = async (patientId: string, date: string) => {
    try {
      const token = localStorage.getItem("token");

      const isoDate = new Date(date).toISOString();

      await axios.patch(
        `https://medikalija-api.vercel.app/api/patient/${patientId}/discharge`,
        { dischargeDate: isoDate },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // ⭐ Instant update UI bez refresh-a
      setPatients((prev) =>
        prev.map((p) =>
          p._id === patientId ? { ...p, dischargeDate: isoDate } : p
        )
      );
    } catch (err) {
      console.error(err);
      alert("Greška prilikom postavljanja datuma otpusta");
    }
  };

  // ⭐ Inicijalizacija DatePickera – svaki puta kad se lista promeni
  useEffect(() => {
    patients.forEach((p) => {
      if (p.dischargeDate) return;

      flatpickr(`#dp-${p._id}`, {
        dateFormat: "d-m-Y",
        onChange: (selectedDates) => {
          if (selectedDates[0]) {
            updateDischargeDate(p._id, selectedDates[0].toString());
          }
        },
      });
    });
  }, [patients]);

  if (loading) return <p className="text-center py-4 text-gray-500">Učitavanje...</p>;
  if (error) return <p className="text-red-500 text-center py-4">{error}</p>;
  if (!patients.length) return <p className="text-center py-4">Nema pacijenata</p>;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="max-w-full overflow-x-auto">
        <Table>

          <TableHeader className="border-b">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Ime</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Prezime</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Datum rođenja</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Adresa</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Datum prijema</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Datum otpusta</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Akcija</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Profil</TableCell>
            </TableRow>
          </TableHeader>

          <TableBody>
            {patients.map((patient) => (
              <TableRow key={patient._id} className="hover:bg-gray-50">
                <TableCell className="px-5 py-4 sm:px-6 text-start">{patient.name}</TableCell>
                <TableCell className="px-5 py-4 sm:px-6 text-start">{patient.lastName}</TableCell>
                <TableCell className="px-5 py-4 sm:px-6 text-start">
                  {new Date(patient.dateOfBirth).toLocaleDateString("sr-RS")}
                </TableCell>
                <TableCell className="px-5 py-4 sm:px-6 text-start">{patient.address}</TableCell>
                <TableCell className="px-5 py-4 sm:px-6 text-start">
                  {new Date(patient.admissionDate).toLocaleDateString("sr-RS")}
                </TableCell>

                {/* ➤ Datum otpusta */}
                <TableCell className="px-5 py-4 sm:px-6 text-start">
                  {patient.dischargeDate ? (
                    <span className="font-medium text-gray-700">
                      {new Date(patient.dischargeDate).toLocaleDateString("sr-RS")}
                    </span>
                  ) : (
                    <input
                      id={`dp-${patient._id}`}
                      placeholder="Izaberi datum"
                      className="h-9 w-36 rounded-md border px-2 text-sm text-gray-700"
                    />
                  )}
                </TableCell>

                {/* ➤ Akcija */}
                <TableCell className="px-5 py-4 sm:px-6 text-start">
                  {patient.dischargeDate ? (
                    <span className="text-gray-400 italic">Otpušten</span>
                  ) : (
                    <span className="text-gray-400 italic">Čeka datum</span>
                  )}
                </TableCell>

                {/* ➤ Profil */}
                <TableCell className="px-5 py-4 sm:px-6 text-start">
                  <Link
                    to={`/patient/${patient._id}`}
                    className="px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
                  >
                    Profil
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>

        </Table>
      </div>
    </div>
  );
}

export default PatientList;
