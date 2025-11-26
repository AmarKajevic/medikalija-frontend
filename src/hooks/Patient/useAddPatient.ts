import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { Patient } from "./usePatient";
import axios from "axios";

export default function useAddPatient(){
    const {token} = useAuth();
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (newPatient: Omit<Patient, "_id" | "createdBy">) => {
            const res = await axios.post("http://localhost:5000/api/patient/addPatient", newPatient, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            
            return res.data.patient as Patient;
            
        },
        
        onSuccess: () => {
            // osvežava listu pacijenata
            queryClient.invalidateQueries();
        }
    })
}