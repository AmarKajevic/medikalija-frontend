import { api } from "../../../shared/api/api";

export const addCombinationToPatient = async (payload: {
  patientId: string;
  combinationId: string;
}) => {
  const res = await api.post(
    `/analysis/combination/addToPatient/${payload.patientId}`,
    { combinationId: payload.combinationId }
  );

  return res.data;
};