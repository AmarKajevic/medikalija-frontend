import { ReactNode } from "react";

type StatCardColor = "brand" | "success" | "warning" | "error";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  color?: StatCardColor;
}

const colorStyles: Record<StatCardColor, string> = {
  brand: "bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400",
  success:
    "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500",
  warning:
    "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-500",
  error: "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500",
};

export default function StatCard({ label, value, icon, color = "brand" }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${colorStyles[color]}`}>
        {icon}
      </div>
      <div className="mt-4">
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        <h4 className="mt-1 text-title-sm font-bold text-gray-800 dark:text-white/90">
          {value}
        </h4>
      </div>
    </div>
  );
}
