import { LuHeartHandshake, LuPackage, LuPill } from "react-icons/lu";

// Zajednički prikaz unosa (lista nege i pregled za odobrenje).
export const TYPE_ICON = { medicine: <LuPill />, article: <LuPackage />, care: <LuHeartHandshake /> } as const;

export const formatWhen = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString("sr-Latn-RS", { hour: "2-digit", minute: "2-digit" });
  return sameDay ? `danas ${time}` : `${d.toLocaleDateString("sr-Latn-RS", { day: "2-digit", month: "2-digit", year: "numeric" })} ${time}`;
};
