export type SpecificationItemCategory = "medicine" | "articles" | "combination" | "extra";

export type SpecificationItem = {
  _id: string;
  name: string;
  category?: SpecificationItemCategory | string;
  formattedName?: string;
  amount: number;
  price: number;
  date?: string;
  analyses?: Array<{ _id: string; name: string; price: number }>;
  entries?: Array<{ _id: string; homeAmount?: number; familyAmount?: number; price?: number; date?: string }>;
};

export type Specification = {
  _id: string;
  patientName: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  extraCosts?: number;
  isActive?: boolean;
  items: SpecificationItem[];
  billing?: {
    lowerExchangeRate: number;
    middleExchangeRate: number;
    includeDebt?: boolean;
    includeLodging?: boolean;
    previousDebtEUR: number;
    previousDebtRSD: number;
    nextLodgingEUR: number;
    nextLodgingRSD: number;
    specEUR: number;
    totalRSD: number;
    totalEUR: number;
    nextPeriodStart: string;
    nextPeriodEnd: string;
  };
  patientId?: string;
};

// Odgovor /api/medicine/use i /api/articles/use
export type ConsumeResponse = {
  success: boolean;
  message: string;
  familyUsed: number;
  homeUsed: number;
  specification: Specification | null;
};
