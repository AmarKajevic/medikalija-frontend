export type UseMedicinePayload = {
  patientId: string;
  medicineId: string;
  amount: number;
  /** Period u koji ide stavka (aktivan ili period specifikacije) */
  specificationId?: string;
};
export type MedicineMeta = {
  home: number;
  family: number;
  price: number;
};