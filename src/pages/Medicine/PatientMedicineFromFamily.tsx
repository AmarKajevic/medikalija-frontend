import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";

interface Patient {
  _id: string;
  name: string;
  lastName: string;
}

interface PatientStockMedicine {
  _id: string;              // medicineId
  name: string;
  familyQuantity: number;
  unitsPerPackage: number;
  familyPackageCount: number;
}

export default function PatientMedicineFromFamily() {
  const { token } = useAuth();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientStock, setPatientStock] = useState<PatientStockMedicine[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const API = "https://medikalija-api.vercel.app/api";

  // 🔹 Fetch svih pacijenata
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

  // 🔹 Fetch family lekova za izabranog pacijenta
  const fetchPatientStock = async (patientId: string) => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API}/medicine/patient/${patientId}/stock`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setPatientStock(response.data.medicines || []);
      } else {
        setPatientStock([]);
      }
    } catch (error) {
      console.log(error);
      setPatientStock([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // 🔍 Filter pacijenata po search-u
  const filteredPatients = patients.filter((p) =>
    `${p.name} ${p.lastName}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="p-4 space-y-4">

      {/* 🔍 SEARCH */}
      <input
        type="text"
        placeholder="Pretraži pacijenta..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border p-2 rounded"
      />

      {/* 📋 LISTA PACIJENATA */}
      <div className="border rounded">
        {filteredPatients.map((patient) => (
          <div
            key={patient._id}
            onClick={() => {
              setSelectedPatient(patient);
              fetchPatientStock(patient._id);
            }}
            className={`p-3 cursor-pointer border-b hover:bg-blue-50 ${
              selectedPatient?._id === patient._id
                ? "bg-blue-100"
                : ""
            }`}
          >
            {patient.name} {patient.lastName}
          </div>
        ))}
      </div>

      {/* 💊 LISTA LEKOVA ZA PACIJENTA */}
      {selectedPatient && (
        <div className="mt-4 border rounded p-4 bg-gray-50">
          <h3 className="font-semibold mb-3">
            Lekovi od porodice za:{" "}
            {selectedPatient.name} {selectedPatient.lastName}
          </h3>

          {loading && <p>Učitavanje...</p>}

          {!loading && patientStock.length === 0 && (
            <p>Nema lekova od porodice.</p>
          )}

          {!loading &&
            patientStock.map((medicine) => (
              <div
                key={medicine._id}
                className="border-b py-2 flex justify-between"
              >
                <div>
                  <div className="font-medium">{medicine.name}</div>
                  <div className="text-sm text-gray-500">
                    Pakovanja: {medicine.familyPackageCount} |
                    Tableta ukupno: {medicine.familyQuantity}
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
