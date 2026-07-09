import { DomFormValues } from "../../../shared/ui/AddDomItemForm/types";
export const buildMedicinePayload = (data: DomFormValues, fromFamily: boolean) => {
  const payload: any = {
    name: data.name,
    unitsPerPackage: data.unitsPerPackage === "" ? undefined : Number(data.unitsPerPackage),
    quantity: data.quantity === "" ? undefined : Number(data.quantity),
    fromFamily, // will be false for dom
  };
  if (!fromFamily && data.price !== undefined && data.price !== "") {
    payload.pricePerUnit = Number(data.price);
  }
  return payload;
};