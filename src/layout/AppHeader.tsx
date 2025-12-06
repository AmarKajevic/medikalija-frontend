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
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  // === SEARCH STATE ===
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<NodeJS.Timeout | null>(null);

  // CMD+K focus shortcut
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Klik izvan dropdowna → zatvori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // === API search poziv ===
  const performSearch = async (value: string) => {
    if (!value.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    try {
      const res = await axios.get(
        `https://medikalija-api.vercel.app/api/search?q=${value}`
      );

      setResults(res.data.results || []);
      setShowDropdown(true);
    } catch (err) {
      console.log("Search error:", err);
    }
  };

  // === Debounced search input handler ===
  const handleSearchInput = (value: string) => {
    setQuery(value);

    if (typingTimer.current) clearTimeout(typingTimer.current);

    typingTimer.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  return (
    <header className="sticky top-0 flex w-full bg-white border-gray-200 z-50 dark:border-gray-800 dark:bg-gray-900 lg:border-b">
      <div className="flex flex-col items-center justify-between grow lg:flex-row lg:px-6">

        {/* LEFT SIDE */}
        <div className="flex items-center justify-between w-full px-3 py-3 lg:px-0 lg:py-4">

          {/* Sidebar toggle */}
          <button
            onClick={handleToggleSidebar}
            className="w-10 h-10 lg:w-11 lg:h-11 text-gray-500 dark:text-gray-400 flex items-center justify-center rounded-lg"
          >
            ☰
          </button>

          {/* Logo - mobile */}
          <Link to="/" className="lg:hidden">
            <img src="./images/logo/logo.svg" className="dark:hidden" />
            <img src="./images/logo/logo-dark.svg" className="hidden dark:block" />
          </Link>

          {/* SEARCH BAR */}
          <div className="hidden lg:block relative w-full max-w-lg" ref={dropdownRef}>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                🔍
              </span>

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

              {/* CMD + K indicator */}
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

                    <div className="text-xs text-gray-500">
                      {item.type === "medicine" && "🟦 Lek"}
                      {item.type === "article" && "🟩 Artikal"}
                      {item.type === "patient" && "🟧 Pacijent"}
                    </div>
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
