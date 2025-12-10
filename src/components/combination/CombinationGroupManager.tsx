import { useState, useMemo } from "react";
import EditAnalysis from "../../pages/Analysis/EditAnalysis";
import { useCombinations } from "../../hooks/Patient/useCombination";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

interface AddCombinationRQProps {
  patientId?: string;
}

export default function AddCombinationRQ({ patientId }: AddCombinationRQProps) {
  const { token } = useAuth();

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

  // ✅ UKUPNA CENA
  const totalPrice = useMemo(
    () =>
      analyses
        .filter((a) => selectedAnalysisIds.includes(a._id))
        .reduce((sum, a) => sum + (a.price || 0), 0),
    [analyses, selectedAnalysisIds]
  );

  // ✅ DODAVANJE KOMBINACIJE
  const handleAddCombination = async () => {
    if (!comboName.trim()) return alert("Unesite ime kombinacije");
    if (!selectedGroupId && !newGroupName.trim())
      return alert("Izaberite grupu ili unesite novu");
    if (selectedAnalysisIds.length === 0) return alert("Izaberite analize");

    const comboData = await addCombination.mutateAsync({
      name: comboName,
      group: "",
      analysisIds: selectedAnalysisIds,
    });

    const combinationId = comboData.combination._id;

    const groupName =
      selectedGroupId === "__new"
        ? newGroupName.trim()
        : groups.find((g) => g._id === selectedGroupId)?.name;

    await addCombinationToGroup.mutateAsync({
      name: groupName!,
      combinations: [combinationId],
    });

    setComboName("");
    setSelectedAnalysisIds([]);
    setSelectedGroupId("");
    setNewGroupName("");
  };

  // ✅ BRISANJE ANALIZE
  const deleteAnalysis = async (analysisId: string) => {
    if (!confirm("Obrisati analizu?")) return;

    await axios.delete(
      `https://medikalija-api.vercel.app/api/analysis/${analysisId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    getGroupsWithCombinations.refetch();
  };

  // ✅ BRISANJE KOMBINACIJE
  const deleteCombination = async (comboId: string) => {
    if (!confirm("Obrisati kombinaciju?")) return;

    await axios.delete(
      `https://medikalija-api.vercel.app/api/combinations/${comboId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    getGroupsWithCombinations.refetch();
  };

  // ✅ BRISANJE CELE GRUPE
  const deleteGroup = async (groupId: string) => {
    if (!confirm("OBRISATI CELOU GRUPU?")) return;

    await axios.delete(
      `https://medikalija-api.vercel.app/api/combination-groups/${groupId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    getGroupsWithCombinations.refetch();
  };

  if (isAnalysesLoading) return <p>Loading analyses...</p>;

  return (
    <div className="p-4 bg-white rounded shadow space-y-6">

      {/* ✅ LISTA ANALIZA */}
      <div>
        <h2 className="font-bold text-lg mb-3">Lista analiza</h2>
        <ul className="space-y-2">
          {analyses.map((a) => (
            <li key={a._id} className="flex justify-between items-center border p-2 rounded">
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

              <div className="flex gap-2">
                <EditAnalysis analysisId={a._id} currentPrice={a.price} onUpdated={() => {}} />

                <button
                  onClick={() => deleteAnalysis(a._id)}
                  className="bg-red-600 text-white px-2 py-1 rounded text-sm"
                >
                  Obriši
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* ✅ DODAVANJE KOMBINACIJE */}
      <div className="flex flex-wrap gap-2">
        <input
          value={comboName}
          onChange={(e) => setComboName(e.target.value)}
          placeholder="Ime kombinacije"
          className="border p-2 rounded"
        />

        <select
          value={selectedGroupId}
          onChange={(e) => setSelectedGroupId(e.target.value)}
          className="border p-2 rounded"
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
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Nova grupa"
            className="border p-2 rounded"
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

      {/* ✅ GRUPE + KOMBINACIJE */}
      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group._id} className="border rounded p-4 shadow">

            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-lg">{group.name}</h3>

              <button
                onClick={() => deleteGroup(group._id)}
                className="bg-red-700 text-white px-3 py-1 rounded text-sm"
              >
                Obriši grupu
              </button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader>Naziv</TableCell>
                  <TableCell isHeader>Analize</TableCell>
                  <TableCell isHeader>Cena</TableCell>
                  <TableCell isHeader>Akcije</TableCell>
                </TableRow>
              </TableHeader>

              <TableBody>
                {group.combinations.map((combo: any) => {
                  const total =
                    combo.analyses?.reduce((sum: number, a: any) => sum + (a.price || 0), 0) || 0;

                  return (
                    <TableRow key={combo._id}>
                      <TableCell>{combo.name}</TableCell>
                      <TableCell>
                        {combo.analyses?.map((a: any) => a.name).join(" + ")}
                      </TableCell>
                      <TableCell>{total} RSD</TableCell>
                      <TableCell>
                        <button
                          onClick={() => deleteCombination(combo._id)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Obriši
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ))}
      </div>
    </div>
  );
}
