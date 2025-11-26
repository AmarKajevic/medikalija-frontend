import React, { useState } from "react";
import axios from "axios";
import Input from "../../components/form/input/InputField";
import { useAuth } from "../../context/AuthContext";


export default function AddDiagnosisTemplate() {
  const { token, user } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/diagnosisTemplate/add",
        { name, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );

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
    return <p className="text-red-500">Nemate ovlašćenje za pristup ovoj stranici</p>;
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-2xl ">
      <h2 className="text-xl font-bold mb-4 ">Dodaj novu dijagnozu</h2>
      <form onSubmit={handleSubmit} className="space-y-4 ">
        <Input
          type="text"
          name="name"
          placeholder="Naziv dijagnoze"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border rounded-lg"
          required
        />

        <textarea
          name="description"
          placeholder="Opis (opciono)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border rounded-lg"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading ? "Dodavanje..." : "Dodaj dijagnozu"}
        </button>
      </form>
      {message && <p className="mt-4 text-center">{message}</p>}
    </div>
  );
}
