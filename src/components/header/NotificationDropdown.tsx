import { useState, useEffect } from "react";
import axios from "axios";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Link } from "react-router";
import { useAuth } from "../../context/AuthContext";

interface Notification {
  _id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { token } = useAuth();

  // === Učitaj notifikacije ===
  const loadNotifications = async () => {
    if (!token) return;

    try {
      const res = await axios.get("http://localhost:5000/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const fetched = res.data.notifications ?? [];

      // PRVO NEPROČITANE, ONDA PROČITANE
      const sorted = fetched.sort((a: Notification, b: Notification) => {
        if (a.isRead === b.isRead) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // novije gore
        }
        return a.isRead ? 1 : -1; // unread first
      });

      setNotifications(sorted);
    } catch (error) {
      console.error("Greška pri učitavanju notifikacija:", error);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [token]);

  // === Broj nepročitanih ===
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // === Kada se dropdown otvori – markiraj kao "read" ===
  const handleOpen = async () => {
    setIsOpen((prev) => !prev);

    // ako se OTVARA, označi kao pročitano
    if (!isOpen && unreadCount > 0) {
      try {
        await axios.put(
          "http://localhost:5000/api/notifications/read-all",
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // odmah ažuriraj frontend bez refresh-a
        const updated = notifications.map((n) => ({
          ...n,
          isRead: true,
        }));

        setNotifications(updated);
      } catch (error) {
        console.error("Greška pri označavanju pročitanih:", error);
      }
    }
  };

  const closeDropdown = () => setIsOpen(false);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString("sr-RS");
  };

  return (
    <div className="relative">
      {/* Dugme sa zvonom */}
      <button
        className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800"
        onClick={handleOpen}
      >
        {/* Brojač */}
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white shadow-lg">
            {unreadCount}
          </span>
        )}

        <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
          />
        </svg>
      </button>

      {/* Dropdown */}
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Obaveštenja
          </h5>
          <button
            onClick={closeDropdown}
            className="text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Lista obaveštenja */}
        <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
          {notifications.length === 0 ? (
            <p className="py-4 text-sm text-center text-gray-500">
              Nema obaveštenja.
            </p>
          ) : (
            notifications.map((n) => (
              <li key={n._id}>
                <DropdownItem
                  onItemClick={closeDropdown}
                  className={`flex gap-3 rounded-lg border-b border-gray-100 p-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5 ${
                    !n.isRead ? "bg-orange-50" : ""
                  }`}
                >
                  <span className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-xs font-bold text-white bg-brand-500 rounded-full">
                    !
                  </span>

                  <div className="flex flex-col">
                    <span className="text-sm text-gray-800 dark:text-white">
                      {n.message}
                    </span>
                    <span className="mt-1 text-xs text-gray-500">
                      {formatDate(n.createdAt)}
                    </span>
                  </div>
                </DropdownItem>
              </li>
            ))
          )}
        </ul>

        <Link
          to="/notifications"
          className="block px-4 py-2 mt-3 text-sm font-medium text-center text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          Pogledaj sva obaveštenja
        </Link>
      </Dropdown>
    </div>
  );
}
