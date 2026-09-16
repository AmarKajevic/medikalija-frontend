import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteMedicine } from "@features/medicine/api/deleteMedicine"

export const useDeleteMedicine = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => deleteMedicine(id),

        onSuccess: () => {(queryClient.invalidateQueries({queryKey:['medicines']}))}
    })
}