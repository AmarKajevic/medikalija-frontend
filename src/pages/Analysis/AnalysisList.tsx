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

  const fetchAnalyses = async () => {
    const res = await axios.get("http://localhost:5000/api/analysis", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.data.success) {
      setAnalyses(res.data.analyses);
    }
  };

  useEffect(() => {
    fetchAnalyses();
  }, [token]);

  const handleDelete = async (id: string) => {
    await axios.delete(`http://localhost:5000/api/analysis/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchAnalyses();
  };

  return (
    <div className="p-4 bg-white shadow rounded">
      <div className="p-4 bg-white shadow rounded">
        <AddAnalysis/>
      </div>
      <h2 className="font-bold text-lg mb-3">Lista analiza</h2>
      <ul className="space-y-2">
        {analyses.map((a) => (
          <li key={a._id} className="flex justify-between items-center border p-2 rounded">
            <span>
              {a.name} – {a.price} RSD
            </span>
            <div className="flex space-x-2">
              <EditAnalysis analysisId={a._id} currentPrice={a.price} onUpdated={fetchAnalyses} />
              <button onClick={() => handleDelete(a._id)} className="bg-red-500 text-white px-3 py-1 rounded">
                Obriši
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
