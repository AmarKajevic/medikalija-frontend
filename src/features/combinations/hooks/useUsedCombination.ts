import { useQuery } from "@tanstack/react-query"
import { getUsedCombination } from "@features/combinations/api/getUsedCombination"
import { UsedCombination } from "@features/combinations/types/types"


export const useUsedCombination = (id: string) => {
    return useQuery<UsedCombination[]>({
        queryKey: ["groups", id],
        queryFn: () => getUsedCombination(id),
        enabled: !!id,
    })
}