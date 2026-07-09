import React, { useState } from "react";
import { useAddCombinationToPatient } from "../hooks/useAddCombinationToPatient";
import { useGetCombinations } from "../hooks/useGetCombinations";

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
    <form onSubmit={handleSubmit} className="p-4 space-y-4 max-w-md">
      <h2 className="text-lg font-semibold">Dodaj kombinaciju</h2>

      {isLoading ? (
        <p>Učitavanje...</p>
      ) : (
        <div className="border rounded-lg divide-y">
          {groups.map((g: any) => (
            <div key={g._id}>
              
              <button
                type="button"
                onClick={() =>
                  setOpenGroup(openGroup === g._id ? null : g._id)
                }
                className="w-full text-left p-3 font-medium bg-gray-100 hover:bg-gray-200"
              >
                {g.name}
              </button>

              {openGroup === g._id && (
                <div className="p-2 space-y-2">
                  {g.combinations.map((c: any) => (
                    <div
                      key={c._id}
                      onClick={() => setSelectedId(c._id)}
                      className={`p-2 border rounded cursor-pointer ${
                        selectedId === c._id
                          ? "border-blue-500 bg-blue-50"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <p className="font-medium">{c.name}</p>

                      <div className="text-sm text-gray-500">
                        {c.analyses.map((a: any) => a.name).join(", ")}
                         
                      </div>
                    </div>
                  ))}
                  <button
                    disabled={isPending || !selectedId}
                    className="w-full bg-blue-600 text-white py-2 rounded disabled:bg-gray-400"
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