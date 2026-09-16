import { api } from "@shared/api/api";
import { Specification } from "@features/specification/types/types";




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

// Kreira/aktivira period po ručno unetom opsegu datuma (nadoknada propuštenog
// perioda ili unapred izabran period).
export const activateSpecificationPeriod = async (
  patientId: string,
  startDate: string,
  endDate: string
) => {
  const { data } = await api.post(`/api/specification/${patientId}/activate`, {
    startDate,
    endDate,
  });
  return data.specification;
};

// Reaktivira POSTOJEĆU specifikaciju iz istorije po ID-u.
export const activateExistingSpecification = async (patientId: string, specId: string) => {
  const { data } = await api.post(`/api/specification/${patientId}/activate/${specId}`);
  return data.specification;
};