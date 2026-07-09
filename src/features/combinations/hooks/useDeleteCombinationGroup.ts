import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteCombinationGroup } from "../api/deleteCombinationGroup"

export const useDeleteCombinationGroup =  () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (groupId: string) => deleteCombinationGroup(groupId),
        onSuccess:() => queryClient.invalidateQueries({queryKey:["groups"]}) 
    })
}