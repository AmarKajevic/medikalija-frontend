import { useMutation, useQueryClient } from "@tanstack/react-query";
import { consumeArticle } from "@features/articles/api/useArticle";
import { refreshAfterSpecChange } from "@features/specification/lib/queries";
import { ConsumeResponse } from "@features/specification/types/types";

export const useUseArticle = (patientId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { articleId: string; amount: number }): Promise<ConsumeResponse> =>
      consumeArticle({ ...data, patientId }),
    onSuccess: (res) => refreshAfterSpecChange(queryClient, patientId, res.specification),
  });
};
