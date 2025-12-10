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

  const totalPrice = useMemo(
    () =>
      analyses
        .filter((a) => selectedAnalysisIds.includes(a._id))
        .reduce((sum, a) => sum + (a.price || 0), 0),
    [analyses, selectedAnalysisIds]
  );

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

  const deleteAnalysis = async (analysisId: string) => {
    if (!confirm("Obrisati analizu?")) return;

    await axios.delete(
      `https://medikalija-api.vercel.app/api/analysis/${analysisId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    getGroupsWithCombinations.refetch();
  };

  const deleteCombination = async (comboId: string) => {
    if (!confirm("Obrisati kombinaciju?")) return;

    await axios.delete(
      `https://medikalija-api.vercel.app/api/analysis/combination/combinations/${comboId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    getGroupsWithCombinations.refetch();
  };

  const deleteGroup = async (groupId: string) => {
    if (!confirm("OBRISATI CELOU GRUPU?")) return;

    await axios.delete(
      `https://medikalija-api.vercel.app/api/combinationGroup/combination-groups/${groupId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    getGroupsWithCombinations.refetch();
  };

  if (isAnalysesLoading) return <p className="text-gray-500">Učitavanje analiza...</p>;

  return (
    <div className="space-y-10 p-6 bg-gray-50 rounded-xl">

      {/* ================= ANALIZE ================= */}
      <div className="bg-white rounded-xl shadow p-5">
        <h2 className="text-lg font-semibold border-b pb-3 mb-4">
          📊 Lista analiza
        </h2>

        <ul className="grid md:grid-cols-2 gap-3">
          {analyses.map((a) => (
            <li
              key={a._id}
              className="flex justify-between items-center border rounded-lg p-3 hover:bg-gray-50 transition"
            >
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedAnalysisIds.includes(a._id)}
                  onChange={() =>
                    setSelectedAnalysisIds((prev) =>
                      prev.includes(a._id)
                        ? prev.filter((x) => x !== a._id)
                        : [...prev, a._id]
                    )
                  }
                  className="w-4 h-4 accent-blue-600"
                />
                <span className="font-medium">{a.name}</span>
                <span className="text-sm text-gray-500">{a.price} RSD</span>
              </label>

              <div className="flex gap-2">
                <EditAnalysis analysisId={a._id} currentPrice={a.price} onUpdated={() => {}} />
                <button
                  onClick={() => deleteAnalysis(a._id)}
                  className="text-white bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
                >
                  Obriši
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* ================= DODAVANJE KOMBINACIJE ================= */}
      <div className="bg-white rounded-xl shadow p-5">
        <h2 className="text-lg font-semibold border-b pb-3 mb-4">
          ➕ Nova kombinacija
        </h2>

        <div className="grid md:grid-cols-5 gap-3 items-center">
          <input
            value={comboName}
            onChange={(e) => setComboName(e.target.value)}
            placeholder="Ime kombinacije"
            className="border rounded-lg p-2"
          />

          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="border rounded-lg p-2"
          >
            <option value="">Izaberi grupu</option>
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
              className="border rounded-lg p-2"
            />
          )}

          <div className="font-bold text-blue-700 text-center">
            Ukupno: {totalPrice} RSD
          </div>

          <button
            onClick={handleAddCombination}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
          >
            Sačuvaj
          </button>
        </div>
      </div>

      {/* ================= GRUPE & KOMBINACIJE ================= */}
      <div className="space-y-8">
        {groups.map((group) => (
          <div key={group._id} className="bg-white rounded-xl shadow p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">📁 {group.name}</h3>

              <button
                onClick={() => deleteGroup(group._id)}
                className="text-red-600 border border-red-600 hover:bg-red-600 hover:text-white px-3 py-1 rounded text-sm"
              >
                Obriši grupu
              </button>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableCell isHeader>Naziv</TableCell>
                  <TableCell isHeader>Analize</TableCell>
                  <TableCell isHeader>Cena</TableCell>
                  <TableCell isHeader>Akcija</TableCell>
                </TableRow>
              </TableHeader>

              <TableBody>
                {group.combinations.map((combo: any) => {
                  const total =
                    combo.analyses?.reduce(
                      (sum: number, a: any) => sum + (a.price || 0),
                      0
                    ) || 0;

                  return (
                    <TableRow key={combo._id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{combo.name}</TableCell>
                      <TableCell className="text-gray-600">
                        {combo.analyses?.map((a: any) => a.name).join(" + ")}
                      </TableCell>
                      <TableCell className="font-semibold">{total} RSD</TableCell>
                      <TableCell>
                        <button
                          onClick={() => deleteCombination(combo._id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
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
