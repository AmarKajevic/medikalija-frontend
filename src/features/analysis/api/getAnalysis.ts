import { api } from "../../../shared/api/api"

export const getAnalysis = async (analysisId: string) => {
    console.log(analysisId)
    const res = await api.get(`/analysis/${analysisId}`)
    return res.data;
}