import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveBilling } from "@features/specification/api/specificationApi";
import { refreshAfterSpecChange } from "@features/specification/lib/queries";

export const useSaveBilling = (specId: string, patientId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof saveBilling>[1]) => saveBilling(specId, payload),
    onSuccess: (spec) => refreshAfterSpecChange(queryClient, patientId, spec),
  });
};
