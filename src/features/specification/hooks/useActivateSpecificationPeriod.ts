import { useMutation, useQueryClient } from "@tanstack/react-query";
import { activateSpecificationPeriod } from "@features/specification/api/specificationApi";

export const useActivateSpecificationPeriod = (patientId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ startDate, endDate }: { startDate: string; endDate: string }) =>
      activateSpecificationPeriod(patientId, startDate, endDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patientSpecification", patientId] });
      queryClient.invalidateQueries({ queryKey: ["specificationHistory", patientId] });
    },
  });
};
