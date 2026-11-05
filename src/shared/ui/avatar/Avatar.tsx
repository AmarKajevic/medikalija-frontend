import { initials } from "@shared/lib/format";

const PALETTE = [
  "bg-brand-100 text-brand-800 dark:bg-brand-500/20 dark:text-brand-300",
  "bg-blue-light-100 text-blue-light-800 dark:bg-blue-light-500/20 dark:text-blue-light-300",
  "bg-warning-100 text-warning-800 dark:bg-warning-500/20 dark:text-warning-300",
  "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300",
  "bg-gray-200 text-gray-800 dark:bg-white/10 dark:text-gray-200",
];

const sizes = { xs: "h-6 w-6 text-[10px]", sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-14 w-14 text-lg" };

// Inicijali sa stabilnom bojom po imenu (ista osoba uvek ista boja).
export default function Avatar({ name, lastName, size = "md" }: { name?: string; lastName?: string; size?: keyof typeof sizes }) {
  const key = `${name ?? ""}${lastName ?? ""}`;
  const hash = [...key].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold ${sizes[size]} ${PALETTE[hash % PALETTE.length]}`}
    >
      {initials(name, lastName) || "?"}
    </span>
  );
}
