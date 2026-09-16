import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addAnalysis } from "@features/analysis/api/addAnalysis";

export const useAddAnalysis = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: addAnalysis,

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["analyses"] });
        }
    })
}