import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setBillingPeriod } from "@features/specification/api/specificationApi";
import { refreshAfterSpecChange } from "@features/specification/lib/queries";

/** Izbor perioda specifikacije; smeštaj za period se pomera sam (period posle izabranog) */
export const useSetBillingPeriod = (patientId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { specificationId: string } | { startDate: string; endDate: string }) => setBillingPeriod(patientId, body),
    onSuccess: ({ active }) => refreshAfterSpecChange(qc, patientId, active),
  });
};
