import { UseMutateFunction } from "@tanstack/react-query";

export type FamilyItemFormConfig<TItem> = {
  title: string;
   useAddMutation: () => {
    mutate: UseMutateFunction<any, Error, any, unknown>;
    isPending: boolean;
  };
  useGetItems: () => { data?: TItem[] | { medicines?: TItem[]; articles?: TItem[] } };
  buildPayload: (data: FamilyFormValues, fromFamily: boolean) => any;
  placeholderUnit: string;
  itemNameSingular: string;
  usePatients: () => { data?: { patients?: any[] } }; 
};

export type FamilyFormValues = {
  name: string;
  patientId: string;
  unitsPerPackage?: number | "";
  quantity?: number | "";
};