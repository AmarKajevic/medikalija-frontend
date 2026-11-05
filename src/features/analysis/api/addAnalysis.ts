import { api } from "@shared/api/api"

export const addAnalysis = async (data: { name: string; price: number }) => {
    const res = await api.post("/api/analysis", data)
    return res.data;

}