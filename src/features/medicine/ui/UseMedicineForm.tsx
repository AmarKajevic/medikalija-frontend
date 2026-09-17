import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";

import { useMedicineSchema, UseMedicineFormValues } from "@features/medicine/model/schema";
import { useUseMedicine } from "@features/medicine/hooks/useUseMedicine";
import { useMedicineOptions } from "@features/medicine/hooks/useMedicineOptions";
import { Controller } from "react-hook-form";
import { SelectItemsForm } from "@shared/ui/SelectItemsForm/SelectItemsForm";

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

  const fieldInputClass =
    "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded-lg border border-gray-200 p-4 shadow-theme-xs dark:border-gray-800">


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
              <p className="text-sm text-error-500">
                {fieldState.error.message}
              </p>
            )}
          </div>
        )}
      />

      <input
      className={fieldInputClass}
        type="number"
        placeholder="Dani"
        {...register("days")}
      />

      <input
      className={fieldInputClass}
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
              className={fieldInputClass}
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
      className={fieldInputClass}
        type="number"
        step="0.01"
        placeholder="Ukupna količina"
        {...register("amount", {
          valueAsNumber: true,
          onChange: () => setManualOverride(true),
        })}
      />

      <p className="text-sm text-gray-500 dark:text-gray-400">
        Auto izračunato: {calculated.toFixed(2)}
      </p>
      <div className="flex items-center justify-center">

      <button disabled={isPending} className="w-full rounded-lg bg-brand-500 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:bg-gray-400">
        Dodaj lek
      </button>

      </div>

    </form>
  );
};