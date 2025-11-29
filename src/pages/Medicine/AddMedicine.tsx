// pages/Medicine/AddMedicine.tsx
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

export default function AddMedicine() {
  const { token } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);

  const [selectedId, setSelectedId] = useState<string>("");

  const [name, setName] = useState("");
  const [pricePerUnit, setPricePerUnit] = useState<number | "">("");
  const [unitsPerPackage, setUnitsPerPackage] = useState<number | "">("");
  const [totalQuantity, setTotalQuantity] = useState<number | "">("");
  const [fromFamily, setFromFamily] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const res = await axios.get(
          "https://medikalija-api.vercel.app/api/medicine",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
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
    setUnitsPerPackage("");
    setTotalQuantity("");
    setFromFamily(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // ------------------------
      //  PRORAČUNI
      // ------------------------
      const u = Number(unitsPerPackage);
      const q = Number(totalQuantity);

      const packageCount = u > 0 ? Math.floor(q / u) : 0;
      const loose = u > 0 ? q % u : q;

      if (selectedId) {
        // === UPDATE POSTOJEĆEG LEKA ===
        const payload: any = {
          fromFamily,
          unitsPerPackage: u,
          packages: packageCount,
          addQuantity: loose,
        };

        if (pricePerUnit !== "") {
          payload.pricePerUnit = Number(pricePerUnit);
        }

        const res = await axios.put(
          `https://medikalija-api.vercel.app/api/medicine/${selectedId}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data.success) {
          setMessage("Količina uspešno dodata.");
          resetForm();
        }
      } else {
        // === NOVI LEK ===
        const payload: any = {
          name,
          pricePerUnit:
            typeof pricePerUnit === "number"
              ? parseFloat(pricePerUnit.toFixed(2))
              : parseFloat(Number(pricePerUnit).toFixed(2)),

          unitsPerPackage: u,
          packages: packageCount,
          quantity: loose,
          fromFamily,
        };

        const res = await axios.post(
          "https://medikalija-api.vercel.app/api/medicine/add",
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data.success) {
          setMessage("Lek uspešno dodat.");
          resetForm();
        }
      }
    } catch (error: any) {
      console.error(error);
      setMessage(
        error.response?.data?.message ||
          "Greška prilikom dodavanja leka."
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedMedicine = medicines.find((m) => m._id === selectedId);

  useEffect(() => {
    if (selectedMedicine) {
      setUnitsPerPackage(selectedMedicine.unitsPerPackage ?? "");
      setPricePerUnit(selectedMedicine.pricePerUnit);
    } else {
      setUnitsPerPackage("");
      setPricePerUnit("");
    }
    setTotalQuantity("");
  }, [selectedMedicine]);

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-xl space-y-4">
      <h2 className="text-xl font-bold mb-2">
        {selectedId
          ? "Dodaj količinu postojećem leku"
          : "Dodaj novi lek"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Izbor leka */}
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
                {m.name} (Dom: {m.quantity.toFixed(2)} | Porodica:{" "}
                {m.familyQuantity?.toFixed(2) ?? 0})
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
          </>
        )}

        <Input
          type="number"
          placeholder="broj tableta u pakovanju npr. 12"
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
          placeholder="Ukupna količina (npr. 36)"
          value={totalQuantity}
          onChange={(e) =>
            setTotalQuantity(
              e.target.value === "" ? "" : Number(e.target.value)
            )
          }
          required
        />

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={fromFamily}
            onChange={() => setFromFamily((prev) => !prev)}
          />
          <span>Porodica donela lek</span>
        </label>

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
