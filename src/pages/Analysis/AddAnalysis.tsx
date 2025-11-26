import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";


export default function AddAnalysis() {
    const { token } = useAuth();
    const [name, setName] = useState("");
    const [price, setPrice] = useState<number>(0);
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
         e.preventDefault();
    try {
      const res = await axios.post(
        "http://localhost:5000/api/analysis",
        { name, price },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setMessage("Analiza uspešno dodata ✅");
        setName("");
        setPrice(0);
      }
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Greška pri dodavanju");
    }
  };
    
   return (
    <div>
    <div className="p-4 border rounded bg-white shadow">
      <h2 className="font-bold text-lg mb-2">Dodaj analizu</h2>
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
          onChange={(e) => setPrice(Number(e.target.value))}
          placeholder="Cena"
          className="w-full border p-2 rounded"
          required
        />
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Dodaj
        </button>
      </form>
      {message && <p className="mt-2">{message}</p>}
    </div>
    
    </div>
  )
}