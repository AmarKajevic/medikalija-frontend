import { FormEvent, useEffect, useId, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { LuCircleAlert, LuEye, LuEyeOff } from "react-icons/lu";
import { api } from "@shared/api/api";
import { useAuth } from "@app/providers/AuthContext";
import { paths } from "@app/paths";
import Field from "@shared/ui/form/Field";
import { Checkbox, Input } from "@shared/ui/form/controls";
import Button from "@shared/ui/button/Button";
import { serverMessage, useAuthConfig } from "@features/auth/model";
import GoogleSignInButton from "./GoogleSignInButton";

const REMEMBER_KEY = "rememberMe";

// Prijava e-mailom ili korisničkim imenom (iz pozivnice) i lozinkom, ili Google-om.
export default function SignInForm() {
  const id = useId();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { data: config } = useAuthConfig();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Pamti se samo e-mail / korisničko ime (nikad lozinka)
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(REMEMBER_KEY) ?? "null");
      if (saved?.identifier) {
        setIdentifier(saved.identifier);
        setRemember(true);
      }
    } catch {
      localStorage.removeItem(REMEMBER_KEY);
    }
  }, []);

  const finish = (data: { user: Parameters<typeof login>[0]; accessToken: string }) => {
    login(data.user, data.accessToken);
    const from = (location.state as { from?: string } | null)?.from;
    navigate(from && from !== paths.signIn ? from : paths.home, { replace: true });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/login", { identifier: identifier.trim(), password });
      if (!data.success) throw new Error();
      if (remember) localStorage.setItem(REMEMBER_KEY, JSON.stringify({ identifier: identifier.trim() }));
      else localStorage.removeItem(REMEMBER_KEY);
      finish(data);
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status;
      setError(
        status === 401 || status === 400
          ? serverMessage(err, "Pogrešni podaci za prijavu.")
          : status === 403 || status === 429
            ? serverMessage(err, "Pristup nije dozvoljen.")
            : "Prijava trenutno nije moguća. Pokušajte ponovo."
      );
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async (credential: string) => {
    setError(null);
    try {
      const { data } = await api.post("/api/auth/google", { credential });
      finish(data);
    } catch (err) {
      setError(serverMessage(err, "Google prijava nije uspela."));
    }
  };

  return (
    <div className="space-y-5">
      {error && (
        <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-error-200 bg-error-50 px-3 py-2.5 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          <LuCircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {config?.googleClientId && (
        <>
          <GoogleSignInButton clientId={config.googleClientId} onCredential={onGoogle} />
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" /> ili <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
          </div>
        </>
      )}

      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <Field label="E-mail ili korisničko ime" htmlFor={`${id}-i`}>
          <Input
            id={`${id}-i`}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            autoFocus={!identifier}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="npr. ana@dom.rs ili sanja.p"
            required
          />
        </Field>
        <Field label="Lozinka" htmlFor={`${id}-p`}>
          <div className="relative">
            <Input
              id={`${id}-p`}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              autoFocus={!!identifier}
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
        <Button type="submit" className="w-full" loading={loading} disabled={!identifier.trim() || !password}>
          Prijavi se
        </Button>
      </form>
    </div>
  );
}
