import { useQuery } from "@tanstack/react-query"
import { getArticle } from "@features/articles/api/getArticle"

export const useGetArticle = (id: string) =>{
    console.log("Fetching article with ID:", id);
    return useQuery({
        queryKey:["article", id],
        queryFn: () => getArticle(id),
        enabled: !!id,
    })
}