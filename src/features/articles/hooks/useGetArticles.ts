import { useQuery } from "@tanstack/react-query"
import { getArrticles } from "../api/getArticles"

export const useGetArticles = () => {
    return useQuery({
        queryKey:["articles"],
        queryFn:  getArrticles
        
    })
}