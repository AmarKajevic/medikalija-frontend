import { useForm, Controller } from "react-hook-form";
import { useCallback, useMemo } from "react";
import { SearchableSelect } from "../SearchableSelect/SearchableSelect";
import PatientSelect from "../../../features/patients/ui/PatientSelect"; // ili shared
import type { FamilyItemFormConfig, FamilyFormValues } from "./types";

export const AddFamilyItemForm = <TItem extends { name: string; quantity: number; familyQuantity?: number }>({
  config,
}: {
  config: FamilyItemFormConfig<TItem>;
}) => {
  const { mutate, isPending } = config.useAddMutation();
  const result = config.useGetItems();
  const { data: patientsData } = config.usePatients();
  const patients = patientsData?.patients ?? [];

  const items = useMemo(() => {
    if (Array.isArray(result.data)) return result.data;
    if (result.data?.medicines) return result.data.medicines;
    if (result.data?.articles) return result.data.articles;
    return [];
  }, [result.data]);

  const { register, handleSubmit, control, reset, setValue } = useForm<FamilyFormValues>({
    defaultValues: {
      name: "",
      patientId: "",
      unitsPerPackage: "",
      quantity: "",
    },
  });

  const onSubmit = useCallback(
    (data: FamilyFormValues) => {
    const payload = config.buildPayload({
      name: data.name,
      patientId: data.patientId,
      unitsPerPackage: data.unitsPerPackage === "" ? undefined : Number(data.unitsPerPackage),
      quantity: data.quantity === "" ? undefined : Number(data.quantity),
    }, true);
    mutate(payload, {
      onSuccess: () => reset(),
    });
  }, [mutate, reset, config] 
);

  return (
    <div className="p-6 bg-white shadow-lg rounded-xl space-y-4">
      <h2 className="text-xl font-bold">{config.title}</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Controller
          name="name"
          control={control}
          rules={{ required: `Morate izabrati ${config.itemNameSingular}` }}
          render={({ field, fieldState }) => (
            <div>
              <SearchableSelect
                value={field.value}
                onChange={(val) => {
                  field.onChange(val);
                  setValue("unitsPerPackage", "");
                  setValue("quantity", "");
                }}
                options={[
                  { value: "", label: ``,extra: { home: 0, family: 0 } },
                  ...items.map((item) => ({
                    value: item.name,
                    label: item.name,
                    extra: { home: item.quantity, family: item.familyQuantity ?? 0 },
                  })),
                ]}
                renderOption={(opt) => (
                  <>
                    <div className="font-medium">{opt.label}</div>
                    {opt.value !== "" && (
                      <div className="text-xs text-gray-500">
                        🏥 {opt.extra?.home} | 👪 {opt.extra?.family}
                      </div>
                    )}
                  </>
                )}
                placeholder={`Izaberi ${config.itemNameSingular}...`}
              />
              {fieldState.error && (
                <p className="text-red-500 text-sm mt-1">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />

        <Controller
          name="patientId"
          control={control}
          rules={{ required: "Morate izabrati pacijenta" }}
          render={({ field, fieldState }) => (
            <div>
              <PatientSelect
                value={field.value}
                onChange={field.onChange}
                placeholder="— Izaberi pacijenta —"
                options={patients.map((p: any) => ({
                  value: p._id,
                  label: `${p.name} ${p.lastName}`,
                }))}
              />
              {fieldState.error && (
                <p className="text-red-500 text-sm mt-1">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />

        <input
          type="number"
          placeholder={config.placeholderUnit}
          {...register("unitsPerPackage")}
          className="border p-2 w-full rounded"
        />

        <input
          type="number"
          placeholder="Ukupna količina"
          {...register("quantity", { required: "Količina je obavezna" })}
          className="border p-2 w-full rounded"
        />

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-blue-600 text-white py-2 rounded-lg disabled:bg-blue-300"
        >
          {isPending ? "Čuvanje..." : "Sačuvaj"}
        </button>
      </form>
    </div>
  );
};