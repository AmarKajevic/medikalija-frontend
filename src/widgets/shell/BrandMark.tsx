// Znak i ime aplikacije (zamenjuje TailAdmin logo).
export function BrandIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-brand-600" />
      <path d="M13 8h6v5h5v6h-5v5h-6v-5H8v-6h5z" fill="#fff" />
    </svg>
  );
}

export default function BrandMark({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <BrandIcon />
      {!collapsed && (
        <span className="leading-tight">
          <span className="block text-[15px] font-semibold tracking-tight text-gray-900 dark:text-white">Medikalija</span>
          <span className="block text-[11px] text-gray-500 dark:text-gray-400">Dom za stara lica</span>
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
