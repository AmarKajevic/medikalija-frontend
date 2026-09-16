import { api } from "@shared/api/api";
import { DashboardStats } from "@features/dashboard/types";

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const { data } = await api.get("/api/dashboard/stats");
  return data.stats;
};
