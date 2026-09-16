import { useQuery } from "@tanstack/react-query"
import { getArrticles } from "@features/articles/api/getArticles"

export const useGetArticles = () => {
    return useQuery({
        queryKey:["articles"],
        queryFn:  getArrticles
        
    })
}