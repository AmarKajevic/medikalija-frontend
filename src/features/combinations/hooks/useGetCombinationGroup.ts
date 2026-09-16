import { useQuery } from "@tanstack/react-query"
import { getCombinationGroup } from "@features/combinations/api/getCombinationGroup"

export const useGetCombinationGroup =  () => {
    return useQuery({
        queryKey: ["combination-group"],
        queryFn: () => getCombinationGroup(),
        staleTime: 1000 * 60 * 5
    })
}