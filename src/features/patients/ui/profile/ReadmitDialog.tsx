import { useId, useState } from "react";
import Dialog from "@shared/ui/dialog/Dialog";
import Button from "@shared/ui/button/Button";
import Field from "@shared/ui/form/Field";
import DateInput from "@shared/ui/form/DateInput";
import { notify } from "@shared/lib/notify";
import { formatDay, toCalendarDay } from "@shared/lib/calendarDay";
import { todayIso } from "@shared/lib/dateText";
import { useReadmitPatient } from "@features/patients/hooks/useReadmitPatient";
import { Patient } from "@entities/patient/hooks/usePatient";

// Ponovni prijem otpuštenog korisnika (npr. dolazi svako leto): podaci iz kartona ostaju,
// a dokumentacija za novi boravak se pravi ponovo.
export default function ReadmitDialog({ open, onClose, patient }: { open: boolean; onClose: () => void; patient: Patient }) {
  const id = useId();
  const [date, setDate] = useState(todayIso);
  const { mutate, isPending } = useReadmitPatient();

  const discharged = patient.dischargeDate ? toCalendarDay(patient.dischargeDate).toISOString().slice(0, 10) : "";
  const tooEarly = !!date && !!discharged && date <= discharged;

  const confirm = () =>
    mutate(
      { patientId: patient._id, date },
      {
        onSuccess: () => {
          notify.success(`${patient.name} ${patient.lastName} je ponovo primljen/a. Napravite dokumentaciju za novi boravak.`);
          onClose();
        },
        onError: (err) => notify.error(err, "Ponovni prijem nije sačuvan."),
      }
    );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="sm"
      title="Ponovni prijem"
      description={`Otpušten/a ${formatDay(patient.dischargeDate)}`}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Otkaži
          </Button>
          <Button size="sm" loading={isPending} disabled={!date || tooEarly} onClick={confirm}>
            Primi ponovo
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-400">
          <li>Lični podaci, porodica i kontakti iz kartona ostaju.</li>
          <li>Dokumentacija (zahtev, ugovor, procene, plan) se pravi ponovo za novi boravak; raniji dokumenti ostaju u istoriji.</li>
          <li>Periodi specifikacija kreću od novog datuma prijema.</li>
        </ul>
        <Field label="Datum ponovnog prijema" htmlFor={id} error={tooEarly ? "Datum mora biti posle datuma otpusta." : undefined}>
          <DateInput id={id} value={date} onChange={setDate} fromYear={2000} invalid={tooEarly} />
        </Field>
      </div>
    </Dialog>
  );
}
