import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { ThemeToggleButton } from "../common/ThemeToggleButton";
import NotificationDropdown from "./NotificationDropdown";
import UserDropdown from "./UserDropdown";
import { Link } from "react-router";

interface HeaderProps {
  onClick?: () => void;
  onToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggle }) => {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<any>(null); // FIXED DEBOUNCE

  // CLICK OUTSIDE DROPDOWN
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // API SEARCH
  const performSearch = async (value: string) => {
    if (!value.trim()) {
      setShowDropdown(false);
      setSearchResults([]);
      return;
    }

    try {
      const res = await axios.get(`https://medikalija-api.vercel.app/api/search?q=${value}`);
      console.log("Search response:", res.data);
      setSearchResults(res.data.results || []);
      setShowDropdown(true);
    } catch (err) {
      console.log("Search error:", err);
    }
  };

  // LIVE SEARCH WITH PROPER DEBOUNCE
  const handleSearchInput = (value: string) => {
    setQuery(value);

    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  return (
    <header className="sticky top-0 flex w-full bg-white border-gray-200 z-50 dark:border-gray-800 dark:bg-gray-900 lg:border-b">
      <div className="flex flex-col items-center justify-between grow lg:flex-row lg:px-6">

        <div className="flex items-center justify-between w-full px-3 py-3 lg:px-0 lg:py-4">

          {/* Hamburger */}
          <button className="block w-10 h-10 text-gray-500 lg:hidden dark:text-gray-400"
            onClick={onToggle}>
            ☰
          </button>

          {/* Logo */}
          <Link to="/" className="lg:hidden">
            <img src="./images/logo/logo.svg" className="dark:hidden" />
            <img src="./images/logo/logo-dark.svg" className="hidden dark:block" />
          </Link>

          {/* SEARCH BAR */}
          <div className="hidden lg:block relative" ref={searchRef}>
            <div className="relative">

              <button className="absolute -translate-y-1/2 left-4 top-1/2">
                <svg className="fill-gray-500 dark:fill-gray-400" width="20" height="20" viewBox="0 0 20 20">
                  <path d="M3.5 9a5.5 5.5 0 1111 0 5.5 5.5 0 01-11 0zm12.2 5.8l3.3 3.3-1.4 1.4-3.3-3.3a7.5 7.5 0 111.4-1.4z" />
                </svg>
              </button>

              <input
                type="text"
                value={query}
                placeholder="Pretraga lekova i artikala..."
                onChange={(e) => handleSearchInput(e.target.value)}
                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm 
                text-gray-800 placeholder:text-gray-400 shadow-theme-xs 
                focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 
                dark:border-gray-800 dark:text-white/90 dark:placeholder:text-white/30 xl:w-[430px]"
              />

            </div>

            {/* DROPDOWN RESULTS */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 shadow-xl rounded-lg 
              border border-gray-200 dark:border-gray-700 max-h-80 overflow-y-auto z-50">

                {searchResults.map((item) => (
                  <div
                    key={item._id}
                    className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    <div className="font-medium">{item.name}</div>

                    {item.type === "medicine" && (
                      <div className="text-xs text-gray-500">
                        Lek (upisano u bazi)
                      </div>
                    )}

                    {item.type === "article" && (
                      <div className="text-xs text-gray-500">
                        Artikal
                      </div>
                    )}

                    {item.type === "patient" && (
                      <div className="text-xs text-gray-500">
                        Pacijent
                      </div>
                    )}
                  </div>
                ))}

              </div>
            )}

          </div>
        </div>

        <div className="flex items-center gap-3 px-5 py-4 lg:px-0">
          <ThemeToggleButton />
          <NotificationDropdown />
          <UserDropdown />
        </div>

      </div>
    </header>
  );
};

export default Header;
