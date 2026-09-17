import { useForm, Controller } from "react-hook-form";
import DatePicker from "@shared/ui/form/date-picker";
import Label from "@shared/ui/form/Label";
import { useAddPatient } from "@features/patients/hooks/useAddPatient";

const fieldInputClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30";

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
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]"
    >
      <h2 className="mb-5 text-base font-semibold text-gray-800 dark:text-white/90">
        Dodaj pacijenta
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>Ime *</Label>
          <input
            type="text"
            placeholder="Ime"
            {...register("name", { required: "Ime je obavezno" })}
            className={fieldInputClass}
          />
          {errors.name && <p className="mt-1 text-sm text-error-500">{errors.name.message}</p>}
        </div>

        <div>
          <Label>Prezime *</Label>
          <input
            type="text"
            placeholder="Prezime"
            {...register("lastName", { required: "Prezime je obavezno" })}
            className={fieldInputClass}
          />
          {errors.lastName && <p className="mt-1 text-sm text-error-500">{errors.lastName.message}</p>}
        </div>

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

        <div>
          <Label>Adresa *</Label>
          <input
            type="text"
            placeholder="Adresa"
            {...register("address", { required: "Adresa je obavezna" })}
            className={fieldInputClass}
          />
          {errors.address && <p className="mt-1 text-sm text-error-500">{errors.address.message}</p>}
        </div>

        <div>
          <Label>Kontakt osoba</Label>
          <input
            type="text"
            placeholder="Kontakt osoba"
            {...register("contactPerson")}
            className={fieldInputClass}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-5 w-full rounded-lg bg-brand-500 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300 sm:w-auto sm:px-6"
      >
        {isPending ? "Dodavanje..." : "Dodaj pacijenta"}
      </button>
    </form>
  );
}