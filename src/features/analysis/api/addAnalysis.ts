import { api } from "../../../shared/api/api"

export const addAnalysis = async (data: any) => {
    const res = await api.post("/analysis", data)
    return res.data;

}