import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addExtraCost } from "@features/specification/api/specificationApi";
import { refreshAfterSpecChange } from "@features/specification/lib/queries";

export const useAddExtraCost = (specId: string, patientId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ amount, label }: { amount: number; label: string }) => addExtraCost(specId, amount, label),
    onSuccess: (spec) => refreshAfterSpecChange(queryClient, patientId, spec),
  });
};
