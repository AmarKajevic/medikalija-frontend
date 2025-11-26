import { useState } from "react";
import {Link } from "react-router";
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
  const [role, setRole] = useState("nurse");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { user } = useAuth();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token"); // uzmi admin token

      const response = await axios.post(
        "http://localhost:5000/api/auth/register",
        { name,lastName, email, password, role },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setSuccess("Korisnik uspešno registrovan!");
        setError(null);

        // Očisti formu
        setName("");
        setEmail("");
        setPassword("");
        setRole("nurse");

        // Ako želiš odmah redirekciju:
        // navigate("/users");
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

  // Ako user nije admin, ne može da vidi formu
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
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          ⬅ Back to dashboard
        </Link>
      </div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div className="mb-5 sm:mb-8">
          <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
            Register User
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Admin može dodati nove sestre i glavne sestre.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label>
              Ime <span className="text-error-500">*</span>
            </Label>
            <Input
              type="text"
              placeholder="Unesite ime"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>
              Ime <span className="text-error-500">*</span>
            </Label>
            <Input
              type="text"
              placeholder="Unesite Prezime"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          <div>
            <Label>
              Email <span className="text-error-500">*</span>
            </Label>
            <Input
              type="email"
              placeholder="info@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <Label>
              Lozinka <span className="text-error-500">*</span>
            </Label>
            <Input
              type="password"
              placeholder="Unesite lozinku"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <Label>
              Uloga <span className="text-error-500">*</span>
            </Label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:text-white"
            >
              <option value="nurse">Sestra</option>
              <option value="main-nurse">Glavna sestra</option>
            </select>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-500 text-sm">{success}</p>}

          <div>
            <Button className="w-full" size="sm" >
              Register
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
