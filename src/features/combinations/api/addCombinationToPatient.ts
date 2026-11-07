import { api } from "@shared/api/api";

export const addCombinationToPatient = async (payload: {
  patientId: string;
  combinationId: string;
  specificationId?: string;
}) => {
  const res = await api.post(
    `/api/analysis/combination/addToPatient/${payload.patientId}`,
    { combinationId: payload.combinationId, specificationId: payload.specificationId }
  );

  return res.data;
};