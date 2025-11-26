import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import PatientList from "../Patients/PatientList";

interface PatientProps {
  _id: string;
  name: string;
  lastName: string;
  address: string;
  dateOfBirth: Date;
  createdAt?: string;
  createdBy?: string;
}

export default function AddFamilyMedicine() {
  const { token } = useAuth();


  const [, setPatients] = useState<PatientProps[]>([]);

  const fetchPatients = async () => {
    try {
      const response = await axios.get("https://medikalija-api.vercel.app/api/patient", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setPatients(response.data.patients);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [token]);

  return (
    <div>
      <PatientList />
    </div>
  );
}
