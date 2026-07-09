import { api } from "../../../shared/api/api"

export const deleteCombinationGroup = async (groupId: string) => {
    await api.delete(`/api/combinationGroup/combination-groups/${groupId}`)
}