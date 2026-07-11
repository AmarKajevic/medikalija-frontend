import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";

import { useMedicineSchema, UseMedicineFormValues } from "../model/schema";
import { useUseMedicine } from "../hooks/useUseMedicine";
import { useMedicineOptions } from "../hooks/useMedicineOptions";
import { Controller } from "react-hook-form";
import { SelectItemsForm } from "../../../shared/ui/SelectItemsForm/SelectItemsForm";

export const UseMedicineForm = ({ patientId }: { patientId: string }) => {
  const { mutate, isPending } = useUseMedicine(patientId);
  const options = useMedicineOptions(patientId);

  const [manualOverride, setManualOverride] = useState(false);
  

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    control,
  } = useForm<UseMedicineFormValues>({
    resolver: zodResolver(useMedicineSchema) as any,
    defaultValues: {
      amount: undefined, 
      medicineId: '',
    },
  });

  const days = watch("days") || 1;
  const timesPerDay = watch("timesPerDay") || 0;
  const portion = watch("portion") || 0;

  const calculated = days * timesPerDay * portion;

  const portions = [
  { label: "Cela tableta", value: 1 },
  { label: "Polovina", value: 0.5 },
  { label: "Trećina", value: 0.33 },
  { label: "Četvrtina", value: 0.25 },
  { label: "Celo i jedna polovina", value: 1.5 },
  { label: "Celo i jedna četvrtina", value: 1.25 },
  { label: "Celo i jedna trećina", value: 1.33 },
  { label: "Dva cela", value: 2 },
];


  useEffect(() => {
    if (!manualOverride && calculated > 0) {
      setValue("amount", Number(calculated.toFixed(2)));
    }
  }, [calculated, manualOverride, setValue]);

  const onSubmit = (data: UseMedicineFormValues) => {
    mutate(
      {
        medicineId: data.medicineId,
        amount: data.amount,
      },
      {
        onSuccess: () => {
          reset();
          setManualOverride(false);
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className=" p-2 space-y-3 border-0 border-gray-300 rounded-lg shadow-md ">


      <Controller
        name="medicineId"
        control={control}
        render={({ field, fieldState }) => (
          <div>
            <SelectItemsForm
              value={field.value}
              onChange={field.onChange}
              options={options}
            />

            {fieldState.error && (
              <p className="text-red-500 text-sm">
                {fieldState.error.message}
              </p>
            )}
          </div>
        )}
      />

      <input 
      className="border-2 p-2 border-gray-200 text-black rounded-md  w-full"
        type="number"
        placeholder="Dani"
        {...register("days")}
      />

      <input
      className="border-2 p-2 border-gray-200 text-black rounded-md  w-full"
        type="number"
        placeholder="Koliko puta dnevno"
        {...register("timesPerDay")}
      />

        <Controller
          name="portion"
          control={control}
          render={({ field }) => (
            <select
              {...field}
              value={field.value ?? 1}
              onChange={(e) => field.onChange(Number(e.target.value))}
              className="border-2 p-2 border-gray-200 text-black rounded-md w-full"
            >
              {portions.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          )}
        />

      <input
      className="border-2 p-2 border-gray-200 text-black rounded-md w-full"
        type="number"
        step="0.01"
        placeholder="Ukupna količina"
        {...register("amount", {
          valueAsNumber: true,
          onChange: () => setManualOverride(true), 
        })}
      />

      <p className="text-sm text-gray-600">
        Auto izračunato: {calculated.toFixed(2)}
      </p>
      <div className="flex items-center justify-center">
         
      <button disabled={isPending} className="bg-zinc-900 p-2 text-shite border-0 border-white rounded-md shadow-md text-white">
        Dodaj lek
      </button>

      </div>

    </form>
  );
};