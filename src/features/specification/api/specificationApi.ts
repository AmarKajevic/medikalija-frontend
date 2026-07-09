import { api } from "../../../shared/api/api";
import { Specification } from "../types/types";




export const fetchSpecification = async (id: string): Promise<Specification> => {
  const { data } = await api.get(`/api/specification/view/${id}`);
  return data.specification;
};

export const addExtraCost = async (specId: string, amount: number, label: string) => {
  const { data } = await api.post(`/api/specification/${specId}/add-costs`, {
    extraCostAmount: amount,
    extraCostLabel: label,
  });
  return data.specification;
};

export const saveBilling = async (specId: string, payload: {
  previousDebtEUR: number;
  nextLodgingEUR: number;

}) => {
  const { data } = await api.post(`/api/specification/${specId}/billing`, payload);
  return data.specification;
};

export const previewBilling = async (specId: string, payload: {
  specTotalRSD: number;
  previousDebtEUR: number;
  nextLodgingEUR: number;
  lowerExchangeRate: number;
  middleExchangeRate: number;
}) => {
  const { data } = await api.post(`/api/specification/${specId}/preview`, payload);
  return data; 
};
export const fetchSpecificationHistory = async (patientId: string) => {
  const { data } = await api.get(`/api/specification/history/${patientId}`);
  return data; 
};