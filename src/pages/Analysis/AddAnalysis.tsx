import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";

export default function AddAnalysis() {
  const { token } = useAuth();

  const [name, setName] = useState("");
  const [price, setPrice] = useState<string>(""); // ✅ STRING umesto number
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numericPrice = Number(price);

    if (!name.trim()) {
      return setMessage("Unesite naziv analize");
    }

    if (!numericPrice || numericPrice <= 0) {
      return setMessage("Unesite ispravnu cenu");
    }

    try {
      const res = await axios.post(
        "https://medikalija-api.vercel.app/api/analysis",
        { name, price: numericPrice }, // ✅ šaljemo kao NUMBER
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setMessage("Analiza uspešno dodata ✅");
        setName("");
        setPrice(""); // ✅ reset bez 0
      }
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Greška pri dodavanju");
    }
  };

  return (
    <div className="p-4 border rounded bg-white shadow">
      <h2 className="font-bold text-lg mb-3">Dodaj analizu</h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Naziv analize"
          className="w-full border p-2 rounded"
          required
        />

        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Dodaj cenu"   // ✅ RADI SAD
          className="w-full border p-2 rounded"
          min={0}
          step={0.01}
          required
        />

        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition"
        >
          Dodaj
        </button>
      </form>

      {message && (
        <p className={`mt-2 text-sm ${message.includes("Greška") ? "text-red-600" : "text-green-600"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
