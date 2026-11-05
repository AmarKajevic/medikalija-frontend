import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/api/api";

export interface AppNotification {
  _id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const KEY = ["notifications"];

export const useNotifications = () =>
  useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<AppNotification[]> => {
      const { data } = await api.get("/api/notifications");
      const list: AppNotification[] = data.notifications ?? [];
      // Prvo nepročitane, pa po datumu (novije gore)
      return [...list].sort((a, b) =>
        a.isRead === b.isRead ? +new Date(b.createdAt) - +new Date(a.createdAt) : a.isRead ? 1 : -1
      );
    },
    refetchInterval: 60_000,
  });

export const useMarkAllNotificationsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.put("/api/notifications/read-all", {}),
    onSuccess: () => {
      qc.setQueryData<AppNotification[]>(KEY, (old) => old?.map((n) => ({ ...n, isRead: true })));
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
};

export const useMarkNotificationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.put(`/api/notifications/${id}/read`, {}),
    onSuccess: (_, id) => {
      qc.setQueryData<AppNotification[]>(KEY, (old) => old?.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
};

export const relativeTime = (iso: string) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "upravo";
  if (diff < 3600) return `pre ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `pre ${Math.floor(diff / 3600)} h`;
  if (diff < 7 * 86400) return `pre ${Math.floor(diff / 86400)} d`;
  return new Date(iso).toLocaleDateString("sr-Latn-RS");
};
