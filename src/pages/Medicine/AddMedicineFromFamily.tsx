// pages/Medicine/AddMedicineFromFamily.tsx
import { useEffect, useState, useMemo } from "react";
import { api } from "@shared/api/api";
import Input from "@shared/ui/form/input/InputField";

interface Medicine {
  _id: string;
  name: string;
  quantity: number;
  familyQuantity?: number;
  unitsPerPackage?: number;
}

export default function AddMedicineFromFamily() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [selectedId, setSelectedId] = useState("");

  const [name, setName] = useState("");
  const [unitsPerPackage, setUnitsPerPackage] = useState<number | "">("");
  const [totalQuantity, setTotalQuantity] = useState<number | "">("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // ---------------------------------------------------
  // LOAD MEDICINES
  // ---------------------------------------------------
  const loadMedicines = async () => {
    try {
      const res = await api.get("/api/medicine");
      if (res.data.success) {
        setMedicines(res.data.medicines);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadMedicines();
  }, []);

  // ---------------------------------------------------
  // SELECTED MEDICINE
  // ---------------------------------------------------
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
    setTotalQuantity("");
  }, [selectedMedicine]);

  // ---------------------------------------------------
  // RESET FORM
  // ---------------------------------------------------
  const resetForm = () => {
    setSelectedId("");
    setName("");
    setUnitsPerPackage("");
    setTotalQuantity("");
  };

  // ---------------------------------------------------
  // SUBMIT
  // ---------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (!unitsPerPackage || !totalQuantity) {
        setMessage("Unesi ukupnu količinu i tablete po pakovanju.");
        return;
      }

      const total = Number(totalQuantity);
      const upp = Number(unitsPerPackage);

      // IZRAČUNAVANJE PAKOVANJA + OSTATAK
      const packageCount = Math.floor(total / upp);
      const loose = total % upp;

      if (selectedId) {
        // UPDATE EXISTING
        const payload = {
          fromFamily: true,
          packages: packageCount,
          unitsPerPackage: upp,
          addQuantity: loose,
        };

        const res = await api.put(`/api/medicine/${selectedId}`, payload);

        if (res.data.success) {
          setMessage("Uspešno dodata količina (porodica).");
          await loadMedicines();
          resetForm();
        }
      } else {
        // ADD NEW MEDICINE
        const payload = {
          name,
          fromFamily: true,
          packages: packageCount,
          unitsPerPackage: upp,
          quantity: loose,
        };

        const res = await api.post("/api/medicine/add", payload);

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

  // ---------------------------------------------------
  // RENDER
  // ---------------------------------------------------
  return (
    <div className="mx-auto max-w-md p-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <h2 className="mb-5 text-base font-semibold text-gray-800 dark:text-white/90">
        {selectedId ? "Dodaj količinu (porodica)" : "Dodaj novi lek (porodica)"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* SELECT */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
            Odaberi postojeći lek ili unesi novi
          </label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
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

        <Input
          type="number"
          placeholder="broj tableta u pakovanju"
          value={unitsPerPackage}
          onChange={(e) =>
            setUnitsPerPackage(e.target.value === "" ? "" : Number(e.target.value))
          }
        />

        <Input
          type="number"
          placeholder="Ukupna količina"
          value={totalQuantity}
          onChange={(e) =>
            setTotalQuantity(e.target.value === "" ? "" : Number(e.target.value))
          }
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-500 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
        >
          {loading ? "Čuvanje..." : "Sačuvaj"}
        </button>
      </form>

      {message && (
        <p className="mt-3 text-center text-sm text-gray-600 dark:text-gray-400">{message}</p>
      )}
      </div>
    </div>
  );
}
