import { useEffect, useState } from "react";
import { api } from "@shared/api/api";
import { useAuth } from "@app/providers/AuthContext";
import { TrashBinIcon } from "@shared/icons";

export default function UserList() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✔ Mapa prevoda rola na srpski
  const ROLE_LABELS: Record<string, string> = {
    admin: "Direktor",
    "main-nurse": "Glavna sestra",
    nurse: "Medicinska sestra",
    doctor: "Doktor",
    Caregiver: "Negovatelj",
    Physiotherapist: "Fizioterapeut",
    Cleaner: "spremač",
    Kitchen: "Kuhinja",
    "Social Worker": "Socijalni radnik",
    Janitor: "Domar",
    "Occupational Therapist": "Radni terapeut",
    Administration: "Uprava",
  };

  const loadUsers = async () => {
    try {
      const res = await api.get("/api/auth/users");
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
      await api.delete(`/api/auth/users/${id}`);
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
      <div className="pt-10 text-center text-lg font-semibold text-error-500">
        Nemate ovlašćenja za prikaz korisnika.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pt-10 text-center text-sm text-gray-500 dark:text-gray-400">
        Učitavanje korisnika...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white/90">
        Lista korisnika
      </h1>

      {/* TABLE WRAPPER */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03]">
              <tr className="text-left">
                <th className="p-4 text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Ime</th>
                <th className="p-4 text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Prezime</th>
                <th className="hidden p-4 text-xs font-medium uppercase text-gray-500 dark:text-gray-400 md:table-cell">
                  Email
                </th>
                <th className="p-4 text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Uloga</th>
                <th className="p-4 text-center text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Akcija</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {users.map((u: any) => (
                <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-white/[0.03]">
                  <td className="p-4 font-medium text-gray-800 dark:text-white/90">{u.name}</td>

                  <td className="p-4 text-gray-700 dark:text-gray-300">{u.lastName}</td>

                  <td className="hidden p-4 text-sm text-gray-500 dark:text-gray-400 md:table-cell">
                    {u.email || "—"}
                  </td>

                  <td className="p-4">
                    <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>

                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleDelete(u._id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-error-50 px-3 py-1.5 text-sm font-medium text-error-600 transition hover:bg-error-100 dark:bg-error-500/15 dark:text-error-400 dark:hover:bg-error-500/25"
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
      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 md:hidden">
        * Za više informacija (email), pogledajte u landscape modu ili na desktopu.
      </p>
    </div>
  );
}
