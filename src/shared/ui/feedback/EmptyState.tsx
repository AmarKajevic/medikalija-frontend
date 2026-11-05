import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}

export default function EmptyState({ icon, title, description, action, compact = false }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? "py-8" : "py-14"}`}>
      {icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-500 dark:bg-white/[0.06] dark:text-gray-400">
          {icon}
        </div>
      )}
      <p className="text-sm font-medium text-gray-800 dark:text-white/90">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message = "Podaci nisu učitani.", onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
      {message}
      {onRetry && (
        <button type="button" onClick={onRetry} className="ml-2 font-medium underline">
          Pokušaj ponovo
        </button>
      )}
    </div>
  );
}
