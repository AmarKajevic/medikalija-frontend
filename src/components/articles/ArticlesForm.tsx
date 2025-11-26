import { useEffect, useState } from "react";

import Input from "../form/input/InputField";
import useArticles from "../../hooks/Patient/useArticle";

export default function ArticlesForm() {
  const {
    getArticles,
    mutate: addArticle,
    editArticle
  } = useArticles();

  const [selectedId, setSelectedId] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [packages, setPackages] = useState<number | "">("");
  const [unitsPerPackage, setUnitsPerPackage] = useState<number | "">("");
  const [looseQuantity, setLooseQuantity] = useState<number | "">("");
  const [fromFamily, setFromFamily] = useState(false);
  const [message, setMessage] = useState("");

  const articles = getArticles.data || [];
  const selectedArticle = articles.find((a) => a._id === selectedId);

  useEffect(() => {
    if (selectedArticle) {
      if (selectedArticle.unitsPerPackage) {
        setUnitsPerPackage(selectedArticle.unitsPerPackage);
      } else {
        setUnitsPerPackage("");
      }
      setPrice(selectedArticle.price);
    } else {
      setUnitsPerPackage("");
      setPrice("");
    }
    setPackages("");
    setLooseQuantity("");
  }, [selectedArticle]);

  const resetForm = () => {
    setSelectedId("");
    setName("");
    setPrice("");
    setPackages("");
    setUnitsPerPackage("");
    setLooseQuantity("");
    setFromFamily(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    const payload: any = {
      fromFamily,
    };

    if (packages !== "") payload.packages = Number(packages);
    if (unitsPerPackage !== "") payload.unitsPerPackage = Number(unitsPerPackage);
    if (looseQuantity !== "") {
      if (selectedId) {
        payload.addQuantity = Number(looseQuantity);
      } else {
        payload.quantity = Number(looseQuantity);
      }
    }
    if (price !== "") payload.price = Number(price);

    if (selectedId) {
      // ažuriraj postojeći
      payload.articleId = selectedId;
      editArticle.mutate(payload);
      setMessage("Količina uspešno dodata.");
    } else {
      // novi artikal
      payload.name = name;
      addArticle(payload);
      setMessage("Artikal uspešno dodat.");
    }

    resetForm();
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-xl space-y-4">
      <h2 className="text-xl font-bold mb-2">
        {selectedId ? "Dodaj količinu postojećem artiklu" : "Dodaj novi artikal"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Izbor postojećeg artikla ili novi */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Odaberi postojeći artikal ili unesi novi
          </label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full border px-3 py-2 rounded-lg text-sm"
          >
            <option value="">— Novi artikal —</option>
            {articles.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name} (Dom: {a.quantity.toFixed(2)} | Porodica:{" "}
                {a.familyQuantity?.toFixed(2) ?? 0})
              </option>
            ))}
          </select>
        </div>

        {!selectedId && (
          <>
            <Input
              type="text"
              placeholder="Naziv artikla"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              type="number"
              placeholder="Cena po komadu (RSD)"
              value={price}
              onChange={(e) =>
                setPrice(e.target.value === "" ? "" : Number(e.target.value))
              }
              required
            />
          </>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            type="number"
            placeholder="Broj pakovanja"
            value={packages}
            onChange={(e) =>
              setPackages(e.target.value === "" ? "" : Number(e.target.value))
            }
          />
          <Input
            type="number"
            placeholder="Komada po pakovanju"
            value={unitsPerPackage}
            onChange={(e) =>
              setUnitsPerPackage(e.target.value === "" ? "" : Number(e.target.value))
            }
          />
        </div>

        <Input
          type="number"
          placeholder="Dodatni komadi"
          value={looseQuantity}
          onChange={(e) =>
            setLooseQuantity(e.target.value === "" ? "" : Number(e.target.value))
          }
        />

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={fromFamily}
            onChange={() => setFromFamily((prev) => !prev)}
          />
          <span>Porodica donela artikal</span>
        </label>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Sačuvaj
        </button>
      </form>

      {message && (
        <p className="mt-3 text-center text-sm text-gray-700">{message}</p>
      )}
    </div>
  );
}
