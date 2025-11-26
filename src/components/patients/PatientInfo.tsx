import { User } from "../../types";

interface Patient {
  _id: string;
  name: string;
  lastName: string;
  dateOfBirth: string | Date;
  address: string;
  createdAt?: string;
  createdBy: User;
  admissionDate: string | Date;

}

export default function PatientInfo({ patient }: { patient: Patient }) {
  return (
        <div>
      <h2 className=" flex justify-items-start space-y-1 py-4 text-2xl font-bold">
        {patient.name} {patient.lastName} 
      </h2>
      <p>
        <strong>Datum rođenja:</strong>{" "}
        {new Date(patient.dateOfBirth).toLocaleDateString("sr-RS")}
      </p>
      <p>
        <strong>Adresa:</strong> {patient.address}
      </p>
      <p>
        <strong>Datum Prijema</strong>{" "}
        {new Date(patient.admissionDate).toLocaleDateString("sr-RS")}
      </p>

    </div>

  )
}