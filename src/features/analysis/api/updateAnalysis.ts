import { api } from "../../../shared/api/api"

export const updateAnalysis = async (id: string, data: any) => {
  const res = await api.put(`/api/analysis/${id}`, data);
  return res.data;
};