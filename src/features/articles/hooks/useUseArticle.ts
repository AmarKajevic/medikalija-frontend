import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useArticle } from "../api/useArticle";

export const useUseArticle = (patientId: string) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: {articleId: string; amount: number}) => 
            useArticle({...data, patientId}),

        onSuccess: (res) => {
            queryClient.setQueryData(
                ["patientSpecification", patientId],
                res.specification
            );
             queryClient.setQueryData(
                ["patientStockArticles", patientId],
                (old: any) => {
                if (!old) return old;

                return old.map((item: any) => {
                    if (item._id === res.usedRecord.article) {
                    const used = res.usedRecord.amount;

                    return {
                        ...item,
                        familyQuantity: Math.max(0, item.familyQuantity - used),
                    };
                    }
                    return item;
                });
                }
            );
            queryClient.invalidateQueries({
                queryKey:["articles"]
            })
        }
    })
}