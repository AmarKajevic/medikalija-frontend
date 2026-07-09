import { api } from "../../../shared/api/api"

export const deleteCombinationGroup = async (groupId: string) => {
    await api.delete(`/combinationGroup/combination-groups/${groupId}`)
}