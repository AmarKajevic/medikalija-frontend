import { useEffect, useRef, useState } from "react";
import { useSearch } from "@features/search/hooks/useSearch";
import SearchDropdown from "@features/search/ui/SearchDropdown";

const SearchInput = () => {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(t);
  }, [query]);

  const { data = [], isLoading } = useSearch(debouncedQuery);


  useEffect(() => {
    if (debouncedQuery) setOpen(true);
    else setOpen(false);
  }, [debouncedQuery]);


  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full ">
      <input
        type="text"
        placeholder="pretrazi pacijente, artikle i lekove..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query && setOpen(true)}
        className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
      />

      {open && (
        <SearchDropdown results={data} isLoading={isLoading} onSelect={() => setOpen(false)}/>
      )}
    </div>
  );
};

export default SearchInput;