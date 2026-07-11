import { useForm, Controller } from "react-hook-form";
import { useCallback, useMemo } from "react";
import { SearchableSelect } from "../SearchableSelect/SearchableSelect";
import type { Option } from "../SearchableSelect/types";
import type { DomItemFormConfig, DomFormValues } from "./types";

export const AddDomItemForm = <
  TItem extends {
    name: string;
    price?: number;
    pricePerUnit?: number;
    quantity: number;
    familyQuantity?: number;
  },
>({
  config,
}: {
  config: DomItemFormConfig<TItem>;
}) => {
  const { mutate, isPending } = config.useAddMutation();
  const result = config.useGetItems();

  const items = useMemo(() => {
    if (Array.isArray(result.data)) return result.data;
    if (result.data?.medicines) return result.data.medicines;
    if (result.data?.articles) return result.data.articles;
    return [];
  }, [result.data]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<DomFormValues>({
    defaultValues: {
      mode: "new",
      name: "",
      price: "",
      unitsPerPackage: "",
      quantity: "",
    },
  });



  const selectOptions = useMemo<Option<{ home: number; family: number }>[]>(
    () => [
      { value: "", label: "" },
      ...items.map((item) => ({
        value: item.name,
        label: item.name,
        extra: { home: item.quantity, family: item.familyQuantity ?? 0 },
      })),
    ],
    [items],
  );

  const handleItemChange = useCallback(
    (value: string) => {
      setValue("name", value);
      if (value) {
        const found = items.find(
          (item) => item.name.toLowerCase() === value.toLowerCase(),
        );
        if (found) {
          const priceValue =
            config.priceFieldName === "price"
              ? (found as any).price
              : (found as any).pricePerUnit;
          setValue("price", priceValue ?? "");
          setError("name", {
            type: "manual",
            message: `${config.itemNameSingular} sa tim nazivom već postoji.`,
          });
        } else {
          setValue("price", "");
          clearErrors("name");
        }
      } else {
        setValue("price", "");
        clearErrors("name");
      }
      setValue("unitsPerPackage", "");
      setValue("quantity", "");
    },
    [items, setValue, setError, clearErrors, config.priceFieldName],
  );

  const onSubmit = useCallback(
    (data: DomFormValues) => {
      const exists = items.some(
        (item) => item.name.toLowerCase() === data.name.toLowerCase(),
      );
      if (exists) {
        setError("name", {
          type: "manual",
          message: `${config.itemNameSingular} sa tim nazivom već postoji.`,
        });
        return;
      }
      const payload = config.buildPayload(data, false);
      mutate(payload, {
        onSuccess: () => reset(),
      });
    },
    [mutate, reset, config, items, setError],
  );
  return (
    <div className="p-6 bg-white shadow-lg rounded-xl space-y-4">
      <h2 className="text-xl font-bold">{config.title}</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* SearchableSelect za naziv */}
        <Controller
          name="name"
          control={control}
          rules={{ required: `Naziv ${config.itemNameSingular}a je obavezan` }}
          render={({ field, fieldState }) => (
            <div>
              <SearchableSelect
                value={field.value}
                onChange={handleItemChange}
                options={selectOptions}
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
                placeholder={`Izaberi ili unesi naziv ${config.itemNameSingular}a...`}
                allowFreeText={true} // ← ključno
              />
              {fieldState.error && (
                <p className="text-red-500 text-sm mt-1">
                  {fieldState.error.message}
                </p>
              )}
            </div>
          )}
        />
        <input
          type="number"
          step="0.01"
          {...register("price", {
            required: "Cena je obavezna",
            valueAsNumber: true,
            min: { value: 0, message: "Cena mora biti pozitivna" },
          })}
          placeholder={config.placeholderPrice}
          className="border p-2 w-full rounded"
        />
        {errors.price && (
          <p className="text-red-500 text-sm">{errors.price.message}</p>
        )}

        <input
          type="number"
          {...register("unitsPerPackage", {
            valueAsNumber: true,
            min: { value: 1, message: "Mora biti najmanje 1" },
          })}
          placeholder={config.placeholderUnit}
          className="border p-2 w-full rounded"
        />

        <input
          type="number"
          {...register("quantity", {
            required: "Ukupna količina je obavezna",
            valueAsNumber: true,
            min: { value: 1, message: "Mora biti najmanje 1" },
          })}
          placeholder="Ukupna količina"
          className="border p-2 w-full rounded"
        />
        {errors.quantity && (
          <p className="text-red-500 text-sm">{errors.quantity.message}</p>
        )}

        <button
          type="submit"
          disabled={isPending || !!errors.name}
          className="w-full bg-blue-600 text-white py-2 rounded-lg disabled:bg-blue-300"
        >
          {isPending ? "Čuvanje..." : "Sačuvaj"}
        </button>
      </form>
    </div>
  );
};
