import { api } from "../../../shared/api/api"

export const getAnalyses = async () => {
    const res = await api.get("/analysis")
    return res.data;
}