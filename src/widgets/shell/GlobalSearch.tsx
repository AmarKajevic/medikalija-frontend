import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { LuPackage, LuPill, LuSearch, LuUser } from "react-icons/lu";
import { useSearch } from "@features/search/hooks/useSearch";
import { useAuth } from "@app/providers/AuthContext";
import { isManager, paths } from "@app/paths";
import Spinner from "@shared/ui/feedback/Spinner";

type Result = { _id: string; name: string; type: "patient" | "medicine" | "article"; quantity?: number };

const GROUPS = [
  { type: "patient", label: "Pacijenti", icon: <LuUser />, to: paths.patient },
  { type: "medicine", label: "Lekovi", icon: <LuPill />, to: paths.medicine },
  { type: "article", label: "Artikli", icon: <LuPackage />, to: paths.article },
] as const;

// Globalna pretraga u gornjoj traci. Ctrl+K / ⌘K je fokusira.
export default function GlobalSearch() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const { data = [], isFetching } = useSearch(debounced);

  // Sestre nemaju pristup stranicama lekova — ne nudimo im rezultate koje ne mogu da otvore
  const results = useMemo(
    () => (data as Result[]).filter((r) => r.type !== "medicine" || isManager(user?.role)),
    [data, user?.role]
  );
  const ordered = GROUPS.flatMap((g) => results.filter((r) => r.type === g.type));

  useEffect(() => setHighlight(0), [debounced]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, []);

  const go = (r: Result) => {
    const group = GROUPS.find((g) => g.type === r.type);
    if (!group) return;
    navigate(group.to(r._id));
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, ordered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && ordered[highlight]) {
      e.preventDefault();
      go(ordered[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const showPanel = open && debounced.length > 0;
  let index = -1;

  return (
    <div ref={rootRef} className="relative w-full max-w-md">
      <LuSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Pretraži pacijente, lekove, artikle..."
        aria-label="Pretraga"
        className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-14 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-brand-300 focus:bg-white focus:outline-hidden focus:ring-3 focus:ring-brand-500/15 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white dark:focus:bg-gray-900"
      />
      <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-gray-200 bg-white px-1.5 py-0.5 font-sans text-[10px] font-medium text-gray-400 sm:block dark:border-gray-700 dark:bg-gray-800">
        Ctrl K
      </kbd>

      {showPanel && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900">
          {isFetching && ordered.length === 0 ? (
            <div className="flex items-center gap-2 px-3 py-4 text-sm text-gray-500">
              <Spinner size="sm" /> Pretraga...
            </div>
          ) : ordered.length === 0 ? (
            <p className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">Nema rezultata za „{debounced}“.</p>
          ) : (
            GROUPS.map((g) => {
              const items = results.filter((r) => r.type === g.type);
              if (items.length === 0) return null;
              return (
                <div key={g.type} className="py-1">
                  <p className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">{g.label}</p>
                  {items.map((r) => {
                    index += 1;
                    const i = index;
                    return (
                      <button
                        key={r._id}
                        type="button"
                        onMouseEnter={() => setHighlight(i)}
                        onClick={() => go(r)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ${
                          i === highlight ? "bg-gray-100 dark:bg-white/5" : ""
                        }`}
                      >
                        <span className="text-gray-400">{g.icon}</span>
                        <span className="flex-1 truncate text-gray-800 dark:text-gray-200">{r.name}</span>
                        {r.type !== "patient" && r.quantity !== undefined && (
                          <span className="text-xs tabular-nums text-gray-400">{r.quantity} kom.</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
