import { FormEvent, useId, useState } from "react";
import { LuCheck, LuEye, LuEyeOff } from "react-icons/lu";
import Field from "@shared/ui/form/Field";
import { Input } from "@shared/ui/form/controls";
import Button from "@shared/ui/button/Button";
import { PASSWORD_MIN } from "@features/auth/model";

interface Props {
  submitLabel: string;
  loading?: boolean;
  /** Reči koje lozinka ne sme da sadrži (ime, korisničko ime) */
  personal?: string[];
  onSubmit: (password: string) => void;
}

// Nova lozinka sa pravilima koja se vide dok se kuca (ista pravila proverava server).
export default function NewPasswordForm({ submitLabel, loading, personal = [], onSubmit }: Props) {
  const id = useId();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [touched, setTouched] = useState(false);

  const lower = password.toLowerCase();
  const rules = [
    { ok: password.length >= PASSWORD_MIN, text: `Najmanje ${PASSWORD_MIN} znakova` },
    { ok: password.length > 0 && !personal.filter((p) => p.length >= 3).some((p) => lower.includes(p.toLowerCase())), text: "Ne sadrži vaše ime ni korisničko ime" },
    { ok: password.length > 0 && password === confirm, text: "Obe lozinke su iste" },
  ];
  const valid = rules.every((r) => r.ok);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (valid) onSubmit(password);
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Field label="Nova lozinka" htmlFor={`${id}-p`} hint="Savet: nekoliko reči koje ćete zapamtiti, npr. „plava-šolja-kafe-7”.">
        <div className="relative">
          <Input id={`${id}-p`} type={show ? "text" : "password"} autoComplete="new-password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10" />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Sakrij lozinku" : "Prikaži lozinku"}
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-gray-400 hover:text-gray-700"
          >
            {show ? <LuEyeOff className="h-4 w-4" /> : <LuEye className="h-4 w-4" />}
          </button>
        </div>
      </Field>
      <Field label="Ponovite lozinku" htmlFor={`${id}-c`}>
        <Input id={`${id}-c`} type={show ? "text" : "password"} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </Field>
      <ul className="space-y-1" aria-label="Pravila za lozinku">
        {rules.map((r) => (
          <li key={r.text} className={`flex items-center gap-2 text-xs ${r.ok ? "text-success-600 dark:text-success-400" : touched ? "text-error-600" : "text-gray-500"}`}>
            <LuCheck className={`h-3.5 w-3.5 ${r.ok ? "" : "opacity-30"}`} aria-hidden="true" />
            {r.text}
          </li>
        ))}
      </ul>
      <Button type="submit" className="w-full" loading={loading}>
        {submitLabel}
      </Button>
    </form>
  );
}
