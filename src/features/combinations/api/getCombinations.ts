import { api } from "../../../shared/api/api"

export const getCombinations = async () => {
    const res = await api.get("/combinationGroup")
    return res.data.groups;
} 