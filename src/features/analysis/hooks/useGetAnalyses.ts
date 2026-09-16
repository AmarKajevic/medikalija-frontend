import { useQuery } from "@tanstack/react-query"
import { getAnalyses } from "@features/analysis/api/getAnalyses"

export const useGetAnalyses = () => {
    return useQuery({
        queryKey: ['analyses'],
        queryFn: getAnalyses
    })
}
