import { AddDomItemForm } from "../../../shared/ui/AddDomItemForm/AddDomItemForm";
import { useAddMedicine } from "../hooks/useAddMedicine";
import { useMedicines } from "../hooks/useMedicines";
import { buildMedicinePayload } from "../lib/buildMedicinePayload";

export const AddMedicineFormNew = () => (
  <AddDomItemForm
    config={{
      title: "Dodavanje leka (Dom)",
      useAddMutation: useAddMedicine,
      useGetItems: useMedicines,
      buildPayload: buildMedicinePayload,
      priceFieldName: "pricePerUnit",
      placeholderPrice: "Cena po jedinici (din)",
      placeholderUnit: "Tableta po pakovanju",
      itemNameSingular: "lek",
    }}
  />
);