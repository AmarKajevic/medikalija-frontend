import { useEffect, useId } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { api } from "@shared/api/api";
import { toCalendarDay } from "@shared/lib/calendarDay";
import type { Patient } from "@entities/patient/hooks/usePatient";

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

// Kalendarski dan (i stari zapisi sačuvani kao lokalna ponoć daju tačan dan)
const dayKey = (v: string | Date | null | undefined) => (v ? toCalendarDay(v).toISOString().slice(0, 10) : "");
const valuesOf = (p: Patient): FormValues => ({
  name: p.name,
  lastName: p.lastName,
  dateOfBirth: dayKey(p.dateOfBirth),
  admissionDate: dayKey(p.admissionDate),
  address: p.address ?? "",
  contactPerson: p.contactPerson ?? "",
});

// Novi pacijent, ili ispravka podataka postojećeg (`patient`) ako je nešto pogrešno uneto
export default function AddPatientDialog({ open, onClose, patient }: { open: boolean; onClose: () => void; patient?: Patient }) {
  const formId = useId();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const add = useAddPatient();
  const editing = !!patient;
  const update = useMutation({
    mutationFn: async (values: FormValues) => (await api.put(`/api/patient/${patient!._id}`, values)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patient", patient!._id] });
      qc.invalidateQueries({ queryKey: ["patients"] });
    },
  });
  const isPending = add.isPending || update.isPending;
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { name: "", lastName: "", dateOfBirth: "", admissionDate: todayKey(), address: "", contactPerson: "" },
  });

  // Izmena: polja popunjena trenutnim podacima pri svakom otvaranju
  useEffect(() => {
    if (open && patient) reset(valuesOf(patient));
  }, [open, patient, reset]);

  const close = () => {
    reset();
    onClose();
  };

  // Datumi idu kao "YYYY-MM-DD" — backend ih tumači kao tačno taj kalendarski dan
  const onSubmit = (values: FormValues) => {
    if (editing) {
      return update.mutate(
        { ...values, name: values.name.trim(), lastName: values.lastName.trim() },
        {
          onSuccess: () => {
            notify.success("Podaci pacijenta su izmenjeni.");
            onClose();
          },
          onError: (err) => notify.error(err, "Izmene nisu sačuvane."),
        }
      );
    }
    add.mutate(
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
  };

  const id = (name: string) => `${formId}-${name}`;

  return (
    <Dialog
      open={open}
      onClose={close}
      size="lg"
      title={editing ? "Izmena podataka pacijenta" : "Novi pacijent"}
      description={
        editing
          ? "Ispravite pogrešno uneto. Već napravljene specifikacije i periodi se ne menjaju."
          : "Od datuma prijema računaju se 30-dnevni periodi specifikacija."
      }
      footer={
        <>
          <Button variant="outline" size="sm" onClick={close}>
            Otkaži
          </Button>
          <Button size="sm" type="submit" form={formId} loading={isPending}>
            {editing ? "Sačuvaj izmene" : "Dodaj pacijenta"}
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
        <Field label="Datum rođenja (nije obavezno)" htmlFor={id("dob")} error={errors.dateOfBirth?.message}>
          <Controller
            name="dateOfBirth"
            control={control}
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
        <Field label="Adresa (nije obavezno)" htmlFor={id("address")} error={errors.address?.message} className="sm:col-span-2">
          <Input id={id("address")} invalid={!!errors.address} {...register("address")} />
        </Field>
        <Field label="Kontakt osoba" htmlFor={id("contact")} hint="Ime i telefon člana porodice (opciono)." className="sm:col-span-2">
          <Input id={id("contact")} {...register("contactPerson")} placeholder="npr. Jovan Jovanović, 064 123 4567" />
        </Field>
      </form>
    </Dialog>
  );
}
