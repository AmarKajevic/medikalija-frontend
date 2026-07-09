import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

export default function SignInForm() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [isChecked, setIsChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // ------------------------------------------------------
  // 1️⃣ UČITAVANJE SAČUVANIH PODATAKA PRI ULASKU NA STRANU
  // ------------------------------------------------------
  useEffect(() => {
    const saved = localStorage.getItem("rememberMe");
    if (saved) {
      const parsed = JSON.parse(saved);
      setName(parsed.name);
      setLastName(parsed.lastName);
      setPassword(parsed.password);
      setIsChecked(true);
    }
  }, []);

  // ------------------------------------------------------
  // 2️⃣ SUBMIT
  // ------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  try {
    const response = await axios.post(
      "https://medikalija-api.vercel.app/api/auth/login",
      { name, lastName, password },
      { withCredentials: true }
    );

    if (response.data.success) {
      const accessToken = response.data.accessToken;
      const user = response.data.user;

      // sačuvaj podatke ako treba
      if (isChecked) {
        localStorage.setItem(
          "rememberMe",
          JSON.stringify({ name, lastName, password })
        );
      } else {
        localStorage.removeItem("rememberMe");
      }

      login(user, accessToken);

      // ----------------------------
      // ROLE-BASED NAVIGATION
      // ----------------------------

      if (user.role === "admin" || user.role === "main-nurse") {
        navigate("/");
        return;
      }

      // doktor ide kao sestra
      if (user.role === "doctor" || user.role === "nurse") {
        navigate("/nurseDashboard");
        return;
      }

      // fallback zaštita
      navigate("/unauthorized");
    }
  } catch (error: any) {
    console.log(error);
    setError(error.response?.data?.error || "Server error");
  }
};


  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeftIcon className="size-5" />
          Back to dashboard
        </Link>
      </div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm sm:text-title-md">
              Sign In
            </h1>
          </div>

          {/* forma */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <Label>Ime *</Label>
                <Input
                  type="text"
                  placeholder="Ime"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label>Prezime *</Label>
                <Input
                  type="text"
                  placeholder="Prezime"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label>Password *</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeIcon className="size-5 text-gray-500" />
                    ) : (
                      <EyeCloseIcon className="size-5 text-gray-500" />
                    )}
                  </span>
                </div>
              </div>

              {error && <div className="text-sm text-red-500">{error}</div>}

              <div className="flex items-center gap-3">
                <Checkbox checked={isChecked} onChange={setIsChecked} />
                <span className="text-gray-700">Klikni da sacuvas svoje podatke</span>
              </div>

              <Button className="w-full" size="sm" type="submit">
                Uloguj se
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
