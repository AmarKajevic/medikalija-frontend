import { useState, useEffect, useRef } from "react";
import { useAddCombination } from "@features/combinations/hooks/useAddCombination";
import { useForm } from "react-hook-form";
import { useGetAnalyses } from "@features/analysis/hooks/useGetAnalyses";
import { useGetCombinations } from "@features/combinations/hooks/useGetCombinations";

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

  const fieldInputClass =
    "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Polje za grupu – dropdown */}
      <div className="relative ">
        <input
          ref={groupInputRef}
          placeholder="Naziv grupe"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          onFocus={() => setShowGroupDropdown(true)}
          className={fieldInputClass}
          required
        />
        {showGroupDropdown && (
          <div
            ref={dropdownRef}
            className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-900"
          >
            {groupsLoading ? (
              <div className="p-2 text-sm text-gray-500 dark:text-gray-400">Učitavanje...</div>
            )  : (
              filteredGroups.map((g: any) => (
                <div
                  key={g._id}
                  className="cursor-pointer p-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                  onClick={() => selectGroup(g.name)}
                >
                  {g.name}
                </div>
              ))
            )}
          </div>
        )}
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          {groupsLoading
            ? "Učitavanje grupa..."
            : "Izaberite postojeću ili upišite novu"}
        </p>
      </div>

      {/* Naziv kombinacije */}
      <input
        placeholder="Naziv kombinacije"
        {...register("name", { required: true })}
        className={fieldInputClass}
      />

      {/* Pretraga analiza */}
      <input
        type="text"
        placeholder="Pretraži analize..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={fieldInputClass}
      />

      {/* Lista analiza sa checkbox-ovima */}
      <div className="max-h-90 max-w-3xl space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-2 dark:border-gray-800">
        {isLoading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Učitavanje...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Nema rezultata</p>
        ) : (
          filtered.map((a: any) => (
            <label
              key={a._id}
              className="flex cursor-pointer items-center gap-2 rounded p-1 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
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
              className="rounded bg-brand-50 px-2 py-1 text-sm text-brand-500 dark:bg-brand-500/15 dark:text-brand-400"
            >
              {item?.name}
            </span>
          );
        })}
      </div>

      <button
        disabled={isPending}
        className="w-full rounded-lg bg-brand-500 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:bg-gray-400"
      >
        {isPending ? "Čuvanje..." : "Sačuvaj"}
      </button>
    </form>
  );
};

export default AddCombinationForm;