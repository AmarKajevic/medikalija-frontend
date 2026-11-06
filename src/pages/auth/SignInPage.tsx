import { Navigate } from "react-router";
import { LuClipboardCheck, LuPill, LuShieldCheck } from "react-icons/lu";
import { useAuth } from "@app/providers/AuthContext";
import { paths } from "@app/paths";
import SignInForm from "@features/auth/ui/SignInForm";
import BrandMark, { BrandIcon } from "@widgets/shell/BrandMark";
import { useFacility } from "@entities/facility/facility";
import ScriptSwitch from "@shared/ui/ScriptSwitch";

const FEATURES = [
  { icon: <LuClipboardCheck />, text: "Specifikacije po 30-dnevnim periodima, sa obračunom u RSD i EUR" },
  { icon: <LuPill />, text: "Zalihe doma i porodice, bez dvostruke naplate" },
  { icon: <LuShieldCheck />, text: "Pristup prilagođen ulozi: uprava, sestre, doktori" },
];

export default function SignInPage() {
  const { user } = useAuth();
  const { facility } = useFacility();
  if (user) return <Navigate to={paths.home} replace />;

  return (
    <div className="grid min-h-screen bg-white dark:bg-gray-950 lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <BrandMark />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Prijava</h1>
          <p className="mb-8 mt-1.5 text-sm text-gray-500 dark:text-gray-400">Unesite svoje ime, prezime i lozinku.</p>
          <SignInForm />
          <p className="mt-6 text-center text-xs text-gray-400">Nemate nalog? Obratite se upravi doma.</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-gray-400">© {new Date().getFullYear()} {[facility.name, facility.subtitle].filter(Boolean).join(" · ")}</p>
          <ScriptSwitch className="w-48" />
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-brand-700 lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.14),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(0,0,0,0.25),transparent_50%)]" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <BrandIcon className="h-10 w-10 [&_rect]:fill-white/15" />
          <div>
            <p className="max-w-md text-3xl font-semibold leading-tight tracking-tight">Sve o brizi za stanare, na jednom mestu.</p>
            <ul className="mt-8 space-y-4">
              {FEATURES.map((f) => (
                <li key={f.text} className="flex items-start gap-3 text-brand-50">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-lg">{f.icon}</span>
                  <span className="pt-1 text-sm leading-relaxed">{f.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-brand-100/80">{facility.name}</p>
        </div>
      </div>
    </div>
  );
}
