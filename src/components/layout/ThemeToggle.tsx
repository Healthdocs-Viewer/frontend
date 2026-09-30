import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const darkModeEnabled = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={darkModeEnabled ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={darkModeEnabled ? "Modo claro" : "Modo oscuro"}
      className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
    >
      {darkModeEnabled ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
    </button>
  );
};
