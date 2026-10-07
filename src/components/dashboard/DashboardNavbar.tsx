import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { CircleHelp, LogOut, Menu, Settings } from "lucide-react";
import { Button } from "../ui/Button";
import { useAuth } from "../../context/AuthContext";
import { ThemeToggle } from "../layout/ThemeToggle";

type DashboardNavbarProps = {
  title: string;
  onMobileMenuClick?: () => void;
};

export const DashboardNavbar: React.FC<DashboardNavbarProps> = ({
  title,
  onMobileMenuClick,
}) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [logoutError, setLogoutError] = React.useState<string | null>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  React.useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);
  const handleLogout = async () => {
    setLogoutError(null);
    closeMenu();
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch {
      setLogoutError("No se pudo cerrar sesión. Intenta de nuevo.");
      setMenuOpen(true);
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5 text-slate-900 lg:px-8 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Abrir menú de navegación"
          onClick={onMobileMenuClick}
          className="rounded-lg p-1 text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-300 lg:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <span className="text-sm text-slate-400 dark:text-slate-500">Healthdocs /</span>
        <span className="font-medium">{title}</span>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <div ref={menuRef} className="relative">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Abrir menú de usuario"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="h-10 w-10 rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <span className="block aspect-square h-8 w-8 min-h-8 min-w-8 shrink-0 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500 ring-2 ring-white dark:ring-slate-900" />
          </Button>

          {menuOpen && (
            <div
              role="menu"
              aria-label="Menú de usuario"
              className="absolute right-0 top-full z-50 mt-2 w-60 origin-top-right rounded-xl border border-slate-200 bg-white p-1.5 text-slate-700 shadow-lg shadow-slate-900/10 ring-1 ring-black/5 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:shadow-black/30 dark:ring-white/5"
            >
              <div className="px-3 py-2">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                  {user?.email ?? "Mi cuenta"}
                </p>
                {user?.role && (
                  <p className="mt-0.5 text-xs capitalize text-slate-500 dark:text-slate-400">
                    {{
                      patient: "Paciente",
                      researcher: "Investigador",
                      coordinator: "Coordinador",
                      admin: "Administrador",
                    }[user.role]}
                  </p>
                )}
              </div>
              {logoutError && (
                <p role="alert" className="px-3 py-1 text-xs text-rose-600 dark:text-rose-400">
                  {logoutError}
                </p>
              )}
              <div className="my-1 h-px bg-slate-200 dark:bg-slate-700" />
              <Link
                to="/configuracion"
                role="menuitem"
                onClick={closeMenu}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm outline-none transition-colors hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-800 dark:focus:bg-slate-800"
              >
                <Settings className="h-4 w-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                Configuración
              </Link>
              <Link
                to="/ayuda"
                role="menuitem"
                onClick={closeMenu}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm outline-none transition-colors hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-800 dark:focus:bg-slate-800"
              >
                <CircleHelp className="h-4 w-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                Ayuda
              </Link>
              <div className="my-1 h-px bg-slate-200 dark:bg-slate-700" />
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-rose-600 outline-none transition-colors hover:bg-rose-50 focus:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 dark:focus:bg-rose-950/40"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
