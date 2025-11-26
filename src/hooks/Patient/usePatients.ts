import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { Patient } from "./usePatient";

export default function usePatients() {
    const {token} = useAuth();

    return useQuery({
        queryKey: ["patients"],
        queryFn: async () => {
            const res = await axios.get("http://localhost:5000/api/patient", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            return res.data.patients as Patient[];
        }
    })
}