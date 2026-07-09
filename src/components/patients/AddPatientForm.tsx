import { useForm, Controller } from "react-hook-form";
import DatePicker from "../form/date-picker";
import { useAddPatient } from "../../features/patients/hooks/useAddPatient";

type CreatePatientDto = {
  name: string;
  lastName: string;
  dateOfBirth: Date | null;
  admissionDate: Date | null;
  address: string;
  contactPerson?: string;
};

export default function AddPatientForm() {
  const { mutate, isPending } = useAddPatient();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreatePatientDto>({
    defaultValues: {
      dateOfBirth: null,
      admissionDate: null,
    },
  });

  const onSubmit = (data: CreatePatientDto) => {
    if (!data.dateOfBirth || !data.admissionDate) {
      alert("Molimo izaberite oba datuma");
      return;
    }

    mutate(
      {
        ...data,
        // backend najčešće očekuje string
        dateOfBirth: data.dateOfBirth.toISOString(),
        admissionDate: data.admissionDate.toISOString(),
      },
      {
        onSuccess: () => {
          reset();
        },
        onError: (error: any) => {
          alert(error?.response?.data?.message || "Greška pri dodavanju pacijenta");
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mb-4 space-y-2">
      
      <input
        type="text"
        placeholder="Ime"
        {...register("name", { required: "Ime je obavezno" })}
        className="border p-2 w-full"
      />
      {errors.name && <span>{errors.name.message}</span>}

      <input
        type="text"
        placeholder="Prezime"
        {...register("lastName", { required: "Prezime je obavezno" })}
        className="border p-2 w-full"
      />
      {errors.lastName && <span>{errors.lastName.message}</span>}

      {/* DateOfBirth */}
      <Controller
        control={control}
        name="dateOfBirth"
        render={({ field }) => (
          <DatePicker
            id="dateOfBirth"
            label="Datum rođenja"
            placeholder="DD-MM-YYYY"
            defaultDate={field.value || undefined}
            onChange={([date]) => field.onChange(date)}
          />
        )}
      />

      {/* AdmissionDate */}
      <Controller
        control={control}
        name="admissionDate"
        render={({ field }) => (
          <DatePicker
            id="admissionDate"
            label="Datum prijema"
            placeholder="DD-MM-YYYY"
            defaultDate={field.value || undefined}
            onChange={([date]) => field.onChange(date)}
          />
        )}
      />

      <input
        type="text"
        placeholder="Adresa"
        {...register("address", { required: "Adresa je obavezna" })}
        className="border p-2 w-full"
      />
      {errors.address && <span>{errors.address.message}</span>}

      <input
        type="text"
        placeholder="Kontakt osoba"
        {...register("contactPerson")}
        className="border p-2 w-full"
      />

      <button
        type="submit"
        disabled={isPending}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {isPending ? "Dodavanje..." : "Dodaj pacijenta"}
      </button>
    </form>
  );
}