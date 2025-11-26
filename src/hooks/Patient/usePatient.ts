// import { useEffect, useState } from "react";
// import { useAuth } from "../../context/AuthContext";
// import axios from "axios";

// export default function usePatient(patientId : string) {
// const {token} = useAuth()
// const [patient, setPatient] = useState<any>(null);
// const [loading, setLoading] = useState(false);
// const [error, setError]  = useState("");

// useEffect(() => {
//   const fetchPatient = async () => {
    
//     try {
//       setLoading(true);
//       const response = await axios.get(`https://medikalija-api.vercel.app/api/patient/${patientId}`, {
//         headers: {
//           Authorization: `Bearer ${token}`
//         }
//       })
//       if(response.data.success){
//         setPatient(response.data.patient);
//       }
      
//     } catch (error: any) {
//       setError("Greška pri učitavanju pacijenta");
//       console.log(error);
      
//     }finally {
//       setLoading(false);
//     }
//   }
//   fetchPatient();
// },[patientId,token])
// return { patient, loading, error, setPatient };


// }

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { User } from "../../types";

export type Patient = {
  _id: string;
  name: string;
  lastName: string;
  dateOfBirth: string | Date;
  admissionDate: string | Date;

  address: string;
  createdBy: User
};

export default function usePatient(patientId: string) {
  const {token } = useAuth()

  return useQuery({
    queryKey: ["patient", patientId],
    queryFn: async () => {
      const res = await axios.get(`https://medikalija-api.vercel.app/api/patient/${patientId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      return res.data.patient as Patient;

    },
    enabled: !!patientId, // pokreće se samo ako imaš ID
  })
  
}