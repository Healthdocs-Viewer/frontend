import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { QUICK_LOGIN_CREDENTIALS } from "../../services/mockApi";
import {
  Lock,
  User,
  ArrowRight,
  UserCheck,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { OAuthButtons } from "../../components/auth/OAuthButtons";
import { AuthLayout } from "../../components/auth/AuthLayout";

/**
 * Determina si un error es un 403 (cuenta autenticada sin acceso habilitado).
 * Así la UI puede mostrar un mensaje específico en lugar del genérico de credenciales.
 */
function isForbiddenError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as Record<string, unknown>;
  return e.code === "FORBIDDEN" || Number(e.status) === 403;
}

export const LoginPage: React.FC = () => {
  const { login, isLoading, usesManagedAuth } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorKind, setErrorKind] = useState<
    "credentials" | "forbidden" | null
  >(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorKind(null);
    setErrorMessage(null);
    try {
      await login({ email: username, password });
      navigate("/", { replace: true });
    } catch (err: any) {
      if (isForbiddenError(err)) {
        setErrorKind("forbidden");
        setErrorMessage(
          err?.message ||
            "Tu cuenta no tiene acceso habilitado. Contacta al administrador.",
        );
      } else {
        setErrorKind("credentials");
        setErrorMessage(
          err?.message ||
            "Credenciales incorrectas. Verifica tu usuario y contraseña.",
        );
      }
    }
  };

  const handleQuickLogin = async (email: string, pwd: string) => {
    setUsername(email);
    setPassword(pwd);
    setErrorKind(null);
    setErrorMessage(null);
    try {
      await login({ email, password: pwd });
    } catch (err: any) {
      if (isForbiddenError(err)) {
        setErrorKind("forbidden");
        setErrorMessage(
          err?.message || "Esta cuenta no tiene acceso habilitado.",
        );
      } else {
        setErrorKind("credentials");
        setErrorMessage(
          err?.message || "Error al iniciar sesión con la cuenta de prueba.",
        );
      }
    }
  };

  return (
    <AuthLayout>
      <div>
        <div className="mb-7 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Bienvenido de nuevo
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {usesManagedAuth
              ? "Ingresa tu correo y contraseña para continuar."
              : "Autenticación local de desarrollo"}
          </p>
        </div>
          {/* Alerta de error 401: credenciales incorrectas */}
          {errorKind === "credentials" && errorMessage && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Error de autenticación (401)</p>
                <p className="text-xs mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Alerta de error 403: sin acceso habilitado */}
          {errorKind === "forbidden" && errorMessage && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
              <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Acceso no habilitado (403)</p>
                <p className="text-xs mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Formulario de POST /auth/login */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
              >
                Usuario
              </label>
              <div className="relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="username"
                  type={usesManagedAuth ? "email" : "text"}
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={
                    usesManagedAuth
                      ? "tu-correo@ejemplo.com"
                      : "usuario@healthdocs.local"
                  }
                  autoComplete={usesManagedAuth ? "email" : "username"}
                  className="block w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
              >
                Contraseña
              </label>
              <div className="relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="block w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-transparent bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 dark:focus:ring-offset-slate-900"
            >
              {isLoading ? (
                "Iniciando sesión..."
              ) : (
                <>
                  <span>Ingresar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <OAuthButtons />

          {usesManagedAuth && (
            <p className="mt-6 border-t border-slate-200 pt-5 text-center text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
              ¿No tienes una cuenta?{" "}
              <Link
                to="/signup"
                className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Regístrate
              </Link>
            </p>
          )}

          {!usesManagedAuth && (
            <div className="mt-7 border-t border-slate-200 pt-5 dark:border-slate-800">
              <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Acceso rápido con cuentas de prueba
              </p>

              <div className="space-y-2.5">
                {QUICK_LOGIN_CREDENTIALS.map((cred) => (
                  <button
                    key={cred.role}
                    type="button"
                    onClick={() => handleQuickLogin(cred.email, cred.password)}
                    disabled={isLoading}
                    className="group flex w-full items-center justify-between rounded-lg border border-slate-200 p-2.5 text-left transition-all hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors group-hover:bg-indigo-100 group-hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-300">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {cred.email}
                        </p>
                        <p className="text-xs capitalize text-slate-500 dark:text-slate-400">
                          Rol:{" "}
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                            {cred.label}
                          </span>
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-indigo-600 transition-transform group-hover:translate-x-0.5 dark:text-indigo-400">
                      Entrar &rarr;
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
      </div>
    </AuthLayout>
  );
};
