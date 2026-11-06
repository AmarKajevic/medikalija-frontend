import { useId } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import Dialog from "@shared/ui/dialog/Dialog";
import Button from "@shared/ui/button/Button";
import Field from "@shared/ui/form/Field";
import { Input } from "@shared/ui/form/controls";
import { notify } from "@shared/lib/notify";
import { paths } from "@app/paths";
import { useAddPatient } from "@features/patients/hooks/useAddPatient";
import DateInput from "@shared/ui/form/DateInput";

type FormValues = {
  name: string;
  lastName: string;
  dateOfBirth: string;
  admissionDate: string;
  address: string;
  contactPerson: string;
};

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function AddPatientDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const formId = useId();
  const navigate = useNavigate();
  const { mutate, isPending } = useAddPatient();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { name: "", lastName: "", dateOfBirth: "", admissionDate: todayKey(), address: "", contactPerson: "" },
  });

  const close = () => {
    reset();
    onClose();
  };

  // Datumi idu kao "YYYY-MM-DD" — backend ih tumači kao tačno taj kalendarski dan
  const onSubmit = (values: FormValues) =>
    mutate(
      { ...values, name: values.name.trim(), lastName: values.lastName.trim() },
      {
        onSuccess: (res) => {
          notify.success(`${values.name} ${values.lastName} je dodat/a.`);
          close();
          if (res?.patient?._id) navigate(paths.patient(res.patient._id));
        },
        onError: (err) => notify.error(err, "Pacijent nije dodat."),
      }
    );

  const id = (name: string) => `${formId}-${name}`;

  return (
    <Dialog
      open={open}
      onClose={close}
      size="lg"
      title="Novi pacijent"
      description="Od datuma prijema računaju se 30-dnevni periodi specifikacija."
      footer={
        <>
          <Button variant="outline" size="sm" onClick={close}>
            Otkaži
          </Button>
          <Button size="sm" type="submit" form={formId} loading={isPending}>
            Dodaj pacijenta
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label="Ime" htmlFor={id("name")} error={errors.name?.message}>
          <Input id={id("name")} autoFocus invalid={!!errors.name} {...register("name", { required: "Unesite ime." })} />
        </Field>
        <Field label="Prezime" htmlFor={id("lastName")} error={errors.lastName?.message}>
          <Input id={id("lastName")} invalid={!!errors.lastName} {...register("lastName", { required: "Unesite prezime." })} />
        </Field>
        <Field label="Datum rođenja" htmlFor={id("dob")} error={errors.dateOfBirth?.message}>
          <Controller
            name="dateOfBirth"
            control={control}
            rules={{ required: "Unesite datum rođenja." }}
            render={({ field }) => (
              <DateInput id={id("dob")} value={field.value} onChange={field.onChange} max={todayKey()} fromYear={1900} invalid={!!errors.dateOfBirth} />
            )}
          />
        </Field>
        <Field label="Datum prijema" htmlFor={id("admission")} error={errors.admissionDate?.message}>
          <Controller
            name="admissionDate"
            control={control}
            rules={{ required: "Unesite datum prijema." }}
            render={({ field }) => (
              <DateInput id={id("admission")} value={field.value} onChange={field.onChange} fromYear={2000} invalid={!!errors.admissionDate} />
            )}
          />
        </Field>
        <Field label="Adresa" htmlFor={id("address")} error={errors.address?.message} className="sm:col-span-2">
          <Input id={id("address")} invalid={!!errors.address} {...register("address", { required: "Unesite adresu." })} />
        </Field>
        <Field label="Kontakt osoba" htmlFor={id("contact")} hint="Ime i telefon člana porodice (opciono)." className="sm:col-span-2">
          <Input id={id("contact")} {...register("contactPerson")} placeholder="npr. Jovan Jovanović, 064 123 4567" />
        </Field>
      </form>
    </Dialog>
  );
}
