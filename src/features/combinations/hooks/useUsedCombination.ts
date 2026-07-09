import { useQuery } from "@tanstack/react-query"
import { getUsedCombination } from "../api/getUsedCombination"
import { UsedCombination } from "../types/types"


export const useUsedCombination = (id: string) => {
    return useQuery<UsedCombination[]>({
        queryKey: ["groups", id],
        queryFn: () => getUsedCombination(id),
        enabled: !!id,
    })
}