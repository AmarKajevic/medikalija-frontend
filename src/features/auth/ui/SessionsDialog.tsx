import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LuLaptop, LuSmartphone } from "react-icons/lu";
import { api } from "@shared/api/api";
import Dialog from "@shared/ui/dialog/Dialog";
import Button from "@shared/ui/button/Button";
import Badge from "@shared/ui/badge/Badge";
import { Skeleton } from "@shared/ui/feedback/Spinner";
import { ErrorState } from "@shared/ui/feedback/EmptyState";
import { notify } from "@shared/lib/notify";
import { describeDevice } from "@features/auth/model";

export interface SessionInfo {
  id: string;
  method: "password" | "google";
  userAgent: string;
  ip: string;
  createdAt: string;
  lastUsedAt: string;
  current: boolean;
}

const when = (iso: string) => new Date(iso).toLocaleString("sr-Latn-RS", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
const KEY = ["authSessions"];

// Prijavljeni uređaji: gde je nalog otvoren; odjava jednog ili svih ostalih (npr. zaboravljen računar).
export default function SessionsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { data = [], isLoading, isError, refetch } = useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<SessionInfo[]> => (await api.get("/api/auth/sessions")).data.sessions ?? [],
    enabled: open,
  });
  const done = (message: string) => {
    notify.success(message);
    qc.invalidateQueries({ queryKey: KEY });
  };
  const endOne = useMutation({
    mutationFn: (id: string) => api.delete(`/api/auth/sessions/${id}`),
    onSuccess: () => done("Uređaj je odjavljen."),
    onError: (e) => notify.error(e),
  });
  const endOthers = useMutation({
    mutationFn: async () => (await api.post("/api/auth/sessions/revoke-others")).data.message as string,
    onSuccess: (message) => done(message),
    onError: (e) => notify.error(e),
  });
  const others = data.filter((s) => !s.current).length;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Prijavljeni uređaji"
      description="Gde je vaš nalog trenutno otvoren. Ako ne prepoznajete uređaj, odjavite ga i promenite lozinku."
      size="md"
      footer={
        <Button size="sm" variant="outline" disabled={others === 0} loading={endOthers.isPending} onClick={() => endOthers.mutate()}>
          Odjavi sve ostale uređaje
        </Button>
      }
    >
      {isError ? (
        <ErrorState message="Uređaji nisu učitani." onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {data.map((s) => {
            const device = describeDevice(s.userAgent);
            return (
              <li key={s.id} className="flex items-center gap-3 py-3">
                <span className="text-gray-400">{device.mobile ? <LuSmartphone className="h-5 w-5" /> : <LuLaptop className="h-5 w-5" />}</span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-800 dark:text-white/90">
                    {device.label}
                    {s.current && <Badge size="sm" color="success">Ovaj uređaj</Badge>}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Poslednja aktivnost {when(s.lastUsedAt)} · prijava {when(s.createdAt)}
                    {s.method === "google" ? " (Google)" : ""}
                    {s.ip ? ` · ${s.ip}` : ""}
                  </p>
                </div>
                {!s.current && (
                  <Button size="xs" variant="outline" disabled={endOne.isPending} onClick={() => endOne.mutate(s.id)} aria-label={`Odjavi ${device.label}`}>
                    Odjavi
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Dialog>
  );
}
