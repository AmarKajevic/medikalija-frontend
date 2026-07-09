import { useState } from "react";
import { Link } from "react-router";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";

export default function SignUpForm() {
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { user } = useAuth();

  const ROLES = [
    { value: "nurse", label: "Sestra" },
    { value: "main-nurse", label: "Glavna sestra" },
    { value: "doctor", label: "Doktor" },

    // pasivne uloge
    { value: "Caregiver", label: "Negovatelj" },
    { value: "Physiotherapist", label: "Fizioterapeut" },
    { value: "Cleaner", label: "Čistačica" },
    { value: "Kitchen", label: "Kuhinja" },
    { value: "Social Worker", label: "Socijalni radnik" },
    { value: "Janitor", label: "Domar" },
    { value: "Occupational Therapist", label: "Radni terapeut" },
    { value: "Administration", label: "Administracija" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      const response = await axios.post(
        "https://medikalija-api.vercel.app/api/auth/register",
        { name, lastName, email, password, role },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setSuccess("Korisnik uspešno registrovan!");
        setError(null);

        // Reset forme
        setName("");
        setLastName("");
        setEmail("");
        setPassword("");
        setRole("");
      }
    } catch (err: any) {
      if (err.response) {
        setError(err.response.data.message || "Greška pri registraciji");
      } else {
        setError("Server error");
      }
      setSuccess(null);
    }
  };

  // Ako user nije admin → nema pristup formi
  if (!user || user.role !== "admin") {
    return (
      <div className="text-center text-red-500 font-medium">
        Nemate ovlašćenja za registraciju korisnika.
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          ⬅ Back to dashboard
        </Link>
      </div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div className="mb-5 sm:mb-8">
          <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
            Registracija korisnika
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Admin može dodati sve type osoblja: medicinsko, administrativno i pomoćno.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label>Ime *</Label>
            <Input
              type="text"
              placeholder="Unesite ime"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <Label>Prezime *</Label>
            <Input
              type="text"
              placeholder="Unesite prezime"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          <div>
            <Label>Email *</Label>
            <Input
              type="email"
              placeholder="info@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <Label>Lozinka *</Label>
            <Input
              type="password"
              placeholder="Unesite lozinku"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <Label>Uloga *</Label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:text-white"
            >
              <option value="" disabled>Izaberite ulogu...</option>

              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-500 text-sm">{success}</p>}

          <Button className="w-full" size="sm">
            Register
          </Button>
        </form>
      </div>
    </div>
  );
}
