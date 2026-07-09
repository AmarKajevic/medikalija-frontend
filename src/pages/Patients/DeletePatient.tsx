import { useEffect, useState } from "react"
import { useAuth } from "../../context/AuthContext";
import axios from "axios";

interface Patient {
  _id: string;
  name: string;
  lastName: string;
  dateOfBirth: string;
  address: string;
}

export default function DeletePatient() {
  const { user, token } = useAuth()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ NOVO: lokalni search (isti kao svuda)
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchPatient = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem("token")
        const response = await axios.get(
          "https://medikalija-api.vercel.app/api/patient",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
        if (response.data.success) {
          setPatients(response.data.patients)
        } else {
          setPatients([])
        }
      } catch (error) {
        console.log(error);
        setError("Ne mogu da učitam pacijente")
      } finally {
        setLoading(false)
      }
    }
    fetchPatient()
  }, [token])

  const handleDelete = async (id: string) => {
    if (!window.confirm("Da li ste sigurni da želite da obrišete pacijenta?")) return;
    try {
      await axios.delete(
        `https://medikalija-api.vercel.app/api/patient/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      )
      setPatients((prev) => prev.filter((p) => p._id !== id))
    } catch (error) {
      console.log(error)
      setError("Greška pri brisanju pacijenta")
    }
  }

  const formatDate = (isoDate: string) => {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return isoDate;

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    return `${day}.${month}.${year}`;
  };

  if (loading) return <p>Učitavanje pacijenata...</p>;
  if (error) return <p>{error}</p>;

  // ✅ filtriranje – BEZ promene dizajna
  const safeSearch = search.toLowerCase();
  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(safeSearch) ||
      p.lastName.toLowerCase().includes(safeSearch)
  );

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-lg rounded-2xl">
      <h2 className="text-xl font-bold mb-4">Lista pacijenata</h2>

      {/* ✅ SEARCH BAR – isti kao svuda */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pretraži pacijente..."
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {filteredPatients.length === 0 ? (
        <p>Nema pacijenata.</p>
      ) : (
        <ul className="space-y-4">
          {filteredPatients.map((p) => (
            <li
              key={p._id}
              className="flex justify-between items-center p-3 border rounded-lg"
            >
              <div>
                <p className="font-semibold">
                  {p.name} {p.lastName}
                </p>
                <p className="text-sm text-gray-600">
                  {formatDate(p.dateOfBirth)}
                </p>
                <p className="text-sm text-gray-600">{p.address}</p>
              </div>

              {(user?.role === "admin" || user?.role === "main-nurse") && (
                <button
                  onClick={() => handleDelete(p._id)}
                  className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600"
                >
                  Obriši
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
