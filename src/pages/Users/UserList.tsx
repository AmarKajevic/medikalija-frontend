import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { TrashBinIcon } from "../../icons";

export default function UserList() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✔ Mapa prevoda rola na srpski
  const ROLE_LABELS: Record<string, string> = {
    admin: "Administrator",
    "main-nurse": "Glavna sestra",
    nurse: "Medicinska sestra",
    doctor: "Doktor",
    Caregiver: "Negovatelj",
    Physiotherapist: "Fizioterapeut",
    Cleaner: "Čistačica",
    Kitchen: "Kuhinja",
    "Social Worker": "Socijalni radnik",
    Janitor: "Domar",
    "Occupational Therapist": "Radni terapeut",
    Administration: "Administracija",
  };

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "https://medikalija-api.vercel.app/api/auth/users",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(res.data.users);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Da li ste sigurni da želite obrisati korisnika?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `https://medikalija-api.vercel.app/api/auth/users/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(users.filter((u: any) => u._id !== id));
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  if (!user || !["admin", "main-nurse"].includes(user.role)) {
    return (
      <div className="text-center text-red-500 font-semibold text-lg pt-10">
        ❌ Nemate ovlašćenja za prikaz korisnika.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center pt-10 text-gray-700 text-lg font-medium">
        Učitavanje korisnika...
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Lista korisnika</h1>

      {/* TABLE WRAPPER */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-100 text-gray-700 sticky top-0 z-10">
              <tr className="text-left">
                <th className="p-4 text-sm font-semibold">Ime</th>
                <th className="p-4 text-sm font-semibold">Prezime</th>
                <th className="p-4 text-sm font-semibold hidden md:table-cell">
                  Email
                </th>
                <th className="p-4 text-sm font-semibold">Uloga</th>
                <th className="p-4 text-sm font-semibold text-center">Akcija</th>
              </tr>
            </thead>

            <tbody>
              {users.map((u: any, i: number) => (
                <tr
                  key={u._id}
                  className={`border-t transition hover:bg-gray-50 ${
                    i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                  }`}
                >
                  <td className="p-4 font-medium text-gray-900">{u.name}</td>

                  <td className="p-4 text-gray-700">{u.lastName}</td>

                  <td className="p-4 text-gray-600 text-sm hidden md:table-cell">
                    {u.email || "—"}
                  </td>

                  <td className="p-4">
                    <span
                      className="
                      px-3 py-1 text-xs font-semibold rounded-full
                      bg-blue-100 text-blue-700
                    "
                    >
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>

                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleDelete(u._id)}
                      className="
                        inline-flex items-center gap-1
                        px-3 py-1.5 text-sm font-medium rounded-lg
                        bg-red-100 text-red-700 hover:bg-red-200
                        transition
                      "
                    >
                      <TrashBinIcon className="h-4 w-4" />
                      Obriši
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </div>

      {/* RESPONSIVE FOOTNOTE FOR MOBILE */}
      <p className="text-xs text-gray-500 mt-3 md:hidden">
        * Za više informacija (email), pogledajte u landscape modu ili na desktopu.
      </p>
    </div>
  );
}
