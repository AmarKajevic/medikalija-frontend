import { ReactNode, useId, useState } from "react";
import { LuChevronDown, LuSearch } from "react-icons/lu";
import { Input } from "@shared/ui/form/controls";
import { matchesSearch } from "@shared/lib/search";

interface Props<T> {
  title: string;
  items: T[];
  /** Tekst po kom se pretražuje stavka (po počecima reči, bez obzira na pismo) */
  searchText: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  getKey: (item: T) => string;
  /** Npr. broj izabranih u grupi — prikazuje se u zaglavlju i kad je grupa zatvorena */
  badge?: ReactNode;
  defaultOpen?: boolean;
  searchPlaceholder?: string;
  /** Pretraga se prikazuje tek kad grupa ima više stavki od ovoga */
  searchFrom?: number;
  listClassName?: string;
}

// Grupa koja se otvara/zatvara, sa sopstvenom pretragom — za duge liste podeljene
// po grupama (usluge nege, kombinacije analiza).
export default function SearchGroup<T>({
  title,
  items,
  searchText,
  renderItem,
  getKey,
  badge,
  defaultOpen = false,
  searchPlaceholder = "Pretraži u grupi...",
  searchFrom = 5,
  listClassName = "space-y-2",
}: Props<T>) {
  const panelId = useId();
  const [open, setOpen] = useState(defaultOpen);
  const [query, setQuery] = useState("");
  const q = query.trim();
  const visible = q ? items.filter((i) => matchesSearch(searchText(i), q)) : items;

  return (
    <section className="rounded-xl border border-gray-200 dark:border-gray-800">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-gray-50 dark:hover:bg-white/[0.03]"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-semibold text-gray-800 dark:text-white/90">{title}</span>
          <span className="shrink-0 text-xs text-gray-400">({items.length})</span>
          {badge}
        </span>
        <LuChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div id={panelId} className="space-y-2 border-t border-gray-100 p-3 dark:border-gray-800">
          {items.length > searchFrom && (
            <Input
              leading={<LuSearch className="h-4 w-4" />}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={`Pretraži: ${title}`}
            />
          )}
          {visible.length === 0 ? (
            <p className="py-3 text-center text-sm text-gray-500">Nema rezultata za „{q}”.</p>
          ) : (
            <div className={listClassName}>
              {visible.map((item) => (
                <div key={getKey(item)}>{renderItem(item)}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
