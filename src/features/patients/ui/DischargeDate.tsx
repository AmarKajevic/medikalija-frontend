import { useState } from 'react'
import DatePicker from '../../../components/form/date-picker';
import { useUpdateDischargeDate } from '../hooks/useUpdateDischargeDate';
import ConfirmModal from '../../../shared/ui/ConfirmModal';

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
    <div className="flex items-center border-0 shadow-md gap-4 p-2 rounded-lg">
      <p>{patient.dischargeDate ? "" : "Otpusti pacijenta"}</p>

      {patient.dischargeDate ? (
        new Date(patient.dischargeDate).toLocaleDateString("sr-RS")
      ) : (
        <DatePicker
          id={`dp-${patient._id}`}
          placeholder="Izaberi datum"
          onChange={([date]: any) => {
            if (!date) return;
            setSelectedDate(date);
            setOpen(true); // 🔥 OTVARA MODAL
          }}
        />
      )}

      {patient.dischargeDate ? "Otpusten" : "Čeka datum"}

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
