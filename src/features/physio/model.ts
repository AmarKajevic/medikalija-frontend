import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/api/api";
import type { PhysioKind } from "@features/nurse-entries/model";

// Cenovnik vanredne fizikalne terapije: admin unosi cenu za svaku vrstu unapred;
// pri odobravanju vanredne terapije cena se uzima odavde.
export interface PhysioPrice {
  kind: PhysioKind;
  /** null = još nije uneta */
  priceRSD: number | null;
}

const KEY = ["physioPrices"] as const;

export function usePhysioPrices({ enabled = true } = {}) {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => (await api.get("/api/physio-prices")).data.prices as PhysioPrice[],
    enabled,
  });
}

export function useSavePhysioPrice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ kind, priceRSD }: { kind: PhysioKind; priceRSD: number }) => (await api.put(`/api/physio-prices/${kind}`, { priceRSD })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
