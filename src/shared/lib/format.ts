const rsd = new Intl.NumberFormat("sr-RS", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const qty = new Intl.NumberFormat("sr-RS", { maximumFractionDigits: 2 });

export const formatRSD = (value: number | null | undefined) => `${rsd.format(Number(value) || 0)} RSD`;
export const formatEUR = (value: number | null | undefined) => `${rsd.format(Number(value) || 0)} €`;
export const formatQty = (value: number | null | undefined) => qty.format(Number(value) || 0);

export const initials = (...parts: Array<string | undefined>) =>
  parts
    .filter(Boolean)
    .map((p) => p!.trim()[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);

export const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  "main-nurse": "Glavna sestra",
  nurse: "Sestra",
};

export const roleLabel = (role?: string) => (role ? ROLE_LABELS[role] ?? role : "");
