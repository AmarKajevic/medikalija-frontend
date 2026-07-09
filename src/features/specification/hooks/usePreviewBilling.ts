import { useMutation } from "@tanstack/react-query";
import { previewBilling } from "../api/specificationApi";

export const usePreviewBilling = (specId: string) => {
  return useMutation({
    mutationFn: (payload: Parameters<typeof previewBilling>[1]) =>
      previewBilling(specId, payload),
  });
};