import { useUpdateMedicine } from "@features/medicine/hooks/useUpdateMedicine";
import useCleanForm from "@shared/api/forms/UseCleanForm";
import FormInput from "@shared/api/forms/InputField";

type FormValues = {
  name?: string;
  pricePerUnit?: number;
  unitsPerPackage?: number;
  quantity?: number;
  addQuantity?: number;
  packages?: number;
};

const UpdateMedicine = ({ medicineId }: { medicineId: string }) => {
  const { mutate, isPending } = useUpdateMedicine();

const { register, handleSubmit, getPayload } = useCleanForm<FormValues>();

const onSubmit = (data: FormValues) => {
  console.log("Raw data:", data);
  const payload = getPayload(data);
  console.log("Payload:", payload);
  if (Object.keys(payload).length === 0) {
    console.warn("Nema podataka za slanje");
    return;
  }
  mutate({ medicineId, data: payload });
};


  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]"
    >
      <h2 className="mb-5 text-base font-semibold text-gray-800 dark:text-white/90">
        Izmeni lek
      </h2>

      <div className="space-y-4">
        <FormInput name="name" register={register} placeholder="Promeni ime" type="text" />
        <FormInput name="pricePerUnit" register={register} placeholder="Promeni cenu" />
        <FormInput name="quantity" register={register} placeholder="Promeni ukupnu količinu" />
        <FormInput name="unitsPerPackage" register={register} placeholder="Promeni broj tableta u pakovanju" />
        <FormInput name="addQuantity" register={register} placeholder="Dodaj komade tableta" />
        <FormInput name="packages" register={register} placeholder="Dodaj cela pakovanja" />
      </div>

      <button
        className="mt-5 w-full rounded-lg bg-brand-500 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
        type="submit"
        disabled={isPending}
      >
        {isPending ? "Čuvanje..." : "Sačuvaj"}
      </button>
    </form>
  );
};

export default UpdateMedicine;