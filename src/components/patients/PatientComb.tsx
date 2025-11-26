import { useState } from "react";
import { useCombinations } from "../../hooks/Patient/useCombination";
import ComponentCard from "../common/ComponentCard";
import Select from "../form/Select";

export default function PatientComb({ patientId }: { patientId: string }) {
  const {
    getGroupsWithCombinations,
    addCombinationToPatient,
  } = useCombinations(patientId);

  const groups = getGroupsWithCombinations.data || [];
  const isLoading = getGroupsWithCombinations.isLoading;

  const [selectedCombo, setSelectedCombo] = useState<{ [key: string]: string }>({});

  if (isLoading) return <p>Učitavanje grupa i kombinacija...</p>;
  if (!groups || groups.length === 0) return <p>Nema dostupnih grupa.</p>;

  const handleAddToPatient = (groupId: string) => {
    const combinationId = selectedCombo[groupId];
    if (!combinationId) return;
    addCombinationToPatient.mutate({ patientId, combinationId });
  };

  return (
    <ComponentCard title="Izaberite Kombinaciju">
      {groups.map((group: any) => {
        const options = group.combinations.map((combo: any) => {
          const analyses =
            Array.isArray(combo.analyses) && combo.analyses.length > 0
              ? combo.analyses.map((a: any) => a.name).join(", ")
              : "Analize nisu učitane";

          return {
            value: combo._id,
            label: `${combo.name} - ${analyses}`,
          };
        });

        return (
          <div key={group._id} className="mb-6 border-b pb-4 last:border-none">
            <h3 className="text-lg font-bold text-gray-800 mb-2">{group.name}</h3>

            {group.combinations.length === 0 ? (
              <p className="text-gray-500 text-sm">Nema kombinacija u ovoj grupi.</p>
            ) : (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Select
                  options={options}
                  placeholder="-- Izaberi kombinaciju --"
                  defaultValue={selectedCombo[group._id] || ""}
                  onChange={(value) =>
                    setSelectedCombo((prev) => ({
                      ...prev,
                      [group._id]: value,
                    }))
                  }
                  className="flex-1"
                />

                <button
                  onClick={() => handleAddToPatient(group._id)}
                  disabled={
                    !selectedCombo[group._id] ||
                    addCombinationToPatient.isPending
                  }
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50 w-full sm:w-auto"
                >
                  {addCombinationToPatient.isPending ? "Dodavanje..." : "Dodaj pacijentu"}
                </button>
              </div>
            )}

            {selectedCombo[group._id] && (
              <div className="mt-3 pl-3 border-l-2 border-gray-200">
                {group.combinations
                  .find((c: any) => c._id === selectedCombo[group._id])
                  ?.analyses?.map((a: any) => (
                    <div
                      key={a._id}
                      className="flex justify-between text-sm text-gray-700"
                    >
                      <span>{a.name}</span>
                      <span>{a.price} RSD</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        );
      })}
    </ComponentCard>
  );
}
