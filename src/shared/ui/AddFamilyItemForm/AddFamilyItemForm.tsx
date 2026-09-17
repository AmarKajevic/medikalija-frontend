import { useForm, Controller } from "react-hook-form";
import { useCallback, useMemo } from "react";
import { FaUsers } from "react-icons/fa";
import { SearchableSelect } from "@shared/ui/SearchableSelect/SearchableSelect";
import PatientSelect from "@features/patients/ui/PatientSelect"; // ili shared
import Label from "@shared/ui/form/Label";
import type { FamilyItemFormConfig, FamilyFormValues } from "@shared/ui/AddFamilyItemForm/types";

const fieldInputClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30";

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
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500">
          <FaUsers />
        </div>
        <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">
          {config.title}
        </h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Controller
          name="name"
          control={control}
          rules={{ required: `Morate izabrati ${config.itemNameSingular}` }}
          render={({ field, fieldState }) => (
            <div>
              <Label>Naziv {config.itemNameSingular}a *</Label>
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
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        🏥 Dom: {opt.extra?.home} &nbsp;|&nbsp; 👪 Porodica: {opt.extra?.family}
                      </div>
                    )}
                  </>
                )}
                placeholder={`Izaberi ${config.itemNameSingular}...`}
              />
              {fieldState.error && (
                <p className="mt-1 text-sm text-error-500">{fieldState.error.message}</p>
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
              <Label>Pacijent *</Label>
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
                <p className="mt-1 text-sm text-error-500">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>{config.placeholderUnit}</Label>
            <input
              type="number"
              placeholder={config.placeholderUnit}
              {...register("unitsPerPackage")}
              className={fieldInputClass}
            />
          </div>

          <div>
            <Label>Ukupna količina *</Label>
            <input
              type="number"
              placeholder="Ukupna količina"
              {...register("quantity", { required: "Količina je obavezna" })}
              className={fieldInputClass}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-brand-500 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
        >
          {isPending ? "Čuvanje..." : "Sačuvaj"}
        </button>
      </form>
    </div>
  );
};