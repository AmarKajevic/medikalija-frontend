import { api } from "../../../shared/api/api"

export const getCombinations = async () => {
    const res = await api.get("/api/combinationGroup")
    return res.data.groups;
} 