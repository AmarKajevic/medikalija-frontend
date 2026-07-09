import { useEffect, useRef, useState } from "react";
import { useSearch } from "../hooks/useSearch";
import SearchDropdown from "./SearchDropdown";

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
        className="bg-white text-gray-800 border border-gray-300 focus:ring-2 focus:ring-blue-500 w-full p-2"
      />

      {open && (
        <SearchDropdown results={data} isLoading={isLoading} onSelect={() => setOpen(false)}/>
      )}
    </div>
  );
};

export default SearchInput;