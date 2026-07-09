import { UseMutateFunction } from "@tanstack/react-query";

export type DomItemFormConfig<TItem> = {
  title: string;
  useAddMutation: () => {
    mutate: UseMutateFunction<any, Error, any, unknown>;  // ← pravi tip
    isPending: boolean;
  };
  useGetItems: () => { data?: TItem[] | { medicines?: TItem[]; articles?: TItem[] } };
  buildPayload: (data: DomFormValues, fromFamily: boolean) => any;
  priceFieldName: "price" | "pricePerUnit";
  placeholderPrice: string;
  placeholderUnit: string;
  itemNameSingular: string;
};

export type DomFormValues = {
  mode: "new" | "existing";
  name: string;
  price?: number | "";
  unitsPerPackage?: number | "";
  quantity: number | "";
};