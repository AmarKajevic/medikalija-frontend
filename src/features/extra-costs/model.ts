import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/api/api";

// Cenovnik drugih troškova (frizer, prevoz, pedikir...): admin pravi cenovnik (naziv + cena u dinarima),
// uprava bira trošak u specifikaciji ili ga unosi ručno.
export interface ExtraCost {
  _id: string;
  name: string;
  priceRSD: number;
  active: boolean;
}

export type ExtraCostInput = Pick<ExtraCost, "name" | "priceRSD" | "active">;

const KEY = ["extraCosts"] as const;

export function useExtraCosts({ all = false, enabled = true } = {}) {
  return useQuery({
    queryKey: [...KEY, all],
    queryFn: async () => (await api.get(`/api/extra-costs${all ? "?all=1" : ""}`)).data.costs as ExtraCost[],
    enabled,
  });
}

export function useSaveExtraCost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ExtraCostInput> & { id?: string }) =>
      (id ? (await api.put(`/api/extra-costs/${id}`, data)).data.cost : (await api.post("/api/extra-costs", data)).data.cost) as ExtraCost,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteExtraCost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/api/extra-costs/${id}`)).data as { message: string },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
