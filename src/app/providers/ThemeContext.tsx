import { createContext, ReactNode, useContext, useEffect, useState } from "react";

export type ThemePreference = "light" | "dark" | "system";

type ThemeContextType = {
  preference: ThemePreference;
  /** Tema koja se trenutno prikazuje */
  theme: "light" | "dark";
  setPreference: (p: ThemePreference) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const STORAGE_KEY = "theme";
const media = () => window.matchMedia("(prefers-color-scheme: dark)");

const resolve = (p: ThemePreference): "light" | "dark" => (p === "system" ? (media().matches ? "dark" : "light") : p);

const readPreference = (): ThemePreference => {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readPreference);
  const [theme, setTheme] = useState<"light" | "dark">(() => resolve(readPreference()));

  useEffect(() => {
    const apply = () => {
      const next = resolve(preference);
      setTheme(next);
      document.documentElement.classList.toggle("dark", next === "dark");
      document.documentElement.style.colorScheme = next;
    };
    apply();
    if (preference !== "system") return;
    const mq = media();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [preference]);

  const setPreference = (p: ThemePreference) => {
    localStorage.setItem(STORAGE_KEY, p);
    setPreferenceState(p);
  };

  return (
    <ThemeContext.Provider
      value={{ preference, theme, setPreference, toggleTheme: () => setPreference(theme === "dark" ? "light" : "dark") }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
