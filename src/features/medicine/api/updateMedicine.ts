import { api } from "../../../shared/api/api"

export const updateMedicine = async ({
  medicineId,
  data,
}: {
  medicineId: string;
  data: Partial<{
    pricePerUnit: number;
    unitsPerPackage: number;
    quantity: number;
    addQuantity: number;
    packages: number;
  }>;
}) => {
  const res = await api.put(`/medicine/${medicineId}`, data);
  return res.data;
};