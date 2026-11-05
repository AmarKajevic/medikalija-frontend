import { api } from "@shared/api/api";
import { Specification } from "@features/specification/types/types";

export const deleteSpecificationItem = async ({
  specId,
  itemId,
}: {
  specId: string;
  itemId: string;
}): Promise<{ message: string; fullyReverted: boolean; specification: Specification }> => {
  const res = await api.delete(`/api/specification/${specId}/item/${itemId}`);
  return res.data;
};
