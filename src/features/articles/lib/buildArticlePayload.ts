import { DomFormValues } from "../../../shared/ui/AddDomItemForm/types";

export const buildArticlePayload = (data: DomFormValues, fromFamily: boolean) => {
  const payload: any = {
    name: data.name,
    unitsPerPackage: data.unitsPerPackage === "" ? undefined : Number(data.unitsPerPackage),
    quantity: data.quantity === "" ? undefined : Number(data.quantity),
    fromFamily, // ← koristi prosleđeni boolean
  };
  // Cenu šaljemo SAMO ako je dom (fromFamily = false) i ako je mod "new"
  if (!fromFamily && data.mode === "new") {
    payload.price = data.price === "" ? undefined : Number(data.price);
  }
  return payload;
};