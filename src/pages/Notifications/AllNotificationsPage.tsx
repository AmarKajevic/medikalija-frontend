import { useEffect, useState } from "react";
import { api } from "@shared/api/api";
import { useNavigate } from "react-router";

interface Notification {
  _id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function AllNotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/api/notifications");

      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error("Greška pri učitavanju:", err);
    }
    setLoading(false);
  };

  const markAllAsRead = async () => {
    try {
      await api.put("/api/notifications/read-all", {});
      fetchNotifications();
    } catch (err) {
      console.error("Greška pri označavanju:", err);
    }
  };

  const markOneAsRead = async (id: string) => {
    try {
      await api.put(`/api/notifications/${id}/read`, {});
      fetchNotifications();
    } catch (err) {
      console.error("Greška pri označavanju jedne:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString("sr-RS");

  if (loading) return <p className="p-6 text-sm text-gray-500 dark:text-gray-400">Učitavanje...</p>;

  return (
    <div className="p-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-sm text-brand-500 hover:underline"
      >
        ← Nazad
      </button>

      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">Sva obaveštenja</h1>

        <button
          onClick={markAllAsRead}
          className="rounded-lg bg-success-500 px-4 py-2 text-sm font-medium text-white hover:bg-success-600"
        >
          Označi sve kao pročitano
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {notifications.length === 0 ? (
          <p className="p-4 text-sm text-gray-500 dark:text-gray-400">Nema obaveštenja.</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {notifications.map((n) => (
              <li
                key={n._id}
                className={`flex items-center justify-between p-4 ${
                  n.isRead ? "" : "bg-warning-50 dark:bg-warning-500/10"
                }`}
              >
                <div>
                  <p className="font-medium text-gray-800 dark:text-white/90">{n.message}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(n.createdAt)}
                  </p>
                </div>

                {!n.isRead && (
                  <button
                    onClick={() => markOneAsRead(n._id)}
                    className="rounded-md bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600"
                  >
                    Označi kao pročitano
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
