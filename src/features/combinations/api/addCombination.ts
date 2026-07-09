import { api } from "../../../shared/api/api"


export const addCombination = async (payload :{name: string, analysisIds: string[]}) => {
    const res = await api.post("/analysis/combination/addCombination", payload)
    return res.data
}

export const addCombinationToGroup = async (payload: {name: string, combinations:string[]}) => {
    const res = await api.post("/combinationGroup", payload)
    return res.data;
}