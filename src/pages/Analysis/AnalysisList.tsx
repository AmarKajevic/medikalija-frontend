import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import EditAnalysis from "./EditAnalysis";
import AddAnalysis from "./AddAnalysis";

interface Analysis {
  _id: string;
  name: string;
  price: number;
}

export default function AnalysisList() {
  const { token } = useAuth();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);

  // ✅ NOVO: lokalni search (isti kao svuda)
  const [search, setSearch] = useState("");

  const fetchAnalyses = async () => {
    const res = await axios.get(
      "https://medikalija-api.vercel.app/api/analysis",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (res.data.success) {
      setAnalyses(res.data.analyses);
    }
  };

  useEffect(() => {
    fetchAnalyses();
  }, [token]);

  const handleDelete = async (id: string) => {
    await axios.delete(
      `https://medikalija-api.vercel.app/api/analysis/${id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    fetchAnalyses();
  };

  // ✅ filtriranje – bez promene dizajna
  const safeSearch = search.toLowerCase();
  const filteredAnalyses = analyses.filter((a) =>
    a.name.toLowerCase().includes(safeSearch)
  );

  return (
    <div className="p-4 bg-white shadow rounded">
      <div className="p-4 bg-white shadow rounded">
        <AddAnalysis />
      </div>

      <h2 className="font-bold text-lg mb-3">Lista analiza</h2>

      {/* ✅ SEARCH BAR – isti kao ostali */}
      <div className="mb-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pretraži analize..."
          className="w-full max-w-md border rounded px-3 py-2"
        />
      </div>

      <ul className="space-y-2">
        {filteredAnalyses.map((a) => (
          <li
            key={a._id}
            className="flex justify-between items-center border p-2 rounded"
          >
            <span>
              {a.name} – {a.price} RSD
            </span>
            <div className="flex space-x-2">
              <EditAnalysis
                analysisId={a._id}
                currentPrice={a.price}
                onUpdated={fetchAnalyses}
              />
              <button
                onClick={() => handleDelete(a._id)}
                className="bg-red-500 text-white px-3 py-1 rounded"
              >
                Obriši
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
