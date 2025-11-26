import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import ComponentCard from "../../components/common/ComponentCard";


interface Medicine {
  _id: string;
  name: string;
  quantity: number;
  familyQuantity: number;
  pricePerUnit: number;
}

interface MedicineProps {
  patientId: string;
  onMedicineUsed: (medicine: any) => void;
}

export default function UseMedicine({ patientId, onMedicineUsed }: MedicineProps) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState("");
  const [amount, setAmount] = useState(1);
  const [days, setDays] = useState(1);
  const [portion, setPortion] = useState(1);

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

  const { data: medicines = [], isLoading } = useQuery<Medicine[]>({
    queryKey: ["medicines", patientId],
    queryFn: async () => {
      const { data } = await axios.get("http://localhost:5000/api/medicine", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data.medicines;
    },
  });

  const addMedicine = useMutation({
    mutationFn: async (payload: { medicineId: string; amount: number }) => {
      const { data } = await axios.post(
        "http://localhost:5000/api/medicine/use",
        { patientId, ...payload },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return data;
    },
    onSuccess: (data) => {
      setMessage("Uspešno dodat lek ✔️");
      queryClient.invalidateQueries({
        queryKey: ["medicines", patientId],
      });

      onMedicineUsed(data.usedMedicine);
      setSelected("");
      setAmount(1);
      setDays(1);
      setPortion(1);
    },
    onError: (error: any) => {
      setMessage(error.response?.data?.message || "Greška pri dodavanju leka ❌");
    },
  });

  const selectedMedicine = medicines.find((m) => m._id === selected);
  const totalAmount = parseFloat((amount * days * portion).toFixed(2));
  const totalPrice = selectedMedicine
    ? parseFloat((totalAmount * selectedMedicine.pricePerUnit).toFixed(2))
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    addMedicine.mutate({ medicineId: selected, amount: totalAmount });
  };

  if (isLoading) return <p>Učitavanje lekova...</p>;

  return (
    <ComponentCard title="IZABERI LEK">

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* ✅ Select for Medicines */}
        <Select
          options={medicines.map((m) => ({
            value: m._id,
            label: `${m.name} (dostupno od doma: ${m.quantity.toFixed(2)}, od porodice: ${m.familyQuantity.toFixed(2)})`,
          }))}
          placeholder="-- Izaberi lek --"
          onChange={setSelected}
          defaultValue={selected}
        />

      <Input
          type="number"
          step={0.01}             // ➜ Omogućava decimale
          min={0}                 // ➜ Može i 0 ako treba
          value={amount === 0 ? "" : amount}  // ➜ placeholder radi
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full border p-2 rounded"
          placeholder="Količina po danu"      // ➜ Prikazuje placeholder
        />
        <Input
          type="number"
          min={1}
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="w-full border p-2 rounded"
          placeholder="Broj dana"
        />

        {/* ✅ Select for Portions */}
        <Select
          options={portions.map((p) => ({
            value: String(p.value),
            label: p.label,
          }))}
          onChange={(v) => setPortion(Number(v))}
          defaultValue={String(portion)}
        />

        <p className="text-gray-600 text-sm">Ukupno za upotrebu: {totalAmount} tableta</p>
        <p className="text-gray-600 text-sm">Ukupna cena: {totalPrice} RSD</p>

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
