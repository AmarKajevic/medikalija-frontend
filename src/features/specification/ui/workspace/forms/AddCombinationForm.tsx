import { useMemo } from "react";
import { LuPlus } from "react-icons/lu";
import { useGetCombinations } from "@features/combinations/hooks/useGetCombinations";
import { useAddCombinationToPatient } from "@features/combinations/hooks/useAddCombinationToPatient";
import SearchGroup from "@shared/ui/group/SearchGroup";
import EmptyState from "@shared/ui/feedback/EmptyState";
import { Skeleton } from "@shared/ui/feedback/Spinner";
import { notify } from "@shared/lib/notify";
import { formatRSD } from "@shared/lib/format";

export default function AddCombinationForm({ patientId, specificationId }: { patientId: string; specificationId?: string }) {
  const { data: groups = [], isLoading } = useGetCombinations();
  const { mutate, isPending, variables } = useAddCombinationToPatient();
  // Kombinacije po grupama; svaka grupa se otvara posebno i ima svoju pretragu
  const sections = useMemo(
    () =>
      groups
        .map((g) => ({
          name: g.name,
          rows: (g.combinations ?? []).map((c) => ({
            ...c,
            groupName: g.name,
            price: (c.analyses ?? []).reduce((sum, a) => sum + (Number(a.price) || 0), 0),
          })),
        }))
        .filter((g) => g.rows.length > 0),
    [groups]
  );

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
      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : sections.length === 0 ? (
        <EmptyState compact title="Nema kombinacija" description="Kombinacije analiza pravi uprava u meniju Kombinacije analiza." />
      ) : (
        <div className="max-h-[480px] space-y-2 overflow-y-auto pr-1">
          {sections.map((g) => (
            <SearchGroup
              key={g.name}
              title={g.name}
              items={g.rows}
              getKey={(c) => `${g.name}-${c._id}`}
              searchText={(c) => `${c.name} ${(c.analyses ?? []).map((a) => a.name).join(" ")}`}
              searchPlaceholder="Pretraži kombinacije ili analize..."
              defaultOpen={sections.length === 1}
              renderItem={(c) => {
            const adding = isPending && variables?.combinationId === c._id;
            return (
              <div className="flex items-start gap-3 rounded-xl border border-gray-200 p-3 dark:border-gray-800">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">{c.name}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                    {(c.analyses ?? []).map((a) => a.name).join(", ")}
                  </p>
                  <p className="mt-1 text-xs font-medium text-gray-700 dark:text-gray-300">{formatRSD(c.price)}</p>
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
              </div>
            );
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
