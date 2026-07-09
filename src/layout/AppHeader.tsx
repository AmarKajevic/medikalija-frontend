import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { useSidebar } from "../context/SidebarContext";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";
import NotificationDropdown from "../components/header/NotificationDropdown";
import UserDropdown from "../components/header/UserDropdown";
import SearchInput from "../features/search/ui/SearchInput";



const AppHeader = () => {
  const { toggleSidebar, toggleMobileSidebar } = useSidebar();

  const inputRef = useRef<HTMLInputElement>(null);

  const handleToggleSidebar = () => {
    if (window.innerWidth >= 1024) toggleSidebar();
    else toggleMobileSidebar();
  };


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

  return (
    <header className="sticky top-0 w-full  bg-white border-b  dark:bg-gray-900 z-50">
      <div className="flex flex-col lg:flex-row lg:items-center  lg:justify-between px-3 py-3 lg:px-6">


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

          <div
            className="
              relative 
              w-full 
              max-w-full 
              sm:max-w-xl 
              md:max-w-3xl 
              lg:max-w-5xl 
              xl:max-w-5xl 
              2xl:max-w-6xl 
              mx-auto
            "
          >
            <SearchInput  />
          </div>
        </div>


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