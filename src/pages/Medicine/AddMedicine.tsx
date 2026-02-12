// pages/Medicine/AddMedicine.tsx
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import Input from "../../components/form/input/InputField";

interface Medicine {
  _id: string;
  name: string;
  pricePerUnit: number;
  quantity: number;
  familyQuantity?: number;
  unitsPerPackage?: number;
}

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
}

interface MedicineFormProps {
  title: string;
  fromFamily: boolean;
  medicines: Medicine[];
  patients?: Patient[];
  token: string | null;
}

function MedicineForm({
  title,
  fromFamily,
  medicines,
  patients = [],
  token,
}: MedicineFormProps) {
  const [selectedId, setSelectedId] = useState("");
  const [selectedPatient, setSelectedPatient] = useState("");

  const [name, setName] = useState("");
  const [pricePerUnit, setPricePerUnit] = useState<number | "">("");
  const [unitsPerPackage, setUnitsPerPackage] = useState<number | "">("");
  const [totalQuantity, setTotalQuantity] = useState<number | "">("");

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [patientDropdownOpen, setPatientDropdownOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const patientDropdownRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  /* CLICK OUTSIDE */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
      if (
        patientDropdownRef.current &&
        !patientDropdownRef.current.contains(e.target as Node)
      ) {
        setPatientDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredMedicines = medicines.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPatients = patients.filter((p) =>
    `${p.firstName} ${p.lastName}`
      .toLowerCase()
      .includes(patientSearch.toLowerCase())
  );

  const resetForm = () => {
    setSelectedId("");
    setSelectedPatient("");
    setName("");
    setPricePerUnit("");
    setUnitsPerPackage("");
    setTotalQuantity("");
    setSearch("");
    setPatientSearch("");
    setDropdownOpen(false);
    setPatientDropdownOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const u = Number(unitsPerPackage);
      const q = Number(totalQuantity);

      const packageCount = u > 0 ? Math.floor(q / u) : 0;
      const loose = u > 0 ? q % u : q;

      if (fromFamily && !selectedPatient) {
        setMessage("Morate odabrati pacijenta.");
        setLoading(false);
        return;
      }

      const payload: any = {
        fromFamily,
        unitsPerPackage: u,
        packages: packageCount,
        quantity: loose,
      };

      if (selectedId) {
        payload.addQuantity = loose;
      } else {
        payload.name = name;
        if (!fromFamily) {
          payload.pricePerUnit = Number(pricePerUnit);
        }
      }

      if (fromFamily) {
        payload.patientId = selectedPatient;
      }

      if (selectedId) {
        await axios.put(
          `https://medikalija-api.vercel.app/api/medicine/${selectedId}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          "https://medikalija-api.vercel.app/api/medicine/add",
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setMessage("Uspešno sačuvano.");
      resetForm();
    } catch (error: any) {
      setMessage(
        error.response?.data?.message || "Greška prilikom dodavanja."
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedMedicine = medicines.find((m) => m._id === selectedId);
  const selectedPatientObj = patients.find(
    (p) => p._id === selectedPatient
  );

  return (
    <div className="p-6 bg-white shadow-lg rounded-xl space-y-4">
      <h2 className="text-xl font-bold">{title}</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* MEDICINE DROPDOWN */}
        <div className="space-y-1 relative" ref={dropdownRef}>
          <label className="text-sm font-medium text-gray-700">
            Odaberi postojeći lek ili unesi novi
          </label>

          <button
            type="button"
            onClick={() => setDropdownOpen((o) => !o)}
            className="w-full border px-3 py-2 rounded-lg text-sm text-left bg-white"
          >
            {selectedMedicine
              ? selectedMedicine.name
              : "— Novi lek —"}
          </button>

          {dropdownOpen && (
            <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-64 overflow-auto">
              <div className="p-2 border-b">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Pretraži lek..."
                  className="w-full border px-2 py-1 rounded text-sm"
                />
              </div>

              <ul>
                <li
                  onClick={() => {
                    setSelectedId("");
                    setDropdownOpen(false);
                  }}
                  className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100"
                >
                  — Novi lek —
                </li>

                {filteredMedicines.map((m) => (
                  <li
                    key={m._id}
                    onClick={() => {
                      setSelectedId(m._id);
                      setDropdownOpen(false);
                    }}
                    className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100"
                  >
                    {m.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* PATIENT SEARCHABLE DROPDOWN */}
        {fromFamily && (
          <div className="space-y-1 relative" ref={patientDropdownRef}>
            <label className="text-sm font-medium text-gray-700">
              Odaberi pacijenta
            </label>

            <button
              type="button"
              onClick={() =>
                setPatientDropdownOpen((o) => !o)
              }
              className="w-full border px-3 py-2 rounded-lg text-sm text-left bg-white"
            >
              {selectedPatientObj
                ? `${selectedPatientObj.firstName} ${selectedPatientObj.lastName}`
                : "— Izaberi pacijenta —"}
            </button>

            {patientDropdownOpen && (
              <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-64 overflow-auto">
                <div className="p-2 border-b">
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={(e) =>
                      setPatientSearch(e.target.value)
                    }
                    placeholder="Pretraži pacijenta..."
                    className="w-full border px-2 py-1 rounded text-sm"
                  />
                </div>

                <ul>
                  {filteredPatients.map((p) => (
                    <li
                      key={p._id}
                      onClick={() => {
                        setSelectedPatient(p._id);
                        setPatientDropdownOpen(false);
                      }}
                      className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100"
                    >
                      {p.firstName} {p.lastName}
                    </li>
                  ))}

                  {filteredPatients.length === 0 && (
                    <li className="px-3 py-2 text-sm text-gray-500">
                      Nema rezultata
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {!selectedId && (
          <>
            <Input
              type="text"
              placeholder="Naziv leka"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            {!fromFamily && (
              <Input
                type="number"
                step={0.01}
                placeholder="Cena po komadu (RSD)"
                value={pricePerUnit}
                onChange={(e) =>
                  setPricePerUnit(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                required
              />
            )}
          </>
        )}

        <Input
          type="number"
          placeholder="Broj tableta u pakovanju"
          value={unitsPerPackage}
          onChange={(e) =>
            setUnitsPerPackage(
              e.target.value === "" ? "" : Number(e.target.value)
            )
          }
          required
        />

        <Input
          type="number"
          placeholder="Ukupna količina"
          value={totalQuantity}
          onChange={(e) =>
            setTotalQuantity(
              e.target.value === "" ? "" : Number(e.target.value)
            )
          }
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "Čuvanje..." : "Sačuvaj"}
        </button>
      </form>

      {message && (
        <p className="mt-3 text-center text-sm text-gray-700">
          {message}
        </p>
      )}
    </div>
  );
}

export default function AddMedicine() {
  const { token } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const medRes = await axios.get(
          "https://medikalija-api.vercel.app/api/medicine",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const patientRes = await axios.get(
          "https://medikalija-api.vercel.app/api/patient",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (medRes.data.success) {
          setMedicines(medRes.data.medicines);
        }

        if (patientRes.data.success) {
          setPatients(patientRes.data.patients);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [token]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <MedicineForm
          title="Dodavanje leka (Dom)"
          fromFamily={false}
          medicines={medicines}
          token={token}
        />

        <MedicineForm
          title="Dodavanje leka (Porodica)"
          fromFamily={true}
          medicines={medicines}
          patients={patients}
          token={token}
        />
      </div>
    </div>
  );
}
