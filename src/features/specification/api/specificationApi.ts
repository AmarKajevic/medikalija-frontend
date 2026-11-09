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
  includeDebt: boolean;
  includeLodging: boolean;
  earlyLodgingEUR: number;
  includeEarlyLodging: boolean;
  /** Naziv izabrane cene iz cenovnika smeštaja ("" = ručni iznos) */
  nextLodgingOption?: string;
  earlyLodgingOption?: string;
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

// Aktivira period koji se nadovezuje na trenutno aktivan (računa backend).
export const activateNextSpecificationPeriod = async (patientId: string) => {
  const { data } = await api.post(`/api/specification/${patientId}/activate-next`);
  return data.specification;
};

// Period specifikacije: period pre aktivnog (poslednji istekao); null ako ga nema.
export const fetchBillingPeriod = async (patientId: string): Promise<Specification | null> => {
  const { data } = await api.get(`/api/specification/${patientId}/billing-period`);
  return data.specification ?? null;
};

/** Raniji period: postojeći zapis ili period iz mreže od 30 dana od prijema */
export type PastPeriod = {
  startDate: string;
  endDate: string;
  specificationId: string | null;
  itemsCount: number;
  totalPrice: number;
};

// Svi raniji periodi od prijema do aktivnog, od najnovijeg
export const fetchPastPeriods = async (patientId: string): Promise<PastPeriod[]> => {
  const { data } = await api.get(`/api/specification/${patientId}/past-periods`);
  return data.periods ?? [];
};

/** Period za izbor aktivnog: raniji, aktivan, današnji i jedan unapred */
export type SelectablePeriod = PastPeriod & { isActive: boolean; isCurrent: boolean };

// Svi periodi među kojima se bira aktivan (od prijema do današnjeg i jedan unapred), od najnovijeg
export const fetchSelectablePeriods = async (patientId: string): Promise<SelectablePeriod[]> => {
  const { data } = await api.get(`/api/specification/${patientId}/periods`);
  return data.periods ?? [];
};

// Otvara raniji period za rad (pravi zapis ako ne postoji), aktivan period se ne menja
export const openPastPeriod = async (patientId: string, startDate: string, endDate: string): Promise<Specification> => {
  const { data } = await api.post(`/api/specification/${patientId}/periods`, { startDate, endDate });
  return data.specification;
};

// Izmena količine stavke (i cene po komadu za negu i dodatne troškove)
export const updateSpecificationItem = async (specId: string, itemId: string, payload: { amount: number; unitPrice?: number }): Promise<Specification> => {
  const { data } = await api.patch(`/api/specification/${specId}/item/${itemId}`, payload);
  return data.specification;
};

// Ručna izmena datuma perioda; periodi koji se nadovezuju pomeraju se na serveru
export const changeSpecificationDates = async (patientId: string, specId: string, startDate: string, endDate: string): Promise<Specification> => {
  const { data } = await api.put(`/api/specification/${patientId}/periods/${specId}`, { startDate, endDate });
  return data.specification;
};

// Vanstandardni periodi: ručno izabrani datumi van redovnog niza perioda
export const fetchNonStandardPeriods = async (patientId: string): Promise<Specification[]> => {
  const { data } = await api.get(`/api/specification/${patientId}/non-standard`);
  return data.specifications ?? [];
};

export const openNonStandardPeriod = async (patientId: string, startDate: string, endDate: string): Promise<Specification> => {
  const { data } = await api.post(`/api/specification/${patientId}/non-standard`, { startDate, endDate });
  return data.specification;
};
