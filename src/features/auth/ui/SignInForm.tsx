import { FormEvent, useEffect, useId, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { LuCircleAlert, LuEye, LuEyeOff } from "react-icons/lu";
import { api } from "@shared/api/api";
import { useAuth } from "@app/providers/AuthContext";
import { paths } from "@app/paths";
import Field from "@shared/ui/form/Field";
import { Checkbox, Input } from "@shared/ui/form/controls";
import Button from "@shared/ui/button/Button";

const REMEMBER_KEY = "rememberMe";

export default function SignInForm() {
  const id = useId();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Pamti se samo ime i prezime (nikad lozinka)
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(REMEMBER_KEY) ?? "null");
      if (saved) {
        setName(saved.name ?? "");
        setLastName(saved.lastName ?? "");
        setRemember(true);
      }
    } catch {
      localStorage.removeItem(REMEMBER_KEY);
    }
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/login", { name: name.trim(), lastName: lastName.trim(), password });
      if (!data.success) throw new Error();
      if (remember) localStorage.setItem(REMEMBER_KEY, JSON.stringify({ name: name.trim(), lastName: lastName.trim() }));
      else localStorage.removeItem(REMEMBER_KEY);
      login(data.user, data.accessToken);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from !== paths.signIn ? from : paths.home, { replace: true });
    } catch (err) {
      const res = (err as { response?: { status?: number; data?: { error?: string; message?: string } } }).response;
      setError(
        res?.status === 403
          ? "Vaša uloga nema pristup aplikaciji."
          : res?.status === 400 || res?.status === 404
            ? "Pogrešno ime, prezime ili lozinka."
            : res?.data?.error || res?.data?.message || "Prijava trenutno nije moguća. Pokušajte ponovo."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {error && (
        <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-error-200 bg-error-50 px-3 py-2.5 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          <LuCircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ime" htmlFor={`${id}-n`}>
          <Input id={`${id}-n`} autoComplete="given-name" autoFocus={!name} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ime" required />
        </Field>
        <Field label="Prezime" htmlFor={`${id}-l`}>
          <Input id={`${id}-l`} autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Prezime" required />
        </Field>
      </div>
      <Field label="Lozinka" htmlFor={`${id}-p`}>
        <div className="relative">
          <Input
            id={`${id}-p`}
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            autoFocus={!!name}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Unesite lozinku"
            className="pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Sakrij lozinku" : "Prikaži lozinku"}
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            {showPassword ? <LuEyeOff className="h-4 w-4" /> : <LuEye className="h-4 w-4" />}
          </button>
        </div>
      </Field>
      <Checkbox id={`${id}-r`} label="Zapamti me na ovom uređaju" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
      <Button type="submit" className="w-full" loading={loading} disabled={!name || !lastName || !password}>
        Prijavi se
      </Button>
    </form>
  );
}
