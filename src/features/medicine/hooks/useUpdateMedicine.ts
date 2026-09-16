import {  useMutation, useQueryClient } from "@tanstack/react-query"
import { updateMedicine } from "@features/medicine/api/updateMedicine"

export const useUpdateMedicine = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMedicine,

    onSuccess: (_, variables) => {

      queryClient.invalidateQueries({
        queryKey: ["medicine", variables.medicineId],
      });


      queryClient.invalidateQueries({
        queryKey: ["medicines"],
      });
    },
  });
};