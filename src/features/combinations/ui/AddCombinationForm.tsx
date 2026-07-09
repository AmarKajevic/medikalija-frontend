import { useState, useEffect, useRef } from "react";
import { useAddCombination } from "../hooks/useAddCombination";
import { useForm } from "react-hook-form";
import { useGetAnalyses } from "../../analysis/hooks/useGetAnalyses";
import { useGetCombinations } from "../hooks/useGetCombinations";

const AddCombinationForm = () => {
  const { mutate, isPending } = useAddCombination();
  const { register, handleSubmit, reset } = useForm();
  const { data, isLoading } = useGetAnalyses();
  const { data: groupsData, isLoading: groupsLoading } = useGetCombinations();

  const analyses = data?.analyses || [];
  const groups = groupsData || [];

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  // State za grupu
  const [groupName, setGroupName] = useState("");
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const groupInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filtriranje grupa prema unosu
  const filteredGroups = groups.filter((g: any) =>
    g.name.toLowerCase().includes(groupName.toLowerCase())
  );

  // Zatvaranje dropdowna klikom van
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        groupInputRef.current &&
        !groupInputRef.current.contains(event.target as Node)
      ) {
        setShowGroupDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Odabir grupe iz dropdowna
  const selectGroup = (name: string) => {
    setGroupName(name);
    setShowGroupDropdown(false);
  };

  // Filtriranje analiza za checkbox listu
  const filtered = analyses.filter((a: any) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleAnalysis = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const onSubmit = (formData: any) => {
    // Obavezno polje – grupa mora biti uneta
    if (!groupName.trim()) {
      alert("Molimo unesite naziv grupe");
      return;
    }

    mutate(
      {
        name: formData.name,
        groupName: groupName, // koristi unos iz state-a
        analysisIds: selected,
      },
      {
        onSuccess: () => {
          reset();
          setSelected([]);
          setGroupName(""); // resetuj grupu
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Polje za grupu – dropdown */}
      <div className="relative ">
        <input
          ref={groupInputRef}
          placeholder="Naziv grupe"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          onFocus={() => setShowGroupDropdown(true)}
          className="border p-2 w-full bg-white rounded-lg"
          required
        />
        {showGroupDropdown && (
          <div
            ref={dropdownRef}
            className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg"
          >
            {groupsLoading ? (
              <div className="p-2 text-gray-500">Učitavanje...</div>
            )  : (
              filteredGroups.map((g: any) => (
                <div
                  key={g._id}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => selectGroup(g.name)}
                >
                  {g.name}
                </div>
              ))
            )}
          </div>
        )}
        <p className="text-xs text-gray-400 mt-1">
          {groupsLoading
            ? "Učitavanje grupa..."
            : "Izaberite postojeću ili upišite novu"}
        </p>
      </div>

      {/* Naziv kombinacije */}
      <input
        placeholder="Naziv kombinacije"
        {...register("name", { required: true })}
        className="border p-2 w-full bg-white rounded-lg"
      />

      {/* Pretraga analiza */}
      <input
        type="text"
        placeholder="Pretraži analize..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border p-2 w-full bg-white rounded-lg"
      />

      {/* Lista analiza sa checkbox-ovima */}
      <div className="border rounded-lg max-h-90 max-w-3xl overflow-y-auto p-2 space-y-1 bg-white ">
        {isLoading ? (
          <p>Učitavanje...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-500">Nema rezultata</p>
        ) : (
          filtered.map((a: any) => (
            <label
              key={a._id}
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded"
            >
              <input
                type="checkbox"
                checked={selected.includes(a._id)}
                onChange={() => toggleAnalysis(a._id)}
              />
              <span>{a.name}</span>
            </label>
          ))
        )}
      </div>

      {/* Prikaz odabranih analiza */}
      <div className="flex flex-wrap gap-2">
        {selected.map((id) => {
          const item = analyses.find((a: any) => a._id === id);
          return (
            <span
              key={id}
              className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm"
            >
              {item?.name}
            </span>
          );
        })}
      </div>

      <button
        disabled={isPending}
        className="w-full bg-blue-600 text-white py-2 rounded-lg disabled:bg-gray-400"
      >
        {isPending ? "Čuvanje..." : "Sačuvaj"}
      </button>
    </form>
  );
};

export default AddCombinationForm;