import { useState, useMemo } from "react";
import EditAnalysis from "../../pages/Analysis/EditAnalysis";
import { useCombinations } from "../../hooks/Patient/useCombination";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";

interface AddCombinationRQProps {
  patientId?: string;
}

export default function AddCombinationRQ({ patientId }: AddCombinationRQProps) {
  const [comboName, setComboName] = useState("");
  const [selectedAnalysisIds, setSelectedAnalysisIds] = useState<string[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [newGroupName, setNewGroupName] = useState("");

  const {
    analyses,
    isAnalysesLoading,
    getGroupsWithCombinations,
    addCombinationToGroup,
    addCombination,
  } = useCombinations(patientId!);

  const groups = getGroupsWithCombinations.data || [];

  // --- Ukupna cena selektovanih analiza ---
  const totalPrice = useMemo(
    () =>
      analyses
        .filter((a) => selectedAnalysisIds.includes(a._id))
        .reduce((sum, a) => sum + (a.price || 0), 0),
    [analyses, selectedAnalysisIds]
  );

  // --- Dodavanje nove kombinacije i u grupu ---
  const handleAddCombination = async () => {
    if (!comboName.trim()) return alert("Unesite ime kombinacije");
    if (!selectedGroupId && !newGroupName.trim())
      return alert("Izaberite grupu ili unesite novu");
    if (selectedAnalysisIds.length === 0) return alert("Izaberite analize");

    try {
      // 1️⃣ Kreiramo kombinaciju preko React Query mutation
      const comboData = await addCombination.mutateAsync({
        name: comboName,
        group: "", // grupu dodajemo naknadno
        analysisIds: selectedAnalysisIds,
      });

      const combinationId = comboData.combination._id;

      // 2️⃣ Odredi naziv grupe
      const groupName =
        selectedGroupId === "__new"
          ? newGroupName.trim()
          : groups.find((g) => g._id === selectedGroupId)?.name;

      if (!groupName) return alert("Greška: naziv grupe nije definisan");

      // 3️⃣ Dodaj kombinaciju u grupu preko React Query mutation
      await addCombinationToGroup.mutateAsync({
        name: groupName,
        combinations: [combinationId],
      });

      // Reset forme
      setComboName("");
      setSelectedAnalysisIds([]);
      setSelectedGroupId("");
      setNewGroupName("");
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "Greška pri dodavanju kombinacije");
    }
  };

  if (isAnalysesLoading) return <p>Loading analyses...</p>;

  return (
    <div className="p-4 bg-white rounded shadow space-y-6">
      {/* --- Lista analiza --- */}
      <div>
        <h2 className="font-bold text-lg mb-3">Lista analiza</h2>
        <ul className="space-y-2">
          {analyses.map((a) => (
            <li
              key={a._id}
              className="flex justify-between items-center border p-2 rounded"
            >
              <div>
                <input
                  type="checkbox"
                  value={a._id}
                  checked={selectedAnalysisIds.includes(a._id)}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedAnalysisIds((prev) =>
                      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                    );
                  }}
                  className="mr-2"
                />
                {a.name} – {a.price} RSD
              </div>
              <EditAnalysis analysisId={a._id} currentPrice={a.price} onUpdated={() => {}} />
            </li>
          ))}
        </ul>
      </div>

      {/* --- Forma za dodavanje kombinacije --- */}
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-x-2 md:space-y-0">
        <input
          type="text"
          value={comboName}
          onChange={(e) => setComboName(e.target.value)}
          placeholder="Ime kombinacije"
          className="border p-2 rounded flex-1"
        />

        <select
          value={selectedGroupId}
          onChange={(e) => setSelectedGroupId(e.target.value)}
          className="border p-2 rounded flex-1"
        >
          <option value="">-- Izaberi grupu --</option>
          {groups.map((g) => (
            <option key={g._id} value={g._id}>
              {g.name}
            </option>
          ))}
          <option value="__new">+ Nova grupa</option>
        </select>

        {selectedGroupId === "__new" && (
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Unesi novu grupu"
            className="border p-2 rounded flex-1"
          />
        )}

        <span className="font-semibold">UKUPNO: {totalPrice} RSD</span>
        <button
          onClick={handleAddCombination}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Dodaj kombinaciju
        </button>
      </div>

     {/* --- Prikaz kombinacija po grupama --- */}
<div>
  <h2 className="font-bold text-lg mb-3">Kombinacije po grupama</h2>

  {groups.length === 0 ? (
    <p className="text-gray-500">Nema kombinacija.</p>
  ) : (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group._id} className="p-4 border rounded-lg bg-white shadow-sm">
          <h3 className="font-semibold text-lg mb-3 text-gray-800">{group.name}</h3>

          {group.combinations.length === 0 ? (
            <p className="text-gray-500 text-sm">Nema kombinacija u ovoj grupi</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableCell isHeader className="px-4 py-2 font-semibold text-gray-600 w-1/4">
                      Naziv kombinacije
                    </TableCell>
                    <TableCell isHeader className="px-4 py-2 font-semibold text-gray-600 w-2/4">
                      Analize
                    </TableCell>
                    <TableCell isHeader className="px-4 py-2 font-semibold text-gray-600 w-1/4 text-right">
                      Cena
                    </TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {group.combinations.map((combo) => {
                    const total =
                      combo.analyses?.reduce((sum: number, a: any) => sum + (a.price || 0), 0) ||
                      combo.totalPrice ||
                      0;

                    return (
                      <TableRow key={combo._id} className="border-b last:border-none">
                        <TableCell className="px-4 py-2 font-medium text-gray-800">
                          {combo.name}
                        </TableCell>

                        <TableCell className="px-4 py-2 text-gray-600">
                          {combo.analyses?.map((a: any) => a.name).join(" + ") || "-"}
                        </TableCell>

                        <TableCell className="px-4 py-2 font-semibold text-gray-900 text-right">
                          {total} RSD
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      ))}
    </div>
  )}
</div>
    </div>
  );
}
