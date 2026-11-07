import { FormEvent, useId, useState } from "react";
import { Link } from "react-router";
import { LuMailCheck } from "react-icons/lu";
import { api } from "@shared/api/api";
import { paths } from "@app/paths";
import Field from "@shared/ui/form/Field";
import { Input } from "@shared/ui/form/controls";
import Button from "@shared/ui/button/Button";
import { serverMessage, useAuthConfig } from "@features/auth/model";
import AuthShell from "./AuthShell";

// Zaboravljena lozinka: link mejlom (ako je mejl podešen), inače uputstvo da link pošalje uprava.
export default function ForgotPasswordPage() {
  const id = useId();
  const { data: config } = useAuthConfig();
  const [identifier, setIdentifier] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/api/auth/forgot", { identifier: identifier.trim() });
      setSent(data.message);
    } catch (err) {
      setError(serverMessage(err, "Zahtev nije poslat. Pokušajte ponovo."));
    } finally {
      setLoading(false);
    }
  };

  const back = (
    <Link to={paths.signIn} className="font-medium text-brand-600 hover:underline dark:text-brand-400">
      Nazad na prijavu
    </Link>
  );

  if (config && !config.emailEnabled) {
    return (
      <AuthShell title="Zaboravljena lozinka" footer={back}>
        <div className="rounded-xl border border-gray-200 p-5 text-sm leading-relaxed text-gray-600 dark:border-gray-800 dark:text-gray-300">
          Obratite se upravi doma. U <strong>Tim → Korisnici</strong> uprava jednim klikom pravi link za novu lozinku i šalje vam ga (poruka, Viber ili lično). Link važi 24 sata.
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Zaboravljena lozinka" description="Poslaćemo vam link za postavljanje nove lozinke." footer={back}>
      {sent ? (
        <div role="status" className="flex flex-col items-center gap-3 rounded-xl border border-gray-200 p-6 text-center dark:border-gray-800">
          <LuMailCheck className="h-8 w-8 text-brand-600" />
          <p className="text-sm text-gray-700 dark:text-gray-300">{sent}</p>
          <p className="text-xs text-gray-500">Link važi 1 sat. Proverite i folder „Spam”.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          {error && (
            <p role="alert" className="rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700">
              {error}
            </p>
          )}
          <Field label="E-mail ili korisničko ime" htmlFor={id}>
            <Input id={id} autoComplete="username" autoCapitalize="none" autoFocus value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
          </Field>
          <Button type="submit" className="w-full" loading={loading} disabled={!identifier.trim()}>
            Pošalji link
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
