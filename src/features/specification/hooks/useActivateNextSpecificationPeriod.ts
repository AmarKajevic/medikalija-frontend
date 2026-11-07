import { useMutation, useQueryClient } from "@tanstack/react-query";
import { activateNextSpecificationPeriod } from "@features/specification/api/specificationApi";

export const useActivateNextSpecificationPeriod = (patientId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => activateNextSpecificationPeriod(patientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patientSpecification", patientId] });
      queryClient.invalidateQueries({ queryKey: ["specificationHistory", patientId] });
      queryClient.invalidateQueries({ queryKey: ["billingPeriodSpecification", patientId] });
      queryClient.invalidateQueries({ queryKey: ["pastPeriods", patientId] });
      queryClient.invalidateQueries({ queryKey: ["future-specs", patientId] });
    },
  });
};
