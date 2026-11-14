import { ReactNode } from "react";

interface SectionHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}

// Zaglavlje sekcije unutar stranice sa više celina (npr. "Šabloni i cene"): isti raspored kao
// PageHeader, ali naslov je h2 — stranica ima jedan h1.
export default function SectionHeader({ title, description, actions }: SectionHeaderProps) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
        {description && <p className="mt-1 max-w-3xl text-sm text-gray-500 dark:text-gray-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
