import { useMutation, useQueryClient } from "@tanstack/react-query"
import { addPatient } from "../api/addPatient"

export const useAddPatient = () => {
    const queryClient =  useQueryClient()

    return useMutation ({
        mutationFn: addPatient,

        onSuccess: () => {
            queryClient.invalidateQueries({queryKey:["patients"]})
            queryClient.invalidateQueries({queryKey:["patient"]})
        }
    })
}