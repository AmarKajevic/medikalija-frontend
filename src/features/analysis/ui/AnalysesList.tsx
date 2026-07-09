import { useNavigate } from "react-router";
import { useGetAnalyses } from "../hooks/useGetAnalyses";
import AddAnalysisNew from "./AddAnalysis";
import { useState } from "react";
import DeleteAnalysis from "./DeleteAnalysis";

const AnalysesList = () => {
  const { data, isLoading, error } = useGetAnalyses();
  const navigate = useNavigate();

  const [showForm, setShowForm] = useState(false);

  const analyses = data?.analyses || [];

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error.message}</div>;

  return (
    <div className="p-4 space-y-4">


      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Analize</h2>

        <button
          onClick={() => setShowForm((prev) => !prev)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          {showForm ? "Zatvori" : "Dodaj analizu"}
        </button>
      </div>


      {showForm && (
        <div className="bg-gray-100 p-4 rounded-xl">
          <AddAnalysisNew />
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-3 bg-gray-200 p-2 font-semibold">
          <div>Naziv</div>
          <div>Cena</div>
          <div>Izbrisi</div>
        </div>

        {analyses.map((a: any) => (
          <div
            key={a._id}
            className="grid grid-cols-3 p-2 border-t cursor-pointer hover:bg-gray-50"
            
          >
            <div onClick={() => navigate(`/analysisDetail/${a._id}`)}>{a.name}</div>
            <div>{a.price}</div>
            <div>
              <DeleteAnalysis id={a._id} />
            </div>
          </div>
          
        ))}
      </div>
    </div>
  );
};

export default AnalysesList;