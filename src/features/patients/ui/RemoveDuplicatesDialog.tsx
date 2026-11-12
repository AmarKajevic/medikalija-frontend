import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LuCircleAlert, LuCopy } from "react-icons/lu";
import { api } from "@shared/api/api";
import Button from "@shared/ui/button/Button";
import Dialog from "@shared/ui/dialog/Dialog";
import EmptyState from "@shared/ui/feedback/EmptyState";
import { Skeleton } from "@shared/ui/feedback/Spinner";
import { notify } from "@shared/lib/notify";

interface DuplicatePlan {
  groups: Array<{ name: string; keep: { _id: string; documents: number }; remove: string[]; skipped: Array<{ _id: string; documents: number }> }>;
  removeCount: number;
  skippedCount: number;
}

// Pacijenti sa istim imenom i prezimenom: ostaje onaj sa najviše dokumentacije (pa najstariji),
// brišu se samo duplikati bez ikakve dokumentacije. Pre brisanja se prikazuje šta će se desiti.
export default function RemoveDuplicatesDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const plan = useQuery({
    queryKey: ["patients", "duplicates"],
    queryFn: async () => (await api.get("/api/patient/duplicates")).data as DuplicatePlan,
    enabled: open,
    staleTime: 0,
  });
  const remove = useMutation({
    mutationFn: async () => (await api.post("/api/patient/duplicates/remove")).data as { message: string; removed: number },
    onSuccess: (res) => {
      notify.success(res.message);
      qc.invalidateQueries({ queryKey: ["patients"] });
      onClose();
    },
    onError: (err) => notify.error(err),
  });

  const data = plan.data;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="md"
      title="Brisanje duplikata"
      description="Korisnici sa istim imenom i prezimenom. Ostaje onaj koji ima dokumentaciju (ili najstariji); brišu se samo duplikati bez ikakvih podataka."
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Otkaži
          </Button>
          <Button size="sm" variant="danger" disabled={!data || data.removeCount === 0} loading={remove.isPending} onClick={() => remove.mutate()}>
            {data && data.removeCount > 0 ? `Obriši duplikate (${data.removeCount})` : "Obriši duplikate"}
          </Button>
        </>
      }
    >
      {plan.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      ) : plan.isError ? (
        <p className="text-sm text-error-600">Duplikati nisu učitani.</p>
      ) : !data || data.groups.length === 0 ? (
        <EmptyState compact icon={<LuCopy />} title="Nema duplikata" description="Nijedno ime i prezime se ne ponavlja." />
      ) : (
        <div className="space-y-3">
          {data.skippedCount > 0 && (
            <p className="flex gap-2 rounded-lg bg-warning-50 px-3 py-2 text-xs text-warning-800 dark:bg-warning-500/10 dark:text-warning-300">
              <LuCircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              {data.skippedCount} duplikata ima dokumentaciju (specifikacije, unose, izveštaje…) i neće biti obrisano — proverite ih ručno.
            </p>
          )}
          <ul className="max-h-[360px] divide-y divide-gray-100 overflow-y-auto rounded-lg border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
            {data.groups.map((g) => (
              <li key={g.keep._id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span className="min-w-0 truncate font-medium text-gray-800 dark:text-white/90">{g.name}</span>
                <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                  briše se {g.remove.length}
                  {g.skipped.length > 0 && ` · sa podacima ${g.skipped.length}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Dialog>
  );
}
