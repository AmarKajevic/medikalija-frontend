import { KeyboardEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { LuArrowDown, LuArrowUp, LuChevronLeft, LuChevronRight, LuChevronsUpDown, LuSearch } from "react-icons/lu";
import { Input } from "@shared/ui/form/controls";
import EmptyState from "@shared/ui/feedback/EmptyState";
import { Skeleton } from "@shared/ui/feedback/Spinner";
import { normalizeSearch } from "@shared/lib/search";

export interface Column<T> {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  /** Vrednost za sortiranje; kolona bez nje se ne sortira */
  sortValue?: (row: T) => string | number | null | undefined;
  align?: "left" | "right" | "center";
  /** Sakriva kolonu ispod datog breakpointa */
  hideBelow?: "sm" | "md" | "lg";
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[] | undefined;
  getRowId: (row: T) => string;
  loading?: boolean;
  /** Tekst po kom se pretražuje red; uključuje polje za pretragu */
  searchText?: (row: T) => string;
  searchPlaceholder?: string;
  /** Dodatne kontrole u traci iznad tabele (filteri, dugmad) */
  toolbar?: ReactNode;
  onRowClick?: (row: T) => void;
  empty?: { title: string; description?: ReactNode; action?: ReactNode; icon?: ReactNode };
  pageSize?: number;
  initialSort?: { id: string; dir: "asc" | "desc" };
}

const hideClass = { sm: "hidden sm:table-cell", md: "hidden md:table-cell", lg: "hidden lg:table-cell" };
const alignClass = { left: "text-left", right: "text-right", center: "text-center" };

const compare = (a: unknown, b: unknown) => {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "sr", { numeric: true, sensitivity: "base" });
};

export default function DataTable<T>({
  columns,
  data,
  getRowId,
  loading = false,
  searchText,
  searchPlaceholder = "Pretraga...",
  toolbar,
  onRowClick,
  empty = { title: "Nema podataka" },
  pageSize = 20,
  initialSort,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState(initialSort ?? null);
  const [page, setPage] = useState(0);

  const rows = useMemo(() => {
    let list = data ?? [];
    const q = normalizeSearch(query.trim());
    if (q && searchText) list = list.filter((r) => normalizeSearch(searchText(r)).includes(q));
    const col = sort && columns.find((c) => c.id === sort.id);
    if (col?.sortValue) {
      const dir = sort!.dir === "asc" ? 1 : -1;
      list = [...list].sort((a, b) => compare(col.sortValue!(a), col.sortValue!(b)) * dir);
    }
    return list;
  }, [data, query, searchText, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  useEffect(() => setPage(0), [query, sort]);
  useEffect(() => {
    if (page > pageCount - 1) setPage(pageCount - 1);
  }, [page, pageCount]);
  const visible = rows.slice(page * pageSize, page * pageSize + pageSize);

  const toggleSort = (id: string) =>
    setSort((s) => (s?.id === id ? (s.dir === "asc" ? { id, dir: "desc" } : null) : { id, dir: "asc" }));

  const onRowKey = (e: KeyboardEvent, row: T) => {
    if (onRowClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onRowClick(row);
    }
  };

  const hasToolbar = !!searchText || !!toolbar;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
      {hasToolbar && (
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          {searchText && (
            <div className="w-full sm:w-72">
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                leading={<LuSearch className="h-4 w-4" />}
                aria-label={searchPlaceholder}
              />
            </div>
          )}
          {toolbar && <div className="flex flex-1 flex-wrap items-center justify-end gap-2">{toolbar}</div>}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60 dark:border-gray-800 dark:bg-white/[0.02]">
              {columns.map((c) => {
                const sorted = sort?.id === c.id ? sort.dir : null;
                return (
                  <th
                    key={c.id}
                    scope="col"
                    aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined}
                    className={`whitespace-nowrap px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400 ${
                      alignClass[c.align ?? "left"]
                    } ${c.hideBelow ? hideClass[c.hideBelow] : ""}`}
                  >
                    {c.sortValue ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(c.id)}
                        className={`inline-flex items-center gap-1 transition hover:text-gray-900 dark:hover:text-white ${
                          sorted ? "text-gray-900 dark:text-white" : ""
                        }`}
                      >
                        {c.header}
                        {sorted === "asc" ? (
                          <LuArrowUp className="h-3.5 w-3.5" />
                        ) : sorted === "desc" ? (
                          <LuArrowDown className="h-3.5 w-3.5" />
                        ) : (
                          <LuChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
                        )}
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading
              ? Array.from({ length: 6 }, (_, i) => (
                  <tr key={i}>
                    {columns.map((c) => (
                      <td key={c.id} className={`px-4 py-3.5 ${c.hideBelow ? hideClass[c.hideBelow] : ""}`}>
                        <Skeleton className="h-4 w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              : visible.map((row) => (
                  <tr
                    key={getRowId(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    onKeyDown={(e) => onRowKey(e, row)}
                    tabIndex={onRowClick ? 0 : undefined}
                    className={`text-gray-700 transition dark:text-gray-300 ${
                      onRowClick
                        ? "cursor-pointer hover:bg-gray-50 focus:bg-gray-50 focus:outline-hidden dark:hover:bg-white/[0.03] dark:focus:bg-white/[0.03]"
                        : ""
                    }`}
                  >
                    {columns.map((c) => (
                      <td
                        key={c.id}
                        className={`px-4 py-3 ${alignClass[c.align ?? "left"]} ${c.hideBelow ? hideClass[c.hideBelow] : ""} ${
                          c.className ?? ""
                        }`}
                      >
                        {c.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {!loading && rows.length === 0 && (
        <EmptyState
          compact
          icon={empty.icon}
          title={query ? "Nema rezultata" : empty.title}
          description={query ? `Ništa ne odgovara pretrazi „${query}“.` : empty.description}
          action={query ? undefined : empty.action}
        />
      )}

      {!loading && rows.length > pageSize && (
        <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-4 py-2.5 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
          <span className="tabular-nums">
            {page * pageSize + 1}–{Math.min(rows.length, (page + 1) * pageSize)} od {rows.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              aria-label="Prethodna strana"
              className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-white/5"
            >
              <LuChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-1 tabular-nums">
              {page + 1} / {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={page >= pageCount - 1}
              aria-label="Sledeća strana"
              className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-white/5"
            >
              <LuChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
