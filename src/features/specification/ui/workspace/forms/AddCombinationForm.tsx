import { useMemo, useState } from "react";
import { LuPlus, LuSearch } from "react-icons/lu";
import { useGetCombinations } from "@features/combinations/hooks/useGetCombinations";
import { useAddCombinationToPatient } from "@features/combinations/hooks/useAddCombinationToPatient";
import { inputClass } from "@shared/ui/form/Field";
import EmptyState from "@shared/ui/feedback/EmptyState";
import { Skeleton } from "@shared/ui/feedback/Spinner";
import { notify } from "@shared/lib/notify";
import { formatRSD } from "@shared/lib/format";
import { matchesSearch } from "@shared/lib/search";


export default function AddCombinationForm({ patientId, specificationId }: { patientId: string; specificationId?: string }) {
  const { data: groups = [], isLoading } = useGetCombinations();
  const { mutate, isPending, variables } = useAddCombinationToPatient();
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim();
    return groups.flatMap((g) =>
      (g.combinations ?? [])
        .map((c) => ({
          ...c,
          groupName: g.name,
          price: (c.analyses ?? []).reduce((sum, a) => sum + (Number(a.price) || 0), 0),
        }))
        .filter(
          (c) =>
            !q ||
            matchesSearch(c.name, q) ||
            matchesSearch(g.name, q) ||
            (c.analyses ?? []).some((a) => matchesSearch(a.name, q))
        )
    );
  }, [groups, query]);

  const add = (combinationId: string, name: string) =>
    mutate(
      { patientId, combinationId, specificationId },
      {
        onSuccess: () => notify.success(`${name}: dodato u specifikaciju.`),
        onError: (err) => notify.error(err),
      }
    );

  return (
    <div className="space-y-3">
      <div className="relative">
        <LuSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Pretraži kombinacije ili analize..."
          className={`${inputClass} pl-9`}
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState compact title="Nema kombinacija" description={query ? "Probajte drugi pojam." : undefined} />
      ) : (
        <ul className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
          {rows.map((c) => {
            const adding = isPending && variables?.combinationId === c._id;
            return (
              <li
                key={`${c.groupName}-${c._id}`}
                className="flex items-start gap-3 rounded-xl border border-gray-200 p-3 dark:border-gray-800"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">{c.name}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                    {(c.analyses ?? []).map((a) => a.name).join(", ")}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {c.groupName} · <span className="font-medium text-gray-700 dark:text-gray-300">{formatRSD(c.price)}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => add(c._id, c.name)}
                  disabled={isPending}
                  aria-label={`Dodaj ${c.name}`}
                  className="flex h-8 shrink-0 items-center gap-1 rounded-lg bg-brand-50 px-2.5 text-xs font-medium text-brand-600 transition hover:bg-brand-100 disabled:opacity-50 dark:bg-brand-500/15 dark:text-brand-400 dark:hover:bg-brand-500/25"
                >
                  <LuPlus className="h-3.5 w-3.5" />
                  {adding ? "..." : "Dodaj"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
