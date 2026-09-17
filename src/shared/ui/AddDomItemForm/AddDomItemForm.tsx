import { useForm, Controller } from "react-hook-form";
import { useCallback, useMemo } from "react";
import { FaHome } from "react-icons/fa";
import { SearchableSelect } from "@shared/ui/SearchableSelect/SearchableSelect";
import Label from "@shared/ui/form/Label";
import type { Option } from "@shared/ui/SearchableSelect/types";
import type { DomItemFormConfig, DomFormValues } from "@shared/ui/AddDomItemForm/types";

const fieldInputClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30";

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
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
          <FaHome />
        </div>
        <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">
          {config.title}
        </h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* SearchableSelect za naziv */}
        <Controller
          name="name"
          control={control}
          rules={{ required: `Naziv ${config.itemNameSingular}a je obavezan` }}
          render={({ field, fieldState }) => (
            <div>
              <Label>Naziv {config.itemNameSingular}a *</Label>
              <SearchableSelect
                value={field.value}
                onChange={handleItemChange}
                options={selectOptions}
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
                placeholder={`Izaberi ili unesi naziv ${config.itemNameSingular}a...`}
                allowFreeText={true} // ← ključno
              />
              {fieldState.error && (
                <p className="mt-1 text-sm text-error-500">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />

        <div>
          <Label>{config.placeholderPrice} *</Label>
          <input
            type="number"
            step="0.01"
            {...register("price", {
              required: "Cena je obavezna",
              valueAsNumber: true,
              min: { value: 0, message: "Cena mora biti pozitivna" },
            })}
            placeholder={config.placeholderPrice}
            className={fieldInputClass}
          />
          {errors.price && (
            <p className="mt-1 text-sm text-error-500">{errors.price.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>{config.placeholderUnit}</Label>
            <input
              type="number"
              {...register("unitsPerPackage", {
                valueAsNumber: true,
                min: { value: 1, message: "Mora biti najmanje 1" },
              })}
              placeholder={config.placeholderUnit}
              className={fieldInputClass}
            />
          </div>

          <div>
            <Label>Ukupna količina *</Label>
            <input
              type="number"
              {...register("quantity", {
                required: "Ukupna količina je obavezna",
                valueAsNumber: true,
                min: { value: 1, message: "Mora biti najmanje 1" },
              })}
              placeholder="Ukupna količina"
              className={fieldInputClass}
            />
          </div>
        </div>
        {errors.quantity && (
          <p className="text-sm text-error-500">{errors.quantity.message}</p>
        )}

        <button
          type="submit"
          disabled={isPending || !!errors.name}
          className="w-full rounded-lg bg-brand-500 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
        >
          {isPending ? "Čuvanje..." : "Sačuvaj"}
        </button>
      </form>
    </div>
  );
};
