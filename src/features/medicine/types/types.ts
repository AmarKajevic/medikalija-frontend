export type UseMedicinePayload = {
  patientId: string;
  medicineId: string;
  amount: number;
};
export type MedicineMeta = {
  home: number;
  family: number;
  price: number;
};