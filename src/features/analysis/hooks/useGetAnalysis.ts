import { useQuery } from "@tanstack/react-query"
import { getAnalysis } from "../api/getAnalysis"

export const useGetAnalysis = (analysisId: string) => {
    return useQuery({
        queryKey: ["analysis", analysisId],
        queryFn: () => getAnalysis(analysisId),
        enabled: !!analysisId,
    })
}