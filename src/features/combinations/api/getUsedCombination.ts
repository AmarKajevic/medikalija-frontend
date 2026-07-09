import { api } from "../../../shared/api/api"

export const getUsedCombination = async (id: string) => {
    const res = await api.get(`/analysis/combination/combinations/${id}`)
    return res.data
}