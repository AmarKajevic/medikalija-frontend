import { useState } from "react";
import useAddPatient from "../../hooks/Patient/useAddPatient";
import DatePicker from "../form/date-picker";

export default function AddPatientForm() {
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [admissionDate, setAdmissionDate] = useState<Date | null>(null);
  const [address, setAddress] = useState("");
  const addPatient = useAddPatient();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!dateOfBirth || !admissionDate) {
      alert("Molimo izaberite oba datuma");
      return;
    }

    try {
      addPatient.mutate(
        {
          name,
          lastName,
          dateOfBirth,        // ← šaljemo PRAVI DATE objekat
          admissionDate,      // ← šaljemo PRAVI DATE objekat
          address,
        },
        {
          onSuccess: () => {
            console.log("Pacijent uspešno dodat");

            setName("");
            setLastName("");
            setDateOfBirth(null);
            setAdmissionDate(null);
            setAddress("");
          },
          onError: (error: any) => {
            console.error("Greška pri dodavanju pacijenta:", error.response?.data || error);
            alert(error?.response?.data?.message || "Greška pri dodavanju pacijenta");
          },
        }
      );
    } catch (err) {
      console.error("Neočekivana greška:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 space-y-2">
      <input
        type="text"
        placeholder="Ime"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border p-2 w-full"
      />

      <input
        type="text"
        placeholder="Prezime"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        className="border p-2 w-full"
      />

      <DatePicker
        id="dateOfBirth"
        label="Datum rođenja"
        placeholder="DD-MM-YYYY"
        defaultDate={dateOfBirth || undefined}
        onChange={([selectedDate]) => setDateOfBirth(selectedDate as Date)}
      />

      <DatePicker
        id="admissionDate"
        label="Datum prijema"
        placeholder="DD-MM-YYYY"
        defaultDate={admissionDate || undefined}
        onChange={([selectedDate]) => setAdmissionDate(selectedDate as Date)}
      />

      <input
        type="text"
        placeholder="Adresa"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        className="border p-2 w-full"
      />

      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
        Dodaj pacijenta
      </button>
    </form>
  );
}
