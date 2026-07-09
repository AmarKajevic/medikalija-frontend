import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";


const API_URL = "http://localhost:5000/api/diagnosis";

export const useDiagnoses = (patientId: string) => {
  const {token} = useAuth()

  
  return useQuery({
    queryKey: ["diagnosis", patientId],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/${patientId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return data.diagnosis;
    },
  });
};

export const useAddDiagnosis = (patientId: string) => {
  const {token} = useAuth()

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newDiagnosis: { description: string }) => {
      const { data } = await axios.post(`${API_URL}/addDiagnosis`, {
        patientId,
        ...newDiagnosis,
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log("Fetched diagnoses:", data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diagnosis", patientId] });
    },
  });
};
