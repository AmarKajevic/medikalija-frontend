import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/api/api";
import { refreshAfterSpecChange } from "@features/specification/lib/queries";

// ---------- tipovi ----------
export type EntryType = "medicine" | "article" | "care" | "physio";
export type PhysioKind = "active" | "passive" | "group";
export const PHYSIO_KIND_LABEL: Record<PhysioKind, string> = {
  active: "Individualna aktivna fizikalna terapija",
  passive: "Individualna pasivna fizikalna terapija",
  group: "Grupna fizikalna terapija",
};
export type EntryStatus = "pending" | "processing" | "accepted" | "rejected" | "logged";

export interface CareTask {
  _id: string;
  name: string;
  category: string;
  article: { _id: string; name: string; price?: number } | null;
  articleAmount: number;
  price: number;
  active: boolean;
  sortOrder?: number;
}

interface PersonRef {
  _id: string;
  name: string;
  lastName: string;
  role?: string;
}

export interface NurseEntry {
  _id: string;
  patient: PersonRef | string;
  type: EntryType;
  name: string;
  amount: number;
  note: string;
  performedAt: string;
  createdBy: PersonRef | null;
  status: EntryStatus;
  reviewedBy: PersonRef | null;
  reviewedAt: string | null;
  rejectReason: string;
  acceptedAmount: number | null;
  chargedPrice: number;
  /** Fizikalna terapija */
  physioKind?: PhysioKind | null;
  extra?: boolean;
}

export interface NewEntry {
  type: EntryType;
  itemId?: string;
  physioKind?: PhysioKind;
  extra?: boolean;
  amount?: number;
  note?: string;
  performedAt?: string;
}

export interface EntryQuery {
  patientId?: string;
  status?: EntryStatus[];
  mine?: boolean;
  from?: string;
  to?: string;
  /** Samo unosi ovog korisnika (uprava) */
  createdBy?: string;
  type?: EntryType[];
  limit?: number;
}

export const STATUS_META: Record<EntryStatus, { label: string; color: "warning" | "success" | "error" | "light" | "info" }> = {
  pending: { label: "Čeka odobrenje", color: "warning" },
  processing: { label: "Čeka odobrenje", color: "warning" },
  accepted: { label: "U specifikaciji", color: "success" },
  rejected: { label: "Odbijeno", color: "error" },
  logged: { label: "Zabeleženo", color: "light" },
};

export const TYPE_LABEL: Record<EntryType, string> = { medicine: "Lek", article: "Artikal", care: "Nega", physio: "Fizioterapija" };

export const isPending = (e: Pick<NurseEntry, "status">) => e.status === "pending" || e.status === "processing";
export const isBillableTask = (t: Pick<CareTask, "article" | "articleAmount" | "price">) =>
  (!!t.article && t.articleAmount > 0) || t.price > 0;
export const personName = (p: PersonRef | string | null | undefined) =>
  p && typeof p === "object" ? `${p.name} ${p.lastName}`.trim() : "";

// ---------- ključevi ----------
export const entryKeys = {
  all: ["nurseEntries"] as const,
  list: (q: EntryQuery) => ["nurseEntries", q] as const,
  summary: ["nurseEntries", "summary"] as const,
  tasks: (all: boolean) => ["careTasks", all] as const,
};

// ---------- katalog usluga ----------
export function useCareTasks({ all = false, enabled = true } = {}) {
  return useQuery({
    queryKey: entryKeys.tasks(all),
    queryFn: async () => (await api.get(`/api/care-tasks${all ? "?all=1" : ""}`)).data.tasks as CareTask[],
    staleTime: 5 * 60_000,
    enabled,
  });
}

export type CareTaskInput = {
  name: string;
  category: string;
  article: string | null;
  articleAmount: number;
  price: number;
  active: boolean;
};

export function useSaveCareTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<CareTaskInput> & { id?: string }) =>
      id ? (await api.put(`/api/care-tasks/${id}`, data)).data.task : (await api.post("/api/care-tasks", data)).data.task,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["careTasks"] }),
  });
}

export function useDeleteCareTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/api/care-tasks/${id}`)).data as { archived: boolean; message: string },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["careTasks"] }),
  });
}

// ---------- unosi ----------
const toParams = (q: EntryQuery) => {
  const p = new URLSearchParams();
  if (q.patientId) p.set("patientId", q.patientId);
  if (q.status?.length) p.set("status", q.status.join(","));
  if (q.mine) p.set("mine", "1");
  if (q.from) p.set("from", q.from);
  if (q.to) p.set("to", q.to);
  if (q.createdBy) p.set("createdBy", q.createdBy);
  if (q.type?.length) p.set("type", q.type.join(","));
  if (q.limit) p.set("limit", String(q.limit));
  return p.toString();
};

export function useNurseEntries(q: EntryQuery, { enabled = true, refetchInterval }: { enabled?: boolean; refetchInterval?: number } = {}) {
  return useQuery({
    queryKey: entryKeys.list(q),
    queryFn: async () => (await api.get(`/api/nurse-entries?${toParams(q)}`)).data.entries as NurseEntry[],
    enabled,
    refetchInterval,
  });
}

export interface PendingSummary {
  total: number;
  byPatient: Array<{ patientId: string; count: number; oldest: string }>;
}

/** Broj unosa na čekanju (uprava) — osvežava se i sam, jer sestre unose sa drugih uređaja */
export function usePendingSummary(enabled = true) {
  return useQuery({
    queryKey: entryKeys.summary,
    queryFn: async () => (await api.get("/api/nurse-entries/pending-summary")).data as PendingSummary,
    enabled,
    refetchInterval: 60_000,
    staleTime: 15_000,
  });
}

/** `specificationId`: uprava dodaje iz specifikacije u izabran period */
export function useCreateEntries(patientId: string, specificationId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entries: NewEntry[]) =>
      (await api.post("/api/nurse-entries", { patientId, entries, specificationId })).data as { message: string; entries: NurseEntry[] },
    // Unos uprave odmah menja specifikaciju i stanje
    onSuccess: () => refreshAfterSpecChange(qc, patientId),
  });
}

export interface AcceptResult {
  id: string;
  ok: boolean;
  message: string;
}

export function useAcceptEntries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ items }: { items: Array<{ id: string; amount?: number; price?: number }>; patientIds: string[] }) =>
      (await api.post("/api/nurse-entries/accept", { items })).data as { message: string; results: AcceptResult[] },
    onSettled: (_d, _e, { patientIds }) => {
      new Set(patientIds).forEach((pid) => refreshAfterSpecChange(qc, pid));
      qc.invalidateQueries({ queryKey: entryKeys.all });
    },
  });
}

export function useRejectEntries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, reason }: { ids: string[]; reason: string }) => {
      const results = await Promise.allSettled(ids.map((id) => api.post(`/api/nurse-entries/${id}/reject`, { reason })));
      return results.filter((r) => r.status === "fulfilled").length;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: entryKeys.all }),
  });
}

export function useCancelEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/api/nurse-entries/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: entryKeys.all }),
  });
}
