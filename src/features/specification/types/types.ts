export type Specification = {
  _id: string;
  patientName: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  items: Array<{
    _id: string;
    name: string;
    formattedName?: string;
    amount: number;
    price: number;
  }>;
  billing?: {
    lowerExchangeRate: number;
    middleExchangeRate: number;
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
}