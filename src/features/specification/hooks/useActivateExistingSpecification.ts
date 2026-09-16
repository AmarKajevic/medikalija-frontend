import { useMutation, useQueryClient } from "@tanstack/react-query";
import { activateExistingSpecification } from "@features/specification/api/specificationApi";

export const useActivateExistingSpecification = (patientId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (specId: string) => activateExistingSpecification(patientId, specId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patientSpecification", patientId] });
      queryClient.invalidateQueries({ queryKey: ["specificationHistory", patientId] });
    },
  });
};
