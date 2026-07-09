import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateDischargeDate } from "../api/updateDischargeDate";

export const useUpdateDischargeDate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDischargeDate,

    onSuccess: () => {
      queryClient.invalidateQueries({queryKey:["patient"]})
      queryClient.invalidateQueries({queryKey:["patients"]})
      queryClient.invalidateQueries({queryKey:["patientSpecification"]})
    }
  });
};