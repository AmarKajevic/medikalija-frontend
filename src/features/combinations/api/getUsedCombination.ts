import { api } from "@shared/api/api"
import { PatientCombinationRecord } from "@features/combinations/types/types"

export const getUsedCombination = async (patientId: string): Promise<PatientCombinationRecord[]> => {
    const res = await api.get(`/api/analysis/combination/combinations/${patientId}`)
    return res.data?.combinations ?? []
}
