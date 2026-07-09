import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useMedicineApi } from "../api/useMedicine"

export const useUseMedicine = (patientId: string) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: { medicineId: string; amount: number }) =>
      useMedicineApi({ ...data, patientId }),

onSuccess: (res) => {
  queryClient.setQueryData(
    ["patientSpecification", patientId],
    res.specification
  );
   queryClient.invalidateQueries({
    queryKey: ["patientStock", patientId],
  });

  queryClient.invalidateQueries({
    queryKey: ["medicines"],
  });

}
    })
}