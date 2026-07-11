import { api } from "../../../shared/api/api"

export const updateMedicine = async ({
  medicineId,
  data,
}: {
  medicineId: string;
  data: Partial<{
    name: string;
    pricePerUnit: number;
    unitsPerPackage: number;
    quantity: number;
    addQuantity: number;
    packages: number;
  }>;
}) => {
  const res = await api.put(`/api/medicine/${medicineId}`, data);
  return res.data;
};