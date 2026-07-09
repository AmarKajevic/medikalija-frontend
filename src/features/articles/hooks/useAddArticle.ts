import { useMutation, useQueryClient } from "@tanstack/react-query"
import { addArticle } from "../api/addArticle"

export const useAddArticle = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: addArticle,

        onSuccess:() => {
            queryClient.invalidateQueries({queryKey:["articles"]})
        }
    })
}