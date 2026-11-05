import { ReactNode } from "react";
import { Link } from "react-router";
import { LuChevronRight } from "react-icons/lu";

export interface Crumb {
  label: string;
  to?: string;
}

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: Crumb[];
  /** Sadržaj ispod naslova u istoj traci (npr. bedževi) */
  meta?: ReactNode;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Putanja" className="flex flex-wrap items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
      {items.map((c, i) => (
        <span key={`${c.label}-${i}`} className="flex items-center gap-1">
          {i > 0 && <LuChevronRight className="h-3.5 w-3.5 text-gray-400" />}
          {c.to ? (
            <Link to={c.to} className="transition hover:text-gray-900 dark:hover:text-white">
              {c.label}
            </Link>
          ) : (
            <span aria-current="page" className="text-gray-700 dark:text-gray-300">
              {c.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

export default function PageHeader({ title, description, actions, breadcrumbs, meta }: PageHeaderProps) {
  return (
    <div className="mb-6 space-y-3">
      {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">{title}</h1>
            {meta}
          </div>
          {description && <p className="mt-1 max-w-3xl text-sm text-gray-500 dark:text-gray-400">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
