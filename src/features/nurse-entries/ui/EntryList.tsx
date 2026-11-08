import { useMemo, useState } from "react";
import { LuUndo2 } from "react-icons/lu";
import { formatWhen, TYPE_ICON } from "./display";
import Tabs from "@shared/ui/tabs/Tabs";
import Badge from "@shared/ui/badge/Badge";
import { ConfirmDialog } from "@shared/ui/dialog/Dialog";
import EmptyState, { ErrorState } from "@shared/ui/feedback/EmptyState";
import { Skeleton } from "@shared/ui/feedback/Spinner";
import { notify } from "@shared/lib/notify";
import { formatQty, formatRSD } from "@shared/lib/format";
import { useAuth } from "@app/providers/AuthContext";
import { isPending, NurseEntry, personName, STATUS_META, useCancelEntry, useNurseEntries, type EntryType } from "@features/nurse-entries/model";

type Range = "today" | "week" | "all";

const startOf = (range: Range) => {
  if (range === "all") return undefined;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (range === "week") d.setDate(d.getDate() - 6);
  return d.toISOString();
};

// Istorija nege i unosa sestara za pacijenta, sa ishodom odobravanja.
export default function EntryList({ patientId, mine = false, type }: { patientId?: string; mine?: boolean; type?: EntryType[] }) {
  const { user } = useAuth();
  const [range, setRange] = useState<Range>("today");
  const from = useMemo(() => startOf(range), [range]);
  const { data = [], isLoading, isError, refetch } = useNurseEntries({ patientId, mine, from, type, limit: 300 });
  const cancel = useCancelEntry();
  const [toCancel, setToCancel] = useState<NurseEntry | null>(null);

  const canCancel = (e: NurseEntry) => (isPending(e) || e.status === "logged") && String(e.createdBy?._id) === String(user?._id);

  return (
    <div className="space-y-4">
      <Tabs
        variant="pills"
        value={range}
        onChange={setRange}
        items={[
          { value: "today", label: "Danas" },
          { value: "week", label: "7 dana" },
          { value: "all", label: "Sve" },
        ]}
      />

      {isError ? (
        <ErrorState message="Unosi nisu učitani." onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <EmptyState compact title={range === "today" ? "Danas još nema unosa" : "Nema unosa"} />
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {data.map((e) => {
            const meta = STATUS_META[e.status];
            return (
              <li key={e._id} className="flex items-start gap-3 py-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-gray-400">
                  {TYPE_ICON[e.type]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white/90">
                    {e.name}
                    <span className="ml-1.5 font-normal text-gray-500">× {formatQty(e.acceptedAmount ?? e.amount)}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {formatWhen(e.performedAt)} · {personName(e.createdBy) || "Nepoznato"}
                    {!patientId && typeof e.patient === "object" && ` · ${personName(e.patient)}`}
                  </p>
                  {e.note && <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">„{e.note}”</p>}
                  {e.status === "rejected" && (
                    <p className="mt-1 text-xs text-error-600 dark:text-error-400">
                      Odbio/la {personName(e.reviewedBy) || "uprava"}
                      {e.rejectReason ? `: ${e.rejectReason}` : ""}
                    </p>
                  )}
                  {e.status === "accepted" && e.chargedPrice > 0 && (
                    <p className="mt-1 text-xs text-gray-500">Naplaćeno {formatRSD(e.chargedPrice)}</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <Badge size="sm" color={meta.color}>
                    {meta.label}
                  </Badge>
                  {canCancel(e) && (
                    <button
                      type="button"
                      onClick={() => setToCancel(e)}
                      className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-error-600"
                      aria-label={`Povuci unos ${e.name}`}
                    >
                      <LuUndo2 className="h-3.5 w-3.5" /> Povuci
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={!!toCancel}
        onClose={() => setToCancel(null)}
        title="Povući unos?"
        description={toCancel ? `„${toCancel.name}” će biti obrisan. Koristite ovo ako je unos greškom napravljen.` : ""}
        confirmText="Povuci unos"
        loading={cancel.isPending}
        onConfirm={() =>
          toCancel &&
          cancel.mutate(toCancel._id, {
            onSuccess: () => {
              notify.success("Unos je povučen.");
              setToCancel(null);
            },
            onError: (err) => notify.error(err),
          })
        }
      />
    </div>
  );
}
