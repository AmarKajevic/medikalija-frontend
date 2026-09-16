import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteCombination } from "@features/combinations/api/deleteCombination"

export const useDeleteCombination = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id:string) => deleteCombination(id),
        
        onSuccess:() => {queryClient.invalidateQueries({queryKey:["groups"]})}
    })
}