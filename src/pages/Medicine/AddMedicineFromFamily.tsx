// pages/Medicine/AddFamilyMedicine.tsx
import { useEffect, useState } from "react";
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
  packageCount?: number;
  familyPackageCount?: number;
}

export default function AddMedicineFromFamily() {
  const { token } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);

  const [selectedId, setSelectedId] = useState<string>("");

  const [name, setName] = useState("");
  const [pricePerUnit, setPricePerUnit] = useState<number | "">("");
  const [packages, setPackages] = useState<number | "">("");
  const [unitsPerPackage, setUnitsPerPackage] = useState<number | "">("");
  const [looseQuantity, setLooseQuantity] = useState<number | "">("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/medicine", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) {
          setMedicines(res.data.medicines);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchMedicines();
  }, [token]);

  const resetForm = () => {
    setSelectedId("");
    setName("");
    setPricePerUnit("");
    setPackages("");
    setUnitsPerPackage("");
    setLooseQuantity("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (selectedId) {
        // ✅ dodaj količinu postojećem leku
        const payload: any = {
          fromFamily: true,
        };

        if (packages !== "") payload.packages = Number(packages);
        if (unitsPerPackage !== "") payload.unitsPerPackage = Number(unitsPerPackage);
        if (looseQuantity !== "") payload.addQuantity = Number(looseQuantity);
        if (pricePerUnit !== "") payload.pricePerUnit = Number(pricePerUnit);

        const res = await axios.put(
          `http://localhost:5000/api/medicine/${selectedId}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data.success) {
          setMessage("Količina uspešno dodata (od porodice).");
          resetForm();
        }
      } else {
        // ✅ kreiraj novi lek
        const payload: any = {
          name,
          pricePerUnit: typeof pricePerUnit === "number" ? pricePerUnit : Number(pricePerUnit),
          fromFamily: true,
        };

        if (packages !== "") payload.packages = Number(packages);
        if (unitsPerPackage !== "") payload.unitsPerPackage = Number(unitsPerPackage);
        if (looseQuantity !== "") payload.quantity = Number(looseQuantity);

        const res = await axios.post(
          "http://localhost:5000/api/medicine/add",
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data.success) {
          setMessage("Lek uspešno dodat (od porodice).");
          resetForm();
        }
      }
    } catch (error: any) {
      console.error(error);
      setMessage(error.response?.data?.message || "Greška prilikom dodavanja leka.");
    } finally {
      setLoading(false);
    }
  };

  const selectedMedicine = medicines.find((m) => m._id === selectedId);

  useEffect(() => {
    if (selectedMedicine) {
      if (selectedMedicine.unitsPerPackage) {
        setUnitsPerPackage(selectedMedicine.unitsPerPackage);
      } else {
        setUnitsPerPackage("");
      }
      setPricePerUnit(selectedMedicine.pricePerUnit);
    } else {
      setUnitsPerPackage("");
      setPricePerUnit("");
    }
    setPackages("");
    setLooseQuantity("");
  }, [selectedMedicine]);

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-xl space-y-4">
      <h2 className="text-xl font-bold mb-2">
        {selectedId ? "Dodaj količinu (porodica)" : "Dodaj novi lek (porodica)"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Odaberi postojeći lek ili unesi novi
          </label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full border px-3 py-2 rounded-lg text-sm"
          >
            <option value="">— Novi lek —</option>
            {medicines.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name} (Dom: {m.quantity.toFixed(2)} | Porodica: {m.familyQuantity?.toFixed(2) ?? 0})
              </option>
            ))}
          </select>
        </div>

        {!selectedId && (
          <>
            <Input
              type="text"
              placeholder="Naziv leka"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              type="number"
              placeholder="Cena po komadu (RSD)"
              value={pricePerUnit}
              onChange={(e) =>
                setPricePerUnit(e.target.value === "" ? "" : Number(e.target.value))
              }
              required
            />
          </>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            type="number"
            placeholder="Broj pakovanja (npr. 2)"
            value={packages}
            onChange={(e) => setPackages(e.target.value === "" ? "" : Number(e.target.value))}
          />
          <Input
            type="number" required
            placeholder="Tableta po pakovanju (npr. 12)"
            value={unitsPerPackage}
            onChange={(e) =>
              setUnitsPerPackage(e.target.value === "" ? "" : Number(e.target.value))
            }
          />
        </div>

        <Input
          type="number"
          placeholder="Dodatne tablete (bez pakovanja)"
          value={looseQuantity}
          onChange={(e) =>
            setLooseQuantity(e.target.value === "" ? "" : Number(e.target.value))
          }
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
