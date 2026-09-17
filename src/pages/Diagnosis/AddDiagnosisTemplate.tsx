import React, { useState } from "react";
import { api } from "@shared/api/api";
import Input from "@shared/ui/form/input/InputField";
import { useAuth } from "@app/providers/AuthContext";


export default function AddDiagnosisTemplate() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await api.post("/api/diagnosisTemplate/add", { name, description });

      if (response.data.success) {
        setMessage("Dijagnoza uspešno dodata ✅");
        setName("");
        setDescription("");
      } else {
        setMessage("Greška pri dodavanju dijagnoze");
      }
    } catch (error: any) {
      console.error(error);
      setMessage(error.response?.data?.message || "Greška na serveru");
    } finally {
      setLoading(false);
    }
  };

  // Prikaz dozvoljen samo adminu ili glavnoj sestri
  if (!user || (user.role !== "admin" && user.role !== "main-nurse")) {
    return <p className="p-6 text-sm text-error-500">Nemate ovlašćenje za pristup ovoj stranici</p>;
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="mb-5 text-base font-semibold text-gray-800 dark:text-white/90">
          Dodaj novu dijagnozu
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            name="name"
            placeholder="Naziv dijagnoze"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <textarea
            name="description"
            placeholder="Opis (opciono)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand-500 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
          >
            {loading ? "Dodavanje..." : "Dodaj dijagnozu"}
          </button>
        </form>
        {message && <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">{message}</p>}
      </div>
    </div>
  );
}
