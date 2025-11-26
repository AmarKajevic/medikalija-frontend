import axios from "axios";
import React, { useState } from "react";

interface DiagnosisProps {
  patientId: string;
  name: string // iz parent komponente
}

export default function AddDiagnosis({ patientId }: DiagnosisProps) {
    console.log("Prop patientId:", patientId);
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("PatientId:", patientId);
    console.log({ patientId, description }); // 👈 vidi da li ima vrednosti

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "https://medikalija-api.vercel.app/api/diagnosis/addDiagnosis",
        { patient: patientId, description }, // 👈 ključ mora biti "patientId"
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setMessage("Dijagnoza uspešno dodata");
        setDescription("");
      }
    } catch (error: any) {
      console.error(error);
      setMessage("Greška pri dodavanju dijagnoze");
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow-md">
      <h3 className="font-bold mb-2">Dodaj dijagnozu</h3>
      <form onSubmit={handleSubmit}>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Unesite dijagnozu..."
          className="w-full border p-2 rounded-md"
          required
        />
        <button
          type="submit"
          className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-md"
        >
          Dodaj
        </button>
      </form>
      {message && <p className="mt-2">{message}</p>}
    </div>
  );
}
