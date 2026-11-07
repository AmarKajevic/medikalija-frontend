import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPastPeriods, openPastPeriod, type PastPeriod } from "@features/specification/api/specificationApi";
import { specKeys } from "@features/specification/lib/queries";

/** Svi raniji periodi pacijenta (od prijema), od najnovijeg */
export const usePastPeriods = (patientId: string) =>
  useQuery({
    queryKey: specKeys.past(patientId),
    queryFn: () => fetchPastPeriods(patientId),
    enabled: !!patientId,
  });

/** Otvara raniji period za rad; vraća specifikaciju tog perioda */
export const useOpenPastPeriod = (patientId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: Pick<PastPeriod, "startDate" | "endDate">) => openPastPeriod(patientId, p.startDate.slice(0, 10), p.endDate.slice(0, 10)),
    onSuccess: (spec) => {
      qc.setQueryData(specKeys.byId(spec._id), spec);
      qc.invalidateQueries({ queryKey: specKeys.past(patientId) });
      qc.invalidateQueries({ queryKey: specKeys.history(patientId) });
    },
  });
};
