import { useQuery } from "@tanstack/react-query"
import { getCombinationGroup } from "../api/getCombinationGroup"

export const useGetCombinationGroup =  () => {
    return useQuery({
        queryKey: ["combination-group"],
        queryFn: () => getCombinationGroup(),
        staleTime: 1000 * 60 * 5
    })
}