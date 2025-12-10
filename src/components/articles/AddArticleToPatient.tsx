import { useState } from "react";
import useArticles, { Articles } from "../../hooks/Patient/useArticle";
import ComponentCard from "../common/ComponentCard";
import Input from "../form/input/InputField";

interface AddArticleProps {
  patientId: string;
}

export default function AddArticleToPatient({ patientId }: AddArticleProps) {
  const { getArticles, addArticleToPatient } = useArticles();

  const [selectedArticleId, setSelectedArticleId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");

  // ✅ LIVE SEARCH STATE
  const [search, setSearch] = useState("");
  const [filteredArticles, setFilteredArticles] = useState<Articles[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  if (getArticles.isLoading) return <p>Učitavanje artikala...</p>;
  if (getArticles.isError) return <p>Greška pri učitavanju artikala</p>;

  const articles: Articles[] = getArticles.data || [];
  const selectedArticle = articles.find((a) => a._id === selectedArticleId);

  // ✅ LIVE FILTER (BEZ BACKEND POZIVA – IZ POSTOJEĆE LISTE)
  const handleSearch = (value: string) => {
    setSearch(value);

    if (!value.trim()) {
      setFilteredArticles([]);
      setShowDropdown(false);
      return;
    }

    const filtered = articles.filter((a) =>
      a.name.toLowerCase().includes(value.toLowerCase())
    );

    setFilteredArticles(filtered);
    setShowDropdown(true);
  };

  const handleAdd = () => {
    const numericAmount = parseFloat(amount);

    if (!selectedArticleId) return alert("Izaberite Artikal");
    if (numericAmount <= 0 || isNaN(numericAmount))
      return alert("Količina mora biti veća od nule");

    if (selectedArticle && numericAmount > selectedArticle.quantity)
      return alert(
        `Nema dovoljno artikala na stanju (preostalo: ${selectedArticle.quantity})`
      );

    addArticleToPatient.mutate(
      { patientId, articleId: selectedArticleId, amount: numericAmount },
      {
        onSuccess: () => {
          alert("Artikal uspešno dodat pacijentu!");
          setSelectedArticleId("");
          setAmount("");
          setSearch("");
          setShowDropdown(false);
        },
      }
    );
  };

  return (
    <ComponentCard title="DODAJ ARTIKAL">
      <div className="flex flex-col space-y-2">

        {/* ✅ LIVE SEARCH INPUT */}
        <div className="relative">
          <Input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Pretraži artikal (npr. pelene, rukavice...)"
            className="w-full border p-2 rounded"
          />

          {/* ✅ DROPDOWN */}
          {showDropdown && filteredArticles.length > 0 && (
            <div className="absolute left-0 right-0 bg-white border rounded shadow-lg max-h-60 overflow-y-auto z-50">
              {filteredArticles.map((a) => (
                <div
                  key={a._id}
                  onClick={() => {
                    setSelectedArticleId(a._id);
                    setSearch(a.name);
                    setShowDropdown(false);
                  }}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b"
                >
                  <div className="font-medium">{a.name}</div>
                  <div className="text-xs text-gray-500">
                    💰 Cena: {a.price} RSD · 🏥 Stanje: {a.quantity} · 👪 Porodica: {a.familyQuantity}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ✅ KOLIČINA */}
        <Input
          type="number"
          min={0.01}
          step={0.01}
          placeholder="Unesi količinu"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="border p-2 rounded"
        />

        {/* ✅ DUGME */}
        <button
          onClick={handleAdd}
          disabled={addArticleToPatient.isPending}
          className="bg-blue-500 w-fit self-end text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {addArticleToPatient.isPending ? "Dodavanje..." : "Dodaj pacijentu"}
        </button>
      </div>
    </ComponentCard>
  );
}
