import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deletePatient } from "@features/patients/api/deletePatient"

export const useDeletePatient = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: deletePatient,


        onSuccess: () => {
            queryClient.invalidateQueries({queryKey:["patients"]})
        }
    })
}