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
    },
  });

  const days = watch("days") || 1;
  const timesPerDay = watch("timesPerDay") || 0;
  const portion = watch("portion") || 0;

  const calculated = days * timesPerDay * portion;


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
      className="border-2 p-2 border-gray-200 text-black rounded-md "
        type="number"
        placeholder="Dani"
        {...register("days")}
      />

      <input
      className="border-2 p-2 border-gray-200 text-black rounded-md "
        type="number"
        placeholder="Koliko puta dnevno"
        {...register("timesPerDay")}
      />

      <input
      className="border-2 p-2 border-gray-200 text-black rounded-md "
        type="number"
        step="0.01"
        placeholder="Doza (npr 0.5)"
        {...register("portion")}
      />

      <input
      className="border-2 p-2 border-gray-200 text-black rounded-md "
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