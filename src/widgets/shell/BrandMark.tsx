import { useFacility } from "@entities/facility/facility";

// Znak aplikacije kad ustanova nema svoj logo.
export function BrandIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-brand-600" />
      <path d="M13 8h6v5h5v6h-5v5h-6v-5H8v-6h5z" fill="#fff" />
    </svg>
  );
}

// Logo i naziv ustanove iz Podešavanja (dok se ne učitaju — podrazumevani).
export default function BrandMark({ collapsed = false }: { collapsed?: boolean }) {
  const { facility } = useFacility();
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      {facility.logo ? (
        <img src={facility.logo} alt="" className="h-8 w-8 shrink-0 rounded-lg object-contain" />
      ) : (
        <BrandIcon className="h-8 w-8 shrink-0" />
      )}
      {!collapsed && (
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-[15px] font-semibold tracking-tight text-gray-900 dark:text-white">{facility.name}</span>
          {facility.subtitle && <span className="block truncate text-[11px] text-gray-500 dark:text-gray-400">{facility.subtitle}</span>}
        </span>
      )}
    </span>
  );
}

export function SplashScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="flex flex-col items-center gap-4">
        <BrandIcon className="h-12 w-12 animate-pulse" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Učitavanje...</p>
      </div>
    </div>
  );
}
