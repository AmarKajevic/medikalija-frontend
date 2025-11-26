import { useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

interface Props {
  analysisId: string;
  currentPrice: number;
  onUpdated: () => void;
}

export default function EditAnalysis({ analysisId, currentPrice, onUpdated }: Props) {
  const { token } = useAuth();
  const [price, setPrice] = useState<number>(currentPrice);
  const [message, setMessage] = useState("");

  const handleUpdate = async () => {
    try {
      const res = await axios.put(
        `http://localhost:5000/api/analysis/${analysisId}`,
        { price },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setMessage("Cena ažurirana ✅");
        onUpdated();
      }
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Greška pri ažuriranju");
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <input
        type="number"
        value={price}
        onChange={(e) => setPrice(Number(e.target.value))}
        className="border p-1 rounded w-24"
      />
      <button onClick={handleUpdate} className="bg-blue-500 text-white px-3 py-1 rounded">
        Sačuvaj
      </button>
      {message && <span className="text-sm ml-2">{message}</span>}
    </div>
  );
}
