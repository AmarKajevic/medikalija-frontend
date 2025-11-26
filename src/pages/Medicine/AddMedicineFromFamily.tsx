import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import Input from "../../components/form/input/InputField";

interface Medicine {
  _id: string;
  name: string;
  quantity: number;
  familyQuantity?: number;
  unitsPerPackage?: number;
}

export default function AddMedicineFromFamily() {
  const { token } = useAuth();

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [selectedId, setSelectedId] = useState("");

  const [name, setName] = useState("");
  const [packages, setPackages] = useState<number | "">("");
  const [unitsPerPackage, setUnitsPerPackage] = useState<number | "">("");
  const [looseQuantity, setLooseQuantity] = useState<number | "">("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // ============================
  // LOAD EXISTING MEDICINES
  // ============================
  const loadMedicines = async () => {
    try {
      const res = await axios.get(
        "https://medikalija-api.vercel.app/api/medicine",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setMedicines(res.data.medicines);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadMedicines();
  }, [token]);

  // ============================
  // SELECTED MEDICINE MEMO
  // ============================
  const selectedMedicine = useMemo(
    () => medicines.find((m) => m._id === selectedId),
    [selectedId, medicines]
  );

  useEffect(() => {
    if (selectedMedicine?.unitsPerPackage) {
      setUnitsPerPackage(selectedMedicine.unitsPerPackage);
    } else {
      setUnitsPerPackage("");
    }
    setPackages("");
    setLooseQuantity("");
  }, [selectedMedicine]);

  // ============================
  // RESET FORM
  // ============================
  const resetForm = () => {
    setSelectedId("");
    setName("");
    setPackages("");
    setUnitsPerPackage("");
    setLooseQuantity("");
  };

  // ============================
  // SUBMIT HANDLER
  // ============================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (selectedId) {
        // UPDATE EXISTING MEDICINE
        const payload: any = { fromFamily: true };

        if (packages) payload.packages = Number(packages);
        if (unitsPerPackage) payload.unitsPerPackage = Number(unitsPerPackage);
        if (looseQuantity) payload.addQuantity = Number(looseQuantity);

        const res = await axios.put(
          `https://medikalija-api.vercel.app/api/medicine/${selectedId}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data.success) {
          setMessage("Uspešno dodata količina (porodica).");
          await loadMedicines();
          resetForm();
        }
      } else {
        // ADD NEW MEDICINE
        const payload: any = { name, fromFamily: true };

        if (packages) payload.packages = Number(packages);
        if (unitsPerPackage) payload.unitsPerPackage = Number(unitsPerPackage);
        if (looseQuantity) payload.quantity = Number(looseQuantity);

        const res = await axios.post(
          "https://medikalija-api.vercel.app/api/medicine/add",
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data.success) {
          setMessage("Lek uspešno dodat (porodica).");
          await loadMedicines();
          resetForm();
        }
      }
    } catch (error: any) {
      console.error(error);
      setMessage(error.response?.data?.message || "Greška prilikom dodavanja.");
    } finally {
      setLoading(false);
    }
  };

  // ============================
  // RENDER
  // ============================
  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-xl space-y-4">
      <h2 className="text-xl font-bold">
        {selectedId ? "Dodaj količinu (porodica)" : "Dodaj novi lek (porodica)"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* SELECT */}
        <div>
          <label className="text-sm font-medium text-gray-700">
            Odaberi postojeći lek ili unesi novi
          </label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full border px-3 py-2 rounded-lg"
          >
            <option value="">— Novi lek —</option>
            {medicines.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name} (Dom: {m.quantity} | Porodica: {m.familyQuantity ?? 0})
              </option>
            ))}
          </select>
        </div>

        {!selectedId && (
          <Input
            type="text"
            placeholder="Naziv leka"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            type="number"
            placeholder="Pakovanja"
            value={packages}
            onChange={(e) => setPackages(e.target.value === "" ? "" : Number(e.target.value))}
          />
          <Input
            type="number"
            placeholder="Tableta po pakovanju"
            value={unitsPerPackage}
            onChange={(e) => setUnitsPerPackage(e.target.value === "" ? "" : Number(e.target.value))}
          />
        </div>

        <Input
          type="number"
          placeholder="Dodatne tablete"
          value={looseQuantity}
          onChange={(e) => setLooseQuantity(e.target.value === "" ? "" : Number(e.target.value))}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg disabled:bg-gray-400"
        >
          {loading ? "Čuvanje..." : "Sačuvaj"}
        </button>
      </form>

      {message && <p className="text-center text-sm">{message}</p>}
    </div>
  );
}
