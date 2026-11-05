import { api } from "@shared/api/api"
import { CreatePatientDto, Patient } from "@features/patients/types/patient"

export const addPatient = async (patient: CreatePatientDto): Promise<{ success: boolean; patient: Patient }> => {
    const res = await api.post('/api/patient/addPatient', patient)
    return res.data
}
