import { api } from "../../../shared/api/api"

export const getAnalyses = async () => {
    const res = await api.get("/api/analysis")
    return res.data;
}