import { useQuery } from "@tanstack/react-query"
import { searchApi } from "../api/searchApi"

export const useSearch = (query: string) => {
    return useQuery({
        queryKey: ["search", query],
        queryFn: () => searchApi(query),
        enabled: !!query,
        staleTime: 1000 * 30
    })
}