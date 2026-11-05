import { useId, useState } from "react";
import Dialog from "@shared/ui/dialog/Dialog";
import Button from "@shared/ui/button/Button";
import Field, { inputClass } from "@shared/ui/form/Field";
import { notify } from "@shared/lib/notify";
import { toCalendarDay } from "@shared/lib/calendarDay";
import { useUpdateDischargeDate } from "@features/patients/hooks/useUpdateDischargeDate";
import { Patient } from "@entities/patient/hooks/usePatient";

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function DischargeDialog({ open, onClose, patient }: { open: boolean; onClose: () => void; patient: Patient }) {
  const id = useId();
  const [date, setDate] = useState(todayKey);
  const { mutate, isPending } = useUpdateDischargeDate();

  const admission = toCalendarDay(patient.admissionDate).toISOString().slice(0, 10);
  const invalid = !date || date < admission;

  const confirm = () =>
    // "YYYY-MM-DD" backend tumači kao tačno taj kalendarski dan
    mutate(
      { patientId: patient._id, date },
      {
        onSuccess: () => {
          notify.success(`${patient.name} ${patient.lastName} je otpušten/a.`);
          onClose();
        },
        onError: (err) => notify.error(err),
      }
    );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="sm"
      title="Otpust pacijenta"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Otkaži
          </Button>
          <Button variant="danger" size="sm" loading={isPending} disabled={invalid} onClick={confirm}>
            Potvrdi otpust
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Aktivna specifikacija se zatvara na dan otpusta. Posle otpusta se više ne mogu dodavati stavke.
        </p>
        <Field label="Datum otpusta" htmlFor={id} error={date && date < admission ? "Datum otpusta je pre datuma prijema." : undefined}>
          <input id={id} type="date" min={admission} value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
        </Field>
      </div>
    </Dialog>
  );
}
