import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/api/api";
import { refreshAfterSpecChange } from "@features/specification/lib/queries";
import type { Specification } from "@features/specification/types/types";

// Stručne usluge: admin pravi cenovnik (naziv + cena u dinarima), uprava ih dodaje u specifikaciju.
export interface ProfessionalService {
  _id: string;
  name: string;
  priceRSD: number;
  active: boolean;
}

export type ProfessionalServiceInput = Pick<ProfessionalService, "name" | "priceRSD" | "active">;

const KEY = ["professionalServices"] as const;

export function useProfessionalServices({ all = false, enabled = true } = {}) {
  return useQuery({
    queryKey: [...KEY, all],
    queryFn: async () => (await api.get(`/api/professional-services${all ? "?all=1" : ""}`)).data.services as ProfessionalService[],
    enabled,
  });
}

export function useSaveProfessionalService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ProfessionalServiceInput> & { id?: string }) =>
      (id ? (await api.put(`/api/professional-services/${id}`, data)).data.service : (await api.post("/api/professional-services", data)).data.service) as ProfessionalService,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteProfessionalService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/api/professional-services/${id}`)).data as { message: string },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Dodaje uslugu u specifikaciju (izabran period ili aktivan) */
export function useChargeProfessionalService(patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { serviceId: string; amount: number; specificationId?: string }) =>
      (await api.post("/api/professional-services/charge", { patientId, ...body })).data.specification as Specification,
    onSuccess: (spec) => refreshAfterSpecChange(qc, patientId, spec),
  });
}
