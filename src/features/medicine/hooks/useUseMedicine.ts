import { useMutation, useQueryClient } from "@tanstack/react-query";
import { consumeMedicine } from "@features/medicine/api/useMedicine";
import { refreshAfterSpecChange } from "@features/specification/lib/queries";
import { ConsumeResponse } from "@features/specification/types/types";

export const useUseMedicine = (patientId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { medicineId: string; amount: number }): Promise<ConsumeResponse> =>
      consumeMedicine({ ...data, patientId }),
    onSuccess: (res) => refreshAfterSpecChange(queryClient, patientId, res.specification),
  });
};
