import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteSpecificationItem } from "../api/deleteSpecificationItem"

export const useDeleteSpecificationItem = (patientId: string) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: deleteSpecificationItem,

        onSuccess:(_, variables) => {
            queryClient.setQueryData(["patientSpecification", patientId],
                (oldData: any) => {
                    if(!oldData) return oldData;

                     return {
                        ...oldData,
                        items: oldData.items.filter(
                        (i: any) => i._id !== variables.itemId
                        ),
                    };
                }
            )
        }
    })
}