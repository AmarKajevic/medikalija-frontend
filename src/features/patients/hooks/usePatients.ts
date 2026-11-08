import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getPatients } from "@features/patients/api/getPatients";

export const usePatients = () => {
  const qc = useQueryClient();
  return useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const data = await getPatients();
      // Lista već ima podatke svakog pacijenta: profil iz liste se otvara odmah,
      // bez čekanja na zaseban zahtev (postojeći, sveži podaci se ne prepisuju)
      for (const p of (data?.patients ?? []) as Array<{ _id: string }>) {
        if (!qc.getQueryData(["patient", p._id])) qc.setQueryData(["patient", p._id], p);
      }
      return data;
    },
  });
};
