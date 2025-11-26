import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router";

interface Notification {
  _id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function AllNotificationsPage() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error("Greška pri učitavanju:", err);
    }
    setLoading(false);
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(
        "http://localhost:5000/api/notifications/read-all",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchNotifications();
    } catch (err) {
      console.error("Greška pri označavanju:", err);
    }
  };

  const markOneAsRead = async (id: string) => {
    try {
      await axios.put(
        `http://localhost:5000/api/notifications/${id}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
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

  if (loading) return <p>Učitavanje...</p>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Sva obaveštenja</h2>

        <button
          onClick={markAllAsRead}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Označi sve kao pročitano
        </button>
      </div>

      <Link to={-1 as any} className="text-blue-600 underline">
        ← Nazad
      </Link>

      <div className="mt-4 border rounded-lg bg-white shadow">
        {notifications.length === 0 ? (
          <p className="p-4 text-gray-500">Nema obaveštenja.</p>
        ) : (
          <ul>
            {notifications.map((n) => (
              <li
                key={n._id}
                className={`border-b p-4 flex justify-between items-center ${
                  n.isRead ? "bg-white" : "bg-orange-50"
                }`}
              >
                <div>
                  <p className="font-medium">{n.message}</p>
                  <p className="text-sm text-gray-500">
                    {formatDate(n.createdAt)}
                  </p>
                </div>

                {!n.isRead && (
                  <button
                    onClick={() => markOneAsRead(n._id)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
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
