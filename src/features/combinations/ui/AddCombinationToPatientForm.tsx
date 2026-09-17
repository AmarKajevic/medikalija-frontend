import React, { useState } from "react";
import { useAddCombinationToPatient } from "@features/combinations/hooks/useAddCombinationToPatient";
import { useGetCombinations } from "@features/combinations/hooks/useGetCombinations";

const AddCombinationToPatientForm = ({ patientId }: { patientId: string }) => {
  const { mutate, isPending } = useAddCombinationToPatient();
  const { data, isLoading } = useGetCombinations();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const groups = data || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedId) return;

    mutate(
      {
        patientId,
        combinationId: selectedId,
      },
      {
        onSuccess: () => setSelectedId(null),
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">Dodaj kombinaciju</h2>

      {isLoading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Učitavanje...</p>
      ) : (
        <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
          {groups.map((g: any) => (
            <div key={g._id}>

              <button
                type="button"
                onClick={() =>
                  setOpenGroup(openGroup === g._id ? null : g._id)
                }
                className="w-full bg-gray-50 p-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-100 dark:bg-white/[0.03] dark:text-white/90 dark:hover:bg-white/[0.06]"
              >
                {g.name}
              </button>

              {openGroup === g._id && (
                <div className="space-y-2 p-2">
                  {g.combinations.map((c: any) => (
                    <div
                      key={c._id}
                      onClick={() => setSelectedId(c._id)}
                      className={`cursor-pointer rounded border p-2 ${
                        selectedId === c._id
                          ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                          : "border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.03]"
                      }`}
                    >
                      <p className="font-medium text-gray-800 dark:text-white/90">{c.name}</p>

                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {c.analyses.map((a: any) => a.name).join(", ")}

                      </div>
                    </div>
                  ))}
                  <button
                    disabled={isPending || !selectedId}
                    className="w-full rounded-lg bg-brand-500 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:bg-gray-400"
                >
                    {isPending ? "Dodavanje..." : "Dodaj"}
                </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}


    </form>
  );
};

export default AddCombinationToPatientForm;