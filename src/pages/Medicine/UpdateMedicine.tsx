import { useUpdateMedicine } from "../../features/medicine/hooks/useUpdateMedicine";
import useCleanForm from "../../shared/api/forms/UseCleanForm";
import FormInput from "../../shared/api/forms/InputField";

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
      className="flex flex-col gap-4 space-y-1 border-0 shadow-md rounded-md p-8 max-w-2xl"
    >
        <FormInput name="name" register={register} placeholder="promeni Ime" type="text" />
        <FormInput name="pricePerUnit" register={register} placeholder="promeni cenu" />

        <FormInput name="quantity" register={register} placeholder=" promeni ukupnu količinu" />
        <FormInput name="unitsPerPackage" register={register} placeholder="promeni broj tableta u pakovanju" />
        <FormInput name="addQuantity" register={register} placeholder="Dodaj komade tableta" />
        <FormInput name="packages" register={register} placeholder="Dodaj cela pakovanja" />


     
      <button
        className="border-0 bg-blue-500 rounded-md shadow-md text-white p-2"
        type="submit"
        disabled={isPending}
      >
        Sačuvaj
      </button>
    </form>
  );
};

export default UpdateMedicine;