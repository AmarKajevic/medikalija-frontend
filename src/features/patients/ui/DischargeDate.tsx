import { useState } from 'react'
import DatePicker from "@shared/ui/form/date-picker";
import { useUpdateDischargeDate } from "@features/patients/hooks/useUpdateDischargeDate";
import ConfirmModal from "@shared/ui/ConfirmModal";

interface Patient {
    dischargeDate: string | Date;
    _id: string
}

const DischargeDate = ({patient} : {patient: Patient}) => {
   const { mutate: updateDischarge, isPending } = useUpdateDischargeDate();
   const [open, setOpen] = useState(false)
     const [selectedDate, setSelectedDate] = useState<Date | null>(null);

     const handleDate = () => {
    if (!selectedDate) return;

    updateDischarge(
      {
        patientId: patient._id,
        date: selectedDate.toISOString(),
      },
      {
        onSuccess: () => setOpen(false),
      }
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {patient.dischargeDate ? (
        <>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(patient.dischargeDate).toLocaleDateString("sr-RS")}
          </span>
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-white/5 dark:text-gray-400">
            Otpušten
          </span>
        </>
      ) : (
        <>
          <span className="text-sm text-gray-500 dark:text-gray-400">Otpusti pacijenta:</span>
          <div className="w-44">
            <DatePicker
              id={`dp-${patient._id}`}
              placeholder="Izaberi datum"
              onChange={([date]: any) => {
                if (!date) return;
                setSelectedDate(date);
                setOpen(true); // 🔥 OTVARA MODAL
              }}
            />
          </div>
          <span className="rounded-full bg-success-50 px-2.5 py-0.5 text-xs font-medium text-success-600 dark:bg-success-500/15 dark:text-success-500">
            Čeka datum
          </span>
        </>
      )}

      <ConfirmModal
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleDate}
        loading={isPending}
        title="Otpust pacijenta"
        description="Da li si siguran da želiš da otpustiš pacijenta?"
        confirmText="Potvrdi"
        cancelText="Otkaži"
        variant="danger"
      />
    </div>
  );
}

export default DischargeDate
