import { useQuery } from "@tanstack/react-query"
import { getUsedCombination } from "@features/combinations/api/getUsedCombination"
import { PatientCombinationRecord } from "@features/combinations/types/types"

export const useUsedCombination = (patientId: string) => {
    return useQuery<PatientCombinationRecord[]>({
        queryKey: ["usedCombinations", patientId],
        queryFn: () => getUsedCombination(patientId),
        enabled: !!patientId,
    })
}
