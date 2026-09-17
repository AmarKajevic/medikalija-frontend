import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Patient } from "@entities/patient/hooks/usePatient";
import { api } from "@shared/api/api";

export default function useAddPatient(){
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (newPatient: Omit<Patient, "_id" | "createdBy">) => {
            const res = await api.post("/api/patient/addPatient", newPatient)

            return res.data.patient as Patient;

        },
        
        onSuccess: () => {
            // osvežava listu pacijenata
            queryClient.invalidateQueries({queryKey:["patients"]});
        }
    })
}