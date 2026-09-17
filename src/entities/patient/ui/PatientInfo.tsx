import DischargeDate from "@features/patients/ui/DischargeDate";
import { User } from "@shared/types/index";

interface Patient {
  _id: string;
  name: string;
  lastName: string;
  dateOfBirth: string | Date;
  address: string;
  createdAt?: string;
  createdBy: User;
  admissionDate: string | Date;
  dischargeDate: string | Date;

}

export default function PatientInfo({ patient }: { patient: Patient }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
        {patient.name} {patient.lastName}
      </h2>
      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
        <p>
          <span className="text-gray-400 dark:text-gray-500">Datum rođenja:</span>{" "}
          {new Date(patient.dateOfBirth).toLocaleDateString("sr-RS")}
        </p>
        <p>
          <span className="text-gray-400 dark:text-gray-500">Adresa:</span> {patient.address}
        </p>
        <p>
          <span className="text-gray-400 dark:text-gray-500">Datum prijema:</span>{" "}
          {new Date(patient.admissionDate).toLocaleDateString("sr-RS")}
        </p>
      </div>
      <div className="mt-3">
        <DischargeDate patient={patient} />
      </div>
    </div>
  )
}