import { ReactNode } from "react";

export interface TabItem<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
  count?: number;
  /** Dodatak posle naziva (npr. datumi perioda kao oznaka) */
  suffix?: ReactNode;
}

interface TabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  /** "underline" za navigaciju kroz sekcije, "pills" za kompaktan izbor (segmentirana kontrola). */
  variant?: "underline" | "pills";
  className?: string;
}

export default function Tabs<T extends string>({ items, value, onChange, variant = "underline", className = "" }: TabsProps<T>) {
  if (variant === "pills") {
    return (
      <div role="tablist" className={`grid gap-1 rounded-xl bg-gray-100 p-1 dark:bg-white/[0.04] ${className}`} style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const active = item.value === value;
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(item.value)}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium transition ${
                active
                  ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white"
                  : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              {item.icon}
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div role="tablist" className={`flex gap-6 overflow-x-auto border-b border-gray-200 dark:border-gray-800 ${className}`}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 pb-3 pt-1 text-sm font-medium transition ${
              active
                ? "border-brand-500 text-brand-600 dark:text-brand-400"
                : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            {item.icon}
            {item.label}
            {item.suffix}
            {item.count !== undefined && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  active
                    ? "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
                    : "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400"
                }`}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
