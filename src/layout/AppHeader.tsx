import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link } from "react-router";
import { useSidebar } from "../context/SidebarContext";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";
import NotificationDropdown from "../components/header/NotificationDropdown";
import UserDropdown from "../components/header/UserDropdown";
import { useAuth } from "../context/AuthContext";

const AppHeader: React.FC = () => {
  const { toggleSidebar, toggleMobileSidebar } = useSidebar();

  const handleToggleSidebar = () => {
    if (window.innerWidth >= 1024) toggleSidebar();
    else toggleMobileSidebar();
  };

  // SEARCH STATE
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const { token } = useAuth();

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // CMD + K focus
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

  // CLICK OUTSIDE
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

  // API SEARCH
  const performSearch = async (value: string) => {
    if (!value.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    try {
      const { data } = await axios.get(
        `https://medikalija-api.vercel.app/api/search?q=${value} `
      );
      setResults(data.results || []);
      setShowDropdown(true);
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  // MOVE TO RESERVE
  const moveToReserve = async (
    medicineId: string,
    source: "home" | "family"
  ) => {
    const amount = amounts[medicineId];

    if (!amount || amount <= 0) {
      return alert("Unesi količinu!");
    }

    try {
      await axios.post(
  "https://medikalija-api.vercel.app/api/medicine-reserve/move",
      { medicineId, amount, source },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

      setAmounts((prev) => ({ ...prev, [medicineId]: 0 }));
      alert("Prebačeno u rezervu ✅");
    } catch (err) {
      console.error("Greška pri prebacivanju:", err);
      alert("Greška pri prebacivanju u rezervu");
    }
  };

  // INPUT WITH DEBOUNCE
  const handleSearchInput = (value: string) => {
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  return (
    <header className="sticky top-0 w-full bg-white border-b dark:bg-gray-900 z-50">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between px-3 py-3 lg:px-6">

        {/* LEFT */}
        <div className="flex items-center gap-3 w-full lg:flex-1">

          <button
            onClick={handleToggleSidebar}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-300"
          >
            ☰
          </button>

          <Link to="/" className="lg:hidden">
            <img src="./images/logo/logo.svg" className="dark:hidden h-8" />
            <img src="./images/logo/logo-dark.svg" className="hidden dark:block h-8" />
          </Link>

          {/* SEARCH (MOBILE + DESKTOP) */}
          <div ref={dropdownRef}className=" relative 
              w-full 
              max-w-full 
              sm:max-w-xl 
              md:max-w-3xl 
              lg:max-w-5xl 
              xl:max-w-5xl 
              2xl:max-w-6xl 
              mx-auto" >
            <input
              ref={inputRef}
              type="text"
              value={query}
              placeholder="Pretraga lekova, pacijenata i rezervi..."
              onChange={(e) => handleSearchInput(e.target.value)}
              className="
                h-12
                w-full 
                rounded-2xl
                border 
                px-5
                text-base
                shadow-sm
                focus:ring-2 
                focus:ring-blue-500 
                focus:border-blue-500
                dark:bg-gray-800 
                dark:text-white
              "
            />


            {/* DROPDOWN */}
            {showDropdown && results.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border max-h-80 overflow-y-auto z-50">
                {results.map((item) => (
                  <div key={item._id} className="p-3 border-b text-xl space-y-2">
                    <div className="font-semibold">{item.name}</div>

                    {item.type === "medicine" && (
                      <>
                        <div className="text-xl text-gray-500">
                          🏥 {item.quantity} · 👪 {item.familyQuantity}
                        </div>

                        <input
                          type="number"
                          placeholder="Količina"
                          value={amounts[item._id] || ""}
                          onChange={(e) =>
                            setAmounts({
                              ...amounts,
                              [item._id]: Number(e.target.value),
                            })
                          }
                          className="w-full px-2 py-1 border rounded text-xs"
                        />

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => moveToReserve(item._id, "home")}
                            className="bg-blue-600 text-white text-xl py-1 rounded"
                          >
                            Rezerva dom
                          </button>
                          <button
                            onClick={() => moveToReserve(item._id, "family")}
                            className="bg-green-600 text-white text-xl py-1 rounded"
                          >
                            Rezerva porodica
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3 mt-3 lg:mt-0">
          <ThemeToggleButton />
          <NotificationDropdown />
          <UserDropdown />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
