// Boje događaja u kalendaru. Stari zapisi koriste engleske ključeve (Danger, ...),
// noviji srpske (crvena, ...) — oba se mapiraju na istu paletu.
export const EVENT_COLORS = [
  { value: "zelena", label: "Opšte", className: "bg-brand-500", hex: "#38833f" },
  { value: "plava", label: "Pregled / termin", className: "bg-blue-light-500", hex: "#0ba5ec" },
  { value: "narandzasta", label: "Podsetnik", className: "bg-warning-500", hex: "#f79009" },
  { value: "crvena", label: "Hitno", className: "bg-error-500", hex: "#f04438" },
] as const;

const LEGACY: Record<string, string> = { Success: "zelena", Primary: "plava", Warning: "narandzasta", Danger: "crvena" };

const find = (key?: string) => EVENT_COLORS.find((c) => c.value === (LEGACY[key ?? ""] ?? key));

export const eventColorClass = (key?: string) => find(key)?.className ?? "bg-gray-400";
export const eventColorHex = (key?: string) => find(key)?.hex ?? "#a1a1aa";
export const normalizeEventColor = (key?: string) => find(key)?.value ?? "zelena";
