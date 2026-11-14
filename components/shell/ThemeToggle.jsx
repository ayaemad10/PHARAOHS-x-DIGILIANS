"use client";

import { useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import usePersistentState from "@/lib/usePersistentState";

export const THEME_KEY = "theme";

/**
 * Dark / light switch. The choice is stored (flarenexus:theme) and applied as data-theme on
 * <html>; the inline script in app/layout.js applies it before first paint so there is no flash.
 */
export default function ThemeToggle({ className = "" }) {
  const [theme, setTheme] = usePersistentState(THEME_KEY, "dark");
  const isLight = theme === "light";

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("fx-theme-switching");
    root.setAttribute("data-theme", isLight ? "light" : "dark");
    const t = setTimeout(() => root.classList.remove("fx-theme-switching"), 320);
    return () => clearTimeout(t);
  }, [isLight]);

  const label = isLight ? "Switch to dark mode" : "Switch to light mode";
  return (
    <button
      type="button"
      onClick={() => setTheme(isLight ? "dark" : "light")}
      aria-label={label}
      title={label}
      aria-pressed={isLight}
      className={`fx-btn fx-btn-ghost h-7 gap-1.5 px-2 text-xs ${className}`}
    >
      {isLight ? <Moon className="size-4" aria-hidden="true" /> : <Sun className="size-4" aria-hidden="true" />}
      <span className="hidden sm:inline">{isLight ? "Dark" : "Light"}</span>
    </button>
  );
}
