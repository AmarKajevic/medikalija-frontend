import { api } from "../../../shared/api/api"

export const deleteSpecificationItem = async ({
  specId,
  itemId,
}: {
  specId: string;
  itemId: string;
}) => {
    const res = await api.delete( `/specification/${specId}/item/${itemId}`)
    return res.data
}