import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link } from "react-router";
import { useSidebar } from "../context/SidebarContext";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";
import NotificationDropdown from "../components/header/NotificationDropdown";
import UserDropdown from "../components/header/UserDropdown";

const AppHeader: React.FC = () => {
  // === SIDEBAR ===
  const { toggleSidebar, toggleMobileSidebar } = useSidebar();

  const handleToggleSidebar = () => {
    if (window.innerWidth >= 1024) toggleSidebar();
    else toggleMobileSidebar();
  };

  // === SEARCH STATE ===
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // === CMD + K FOCUS ===
  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, []);

  // === CLICK OUTSIDE DROPDOWN ===
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // === API SEARCH ===
  const performSearch = async (value: string) => {
    if (!value.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    try {
      const { data } = await axios.get(
        `https://medikalija-api.vercel.app/api/search?q=${value}`
      );

      setResults(data.results || []);
      setShowDropdown(true);
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  // === HANDLE INPUT WITH DEBOUNCE ===
  const handleSearchInput = (value: string) => {
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  return (
    <header className="sticky top-0 flex w-full bg-white border-gray-200 z-50 dark:border-gray-800 dark:bg-gray-900 lg:border-b">
      <div className="flex flex-col items-center justify-between grow lg:flex-row lg:px-6">

        {/* LEFT SIDE */}
        <div className="flex items-center justify-between w-full px-3 py-3 lg:px-0 lg:py-4">

          {/* SIDEBAR TOGGLE */}
          <button
            onClick={handleToggleSidebar}
            className="w-10 h-10 lg:w-11 lg:h-11 text-gray-500 dark:text-gray-400 flex items-center justify-center rounded-lg"
          >
            ☰
          </button>

          {/* LOGO (mobile) */}
          <Link to="/" className="lg:hidden">
            <img src="./images/logo/logo.svg" className="dark:hidden" />
            <img src="./images/logo/logo-dark.svg" className="hidden dark:block" />
          </Link>

          {/* SEARCH BAR */}
          <div className="hidden lg:block relative w-full max-w-lg mx-auto" ref={dropdownRef}>
            <div className="relative">
              {/* Icon */}
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                🔍
              </span>

              {/* Input */}
              <input
                ref={inputRef}
                type="text"
                value={query}
                placeholder="Pretraga lekova, artikala i pacijenata..."
                onChange={(e) => handleSearchInput(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14
                text-sm text-gray-800 placeholder:text-gray-400 shadow-sm
                focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10
                dark:bg-dark-900 dark:text-white/90 dark:border-gray-800 dark:placeholder:text-white/30"
              />

              {/* CMD + K hint */}
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 
              dark:text-gray-400 border border-gray-300 dark:border-gray-700 px-2 py-1 rounded">
                ⌘K
              </button>
            </div>

            {/* DROPDOWN RESULTS */}
            {showDropdown && results.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl
              border border-gray-200 dark:border-gray-700 max-h-80 overflow-y-auto z-50">

                {results.map((item) => (
                  <div
                    key={item._id}
                    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700"
                  >
                    <div className="font-medium">{item.name}</div>

                    {/* TYPE BADGE + QUANTITIES */}
                    {item.type === "medicine" && (
                      <div className="text-xs text-gray-500 mt-1">
                        🏥 Dom: <span className="font-semibold">{item.quantity ?? 0}</span> kom ·{" "}
                        👪 Porodica: <span className="font-semibold">{item.familyQuantity ?? 0}</span> kom
                      </div>
                    )}

                    {item.type === "article" && (
                      <div className="text-xs text-gray-500 mt-1">
                        🏥 Dom: <span className="font-semibold">{item.quantity ?? 0}</span> kom ·{" "}
                        👪 Porodica: <span className="font-semibold">{item.familyQuantity ?? 0}</span> kom
                      </div>
                    )}

                    {item.type === "patient" && (
                      <div className="text-xs text-gray-500 mt-1">👤 Pacijent</div>
                    )}
                  </div>
                ))}

              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-3 px-5 py-4 lg:px-0">
          <ThemeToggleButton />
          <NotificationDropdown />
          <UserDropdown />
        </div>

      </div>
    </header>
  );
};

export default AppHeader;
