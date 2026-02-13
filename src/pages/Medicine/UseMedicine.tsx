import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import ComponentCard from "../../components/common/ComponentCard";

interface Medicine {
  _id: string;          // PatientMedicine _id
  medicineId: string;   // Medicine _id
  name: string;
  quantity: number;
  unitsPerPackage: number;
}

interface MedicineProps {
  patientId: string;
  onMedicineUsed: (medicine: any) => void;
}

export default function UseMedicine({ patientId, onMedicineUsed }: MedicineProps) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [selected, setSelected] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [days, setDays] = useState<string>("");
  const [portion, setPortion] = useState<string>("");
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [message, setMessage] = useState("");

  const portions = [
    { label: "Cela tableta", value: 1 },
    { label: "Polovina", value: 0.5 },
    { label: "Trećina", value: 0.33 },
    { label: "Četvrtina", value: 0.25 },
    { label: "Celo i jedna polovina", value: 1.5 },
    { label: "Celo i jedna četvrtina", value: 1.25 },
    { label: "Celo i jedna trećina", value: 1.33 },
    { label: "Dva cela", value: 2 },
  ];

  // 🔥 UZIMA PACIJENTOV STOCK (ispravan endpoint)
  const { data: medicines = [], isLoading } = useQuery<Medicine[]>({
    queryKey: ["medicines", patientId],
    queryFn: async () => {
      const { data } = await axios.get(
        `https://medikalija-api.vercel.app/api/medicine/patient/${patientId}/stock`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return data.medicines;
    },
    enabled: !!patientId,
  });

  const addMedicine = useMutation({
    mutationFn: async (payload: { medicineId: string; amount: number }) => {
      const { data } = await axios.post(
        "https://medikalija-api.vercel.app/api/medicine/use",
        { patientId, ...payload },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return data;
    },
    onSuccess: (data) => {
      setMessage("Uspešno dodat lek ✔️");
      queryClient.invalidateQueries({ queryKey: ["medicines", patientId] });
      onMedicineUsed(data.usedMedicine);

      setSelected("");
      setAmount("");
      setDays("");
      setPortion("");
      setSearch("");
    },
    onError: (error: any) => {
      setMessage(error.response?.data?.message || "Greška pri dodavanju leka ❌");
    },
  });

  const filteredMedicines = medicines.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );


  const numericAmount = parseFloat(amount || "0");
  const numericDays = parseFloat(days || "0");
  const numericPortion = parseFloat(portion || "0");

  const totalAmount = parseFloat(
    (numericAmount * numericDays * numericPortion).toFixed(2)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selected) return setMessage("Izaberite lek.");
    if (!numericAmount) return setMessage("Unesite količinu.");
    if (!numericDays) return setMessage("Unesite broj dana.");
    if (!numericPortion) return setMessage("Odaberite dozu/tabletu.");

    addMedicine.mutate({
      medicineId: selected,
      amount: totalAmount,
    });
  };

  if (isLoading) return <p>Učitavanje lekova...</p>;

  return (
    <ComponentCard title="IZABERI LEK">
      <form onSubmit={handleSubmit} className="space-y-3">
        
        <div className="relative">
          <Input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowDropdown(true);
            }}
            placeholder="Pretraži lek"
            className="w-full border p-2 rounded"
          />

          {showDropdown && filteredMedicines.length > 0 && (
            <div className="absolute left-0 right-0 bg-white border rounded shadow-lg max-h-60 overflow-y-auto z-50">
              {filteredMedicines.map((m) => (
                <div
                  key={m._id}
                  onClick={() => {
                    setSelected(m.medicineId);
                    setSearch(m.name);
                    setShowDropdown(false);
                  }}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b"
                >
                  <div className="font-medium">{m.name}</div>
                  <div className="text-xs text-gray-500">
                    Ukupno dostupno: {m.quantity}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Input
          type="number"
          step={0.01}
          min={0}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full border p-2 rounded"
          placeholder="koliko dana"
        />

        <Input
          type="number"
          min={0}
          value={days}
          onChange={(e) => setDays(e.target.value)}
          className="w-full border p-2 rounded"
          placeholder="koliko puta dnevno"
        />

        <Select
          options={portions.map((p) => ({
            value: String(p.value),
            label: p.label,
          }))}
          placeholder="-- Izaberi količinu tablete --"
          onChange={setPortion}
          defaultValue={portion}
        />

        <p className="text-gray-600 text-sm">
          Ukupno za upotrebu: {isNaN(totalAmount) ? 0 : totalAmount} tableta
        </p>

        <button
          type="submit"
          className="bg-blue-500 w-fit self-end text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Dodaj potrošnju
        </button>
      </form>

      {message && (
        <p
          className={`mt-3 text-center ${
            message.includes("Greška") ? "text-red-600" : "text-green-600"
          }`}
        >
          {message}
        </p>
      )}
    </ComponentCard>
  );
}
