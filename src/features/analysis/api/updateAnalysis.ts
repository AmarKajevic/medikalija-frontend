import { api } from "../../../shared/api/api"

export const updateAnalysis = async (id: string, data: any) => {
  const res = await api.put(`/analysis/${id}`, data);
  return res.data;
};