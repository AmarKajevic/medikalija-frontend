import { api } from "../../../shared/api/api"
import { CreatePatientDto, Patient } from "../types/patient"

export const addPatient = async (patient: CreatePatientDto) => {
    const res = await api.post('/patient/addPatient', patient)
    return res.data as Patient
}