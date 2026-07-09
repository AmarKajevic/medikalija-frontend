import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import Input from "../../components/form/input/InputField";

interface Article {
  _id: string;
  name: string;
  quantity: number;
  familyQuantity?: number;
  unitsPerPackage?: number;
}

export default function AddArticleFromFamily() {
  const { token } = useAuth();

  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedId, setSelectedId] = useState("");

  const [name, setName] = useState("");
  const [unitsPerPackage, setUnitsPerPackage] = useState<number | "">("");
  const [totalQuantity, setTotalQuantity] = useState<number | "">("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // ===================================================
  // LOAD EXISTING ARTICLES
  // ===================================================
  const loadArticles = async () => {
    try {
      const res = await axios.get(
        "https://medikalija-api.vercel.app/api/articles",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.articles) {
        setArticles(res.data.articles);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadArticles();
  }, [token]);

  // ===================================================
  // SELECTED ARTICLE
  // ===================================================
  const selectedArticle = useMemo(
    () => articles.find((a) => a._id === selectedId),
    [selectedId, articles]
  );

  useEffect(() => {
    if (selectedArticle?.unitsPerPackage) {
      setUnitsPerPackage(selectedArticle.unitsPerPackage);
    } else {
      setUnitsPerPackage("");
    }
    setTotalQuantity("");
  }, [selectedArticle]);

  // ===================================================
  // RESET FORM
  // ===================================================
  const resetForm = () => {
    setSelectedId("");
    setName("");
    setUnitsPerPackage("");
    setTotalQuantity("");
  };

  // ===================================================
  // SUBMIT HANDLER
  // ===================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      if (!unitsPerPackage || !totalQuantity) {
        setMessage("Unesi ukupnu količinu i komade u pakovanju.");
        return;
      }

      const total = Number(totalQuantity);
      const upp = Number(unitsPerPackage);

      // Izračunavanje pakovanja + ostatka
      const packages = Math.floor(total / upp);
      const remainder = total % upp;

      if (selectedId) {
        // UPDATE POSTOJEĆEG
        const payload = {
          fromFamily: true,
          packages,
          unitsPerPackage: upp,
          addQuantity: remainder,
        };

        const res = await axios.put(
          `https://medikalija-api.vercel.app/api/articles/${selectedId}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data.success) {
          setMessage("Uspešno dodata količina (porodica).");
          await loadArticles();
          resetForm();
        }
      } else {
        // NOVI ARTIKAL OD PORODICE
        const payload = {
          name,
          fromFamily: true,
          packages,
          unitsPerPackage: upp,
          quantity: remainder,
        };

        const res = await axios.post(
          "https://medikalija-api.vercel.app/api/articles/add",
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data.success) {
          setMessage("Artikal uspešno dodat (porodica).");
          await loadArticles();
          resetForm();
        }
      }
    } catch (error: any) {
      console.error(error);
      setMessage(error.response?.data?.message || "Greška prilikom dodavanja.");
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // RENDER
  // ===================================================
  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-xl space-y-4">
      <h2 className="text-xl font-bold">
        {selectedId ? "Dodaj količinu (porodica)" : "Dodaj novi artikal (porodica)"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* SELECT */}
        <div>
          <label className="text-sm font-medium text-gray-700">
            Odaberi postojeći ili unesi novi artikal
          </label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full border px-3 py-2 rounded-lg"
          >
            <option value="">— Novi artikal —</option>
            {articles.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name} (Dom: {a.quantity} | Porodica: {a.familyQuantity ?? 0})
              </option>
            ))}
          </select>
        </div>

        {!selectedId && (
          <Input
            type="text"
            placeholder="Naziv artikla"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}

        <Input
          type="number"
          placeholder="broj komada u pakovanju"
          value={unitsPerPackage}
          onChange={(e) =>
            setUnitsPerPackage(e.target.value === "" ? "" : Number(e.target.value))
          }
        />

        <Input
          type="number"
          placeholder="Ukupna količina"
          value={totalQuantity}
          onChange={(e) =>
            setTotalQuantity(e.target.value === "" ? "" : Number(e.target.value))
          }
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg disabled:bg-gray-400"
        >
          {loading ? "Čuvanje..." : "Sačuvaj"}
        </button>
      </form>

      {message && <p className="text-center text-sm">{message}</p>}
    </div>
  );
}
