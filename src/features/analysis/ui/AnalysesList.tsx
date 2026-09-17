import { useNavigate } from "react-router";
import { useGetAnalyses } from "@features/analysis/hooks/useGetAnalyses";
import AddAnalysisNew from "@features/analysis/ui/AddAnalysis";
import { useState } from "react";
import DeleteAnalysis from "@features/analysis/ui/DeleteAnalysis";

const AnalysesList = () => {
  const { data, isLoading, error } = useGetAnalyses();
  const navigate = useNavigate();

  const [showForm, setShowForm] = useState(false);

  const analyses = data?.analyses || [];

  if (isLoading) return <p className="p-6 text-sm text-gray-500 dark:text-gray-400">Učitavanje...</p>;
  if (error) return <p className="p-6 text-sm text-error-500">{(error as Error).message}</p>;

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">Analize</h2>

        <button
          onClick={() => setShowForm((prev) => !prev)}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          {showForm ? "Zatvori" : "Dodaj analizu"}
        </button>
      </div>

      {showForm && <AddAnalysisNew />}

      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
        <div className="grid grid-cols-3 border-b border-gray-200 bg-gray-50 p-3 text-xs font-medium uppercase text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
          <div>Naziv</div>
          <div>Cena</div>
          <div>Obriši</div>
        </div>

        {analyses.map((a: any) => (
          <div
            key={a._id}
            className="grid grid-cols-3 items-center border-t border-gray-100 p-3 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]"
          >
            <div className="cursor-pointer font-medium text-gray-800 dark:text-white/90" onClick={() => navigate(`/analysisDetail/${a._id}`)}>{a.name}</div>
            <div>{a.price} RSD</div>
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