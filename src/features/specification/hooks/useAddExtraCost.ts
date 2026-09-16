import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addExtraCost } from "@features/specification/api/specificationApi";

export const useAddExtraCost = (specId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ amount, label }: { amount: number; label: string }) =>
      addExtraCost(specId, amount, label),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["specification", specId] });
      queryClient.invalidateQueries({ queryKey: ["patientSpecification"] });
    },
  });
};