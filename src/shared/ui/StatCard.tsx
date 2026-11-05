import { ReactNode } from "react";
import { Link } from "react-router";
import { LuArrowUpRight } from "react-icons/lu";
import { Skeleton } from "@shared/ui/feedback/Spinner";

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  hint?: ReactNode;
  to?: string;
  loading?: boolean;
  /** Naglašava vrednost kad traži pažnju (npr. niske zalihe) */
  tone?: "default" | "warning" | "danger";
}

const toneClass = {
  default: "text-gray-900 dark:text-white",
  warning: "text-warning-600 dark:text-warning-400",
  danger: "text-error-600 dark:text-error-400",
};

export default function StatCard({ label, value, icon, hint, to, loading, tone = "default" }: StatCardProps) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
        {icon && <span className="text-lg text-gray-400 dark:text-gray-500">{icon}</span>}
      </div>
      <div className={`mt-3 text-3xl font-semibold tracking-tight tabular-nums ${toneClass[tone]}`}>
        {loading ? <Skeleton className="h-9 w-20" /> : value}
      </div>
      {hint && (
        <p className="mt-1 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
          {hint}
          {to && <LuArrowUpRight className="h-3.5 w-3.5" />}
        </p>
      )}
    </>
  );

  const className =
    "block rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs transition dark:border-gray-800 dark:bg-gray-900";

  return to ? (
    <Link to={to} className={`${className} hover:border-gray-300 hover:shadow-theme-sm dark:hover:border-gray-700`}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
