import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

interface Analysis {
  _id: string;
  name: string;
  price: number;
}

interface PatientAnalysisProps {
  patientId: string;
  onAdded: () => void; // callback za osvežavanje u PatientProfile
}

export default function PatientAnalysis({ patientId, onAdded }: PatientAnalysisProps) {
  const { token } = useAuth();
  const [allAnalyses, setAllAnalyses] = useState<Analysis[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAnalyses, setSelectedAnalyses] = useState<Analysis[]>([]);

  useEffect(() => {
    const fetchAnalyses = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/analysis", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) {
          setAllAnalyses(res.data.analyses);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchAnalyses();
  }, [token]);

  const filtered = allAnalyses.filter((a) =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToSelected = (analysis: Analysis) => {
    if (!selectedAnalyses.find((s) => s._id === analysis._id)) {
      setSelectedAnalyses([...selectedAnalyses, analysis]);
    }
  };

  const removeSelected = (id: string) => {
    setSelectedAnalyses(selectedAnalyses.filter((s) => s._id !== id));
  };

  const handleSave = async () => {
  try {
    for (const a of selectedAnalyses) {
      const res = await axios.post(
        "http://localhost:5000/api/analysis/patient", // bez "/" na kraju
        {
          patientId,
          analysisId: a._id,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        console.log("Dodato:", res.data.usedAnalysis);
      }
    }

    setSelectedAnalyses([]);
    onAdded();
  } catch (err) {
    console.error(err);
  }
};

  const total = selectedAnalyses.reduce((sum, a) => sum + a.price, 0);

  return (
    <div className="p-4 border rounded">
      <h4 className="font-bold mb-2">Dodaj analize</h4>
      <input
        type="text"
        placeholder="Pretraga analiza..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="border p-2 w-full rounded mb-2"
      />

      {searchTerm && (
        <ul className="border max-h-40 overflow-y-auto">
          {filtered.map((a) => (
            <li
              key={a._id}
              className="flex justify-between p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => addToSelected(a)}
            >
              <span>{a.name}</span>
              <span>{a.price} RSD</span>
            </li>
          ))}
        </ul>
      )}

      {selectedAnalyses.length > 0 && (
        <div className="mt-3">
          <h5 className="font-medium">Izabrane analize:</h5>
          <ul>
            {selectedAnalyses.map((a) => (
              <li key={a._id} className="flex justify-between">
                {a.name} – {a.price} RSD
                <button
                  onClick={() => removeSelected(a._id)}
                  className="text-red-500 ml-2"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 font-bold">Ukupno: {total} RSD</p>
          <button
            onClick={handleSave}
            className="mt-2 bg-green-600 text-white px-4 py-2 rounded"
          >
            Dodaj pacijentu
          </button>
        </div>
      )}
    </div>
  );
}
