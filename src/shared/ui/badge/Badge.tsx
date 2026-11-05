import { ReactNode } from "react";

export type BadgeColor = "primary" | "success" | "error" | "warning" | "info" | "light" | "dark";

interface BadgeProps {
  color?: BadgeColor;
  size?: "sm" | "md";
  /** Mala tačka ispred teksta (status) */
  dot?: boolean;
  startIcon?: ReactNode;
  children: ReactNode;
  className?: string;
}

const tones: Record<BadgeColor, { badge: string; dot: string }> = {
  primary: { badge: "bg-brand-50 text-brand-700 ring-brand-600/15 dark:bg-brand-500/15 dark:text-brand-300 dark:ring-brand-400/20", dot: "bg-brand-500" },
  success: { badge: "bg-success-50 text-success-700 ring-success-600/15 dark:bg-success-500/15 dark:text-success-400 dark:ring-success-400/20", dot: "bg-success-500" },
  error: { badge: "bg-error-50 text-error-700 ring-error-600/15 dark:bg-error-500/15 dark:text-error-400 dark:ring-error-400/20", dot: "bg-error-500" },
  warning: { badge: "bg-warning-50 text-warning-700 ring-warning-600/20 dark:bg-warning-500/15 dark:text-warning-400 dark:ring-warning-400/20", dot: "bg-warning-500" },
  info: { badge: "bg-blue-light-50 text-blue-light-700 ring-blue-light-600/15 dark:bg-blue-light-500/15 dark:text-blue-light-400 dark:ring-blue-light-400/20", dot: "bg-blue-light-500" },
  light: { badge: "bg-gray-100 text-gray-700 ring-gray-500/15 dark:bg-white/[0.06] dark:text-gray-300 dark:ring-white/10", dot: "bg-gray-400" },
  dark: { badge: "bg-gray-900 text-white ring-gray-900 dark:bg-white dark:text-gray-900 dark:ring-white", dot: "bg-white dark:bg-gray-900" },
};

export default function Badge({ color = "light", size = "md", dot = false, startIcon, children, className = "" }: BadgeProps) {
  const tone = tones[color];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md font-medium ring-1 ring-inset ${
        size === "sm" ? "px-1.5 py-0.5 text-xs" : "px-2 py-0.5 text-xs sm:text-sm"
      } ${tone.badge} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />}
      {startIcon}
      {children}
    </span>
  );
}
