import { LuArrowLeft, LuLock, LuSearchX } from "react-icons/lu";
import { paths } from "@app/paths";
import { ButtonLink } from "@shared/ui/button/Button";

function StatusLayout({ icon, code, title, description }: { icon: React.ReactNode; code: string; title: string; description: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-2xl text-gray-500 dark:bg-white/[0.06] dark:text-gray-400">{icon}</span>
      <p className="mt-5 text-sm font-semibold text-brand-600 dark:text-brand-400">{code}</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">{title}</h1>
      <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">{description}</p>
      <ButtonLink to={paths.home} variant="outline" size="sm" className="mt-6" startIcon={<LuArrowLeft className="h-4 w-4" />}>
        Na početnu
      </ButtonLink>
    </div>
  );
}

export function NotFoundPage() {
  return <StatusLayout icon={<LuSearchX />} code="404" title="Stranica ne postoji" description="Link je možda zastareo ili pogrešno unet." />;
}

export function ForbiddenPage() {
  return <StatusLayout icon={<LuLock />} code="403" title="Nemate pristup" description="Ova stranica nije dostupna za vašu ulogu. Ako vam je potrebna, obratite se upravi." />;
}
