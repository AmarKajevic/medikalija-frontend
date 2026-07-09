import { api } from "../../../shared/api/api"

export const deleteAnalysis = async (analysisId: string) => {
    console.log(analysisId)
    const res = await api.delete(`/api/analysis/${analysisId}`)
    return res.data;
}