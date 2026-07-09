import { User } from "../../users/types/User";


export type Patient = {
  _id: string;
  name: string;
  lastName: string;
  dateOfBirth: string | Date;
  admissionDate: string | Date;
  contactPerson: string;
  address: string;
  createdBy: User
};

export type CreatePatientDto = {
  name: string;
  lastName: string;
  dateOfBirth: string;
  admissionDate: string;
  contactPerson?: string;
  address: string;
};
