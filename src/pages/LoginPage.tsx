import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { QUICK_LOGIN_CREDENTIALS } from '../services/mockApi';
import { Shield, Lock, User, ArrowRight, UserCheck, AlertCircle, ShieldAlert } from 'lucide-react';

/**
 * Determina si un error es un 403 (cuenta autenticada sin acceso habilitado).
 * Así la UI puede mostrar un mensaje específico en lugar del genérico de credenciales.
 */
function isForbiddenError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as Record<string, unknown>;
  return e.code === 'FORBIDDEN' || Number(e.status) === 403;
}

export const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorKind, setErrorKind] = useState<'credentials' | 'forbidden' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorKind(null);
    setErrorMessage(null);
    try {
      await login({ email: username, password });
    } catch (err: any) {
      if (isForbiddenError(err)) {
        setErrorKind('forbidden');
        setErrorMessage(
          err?.message || 'Tu cuenta no tiene acceso habilitado. Contacta al administrador.'
        );
      } else {
        setErrorKind('credentials');
        setErrorMessage(
          err?.message || 'Credenciales incorrectas. Verifica tu usuario y contraseña.'
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
        setErrorKind('forbidden');
        setErrorMessage(
          err?.message || 'Esta cuenta no tiene acceso habilitado.'
        );
      } else {
        setErrorKind('credentials');
        setErrorMessage(
          err?.message || 'Error al iniciar sesión con la cuenta de prueba.'
        );
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
          <Shield className="w-7 h-7" />
        </div>
        <h2 className="mt-4 text-2xl font-extrabold text-slate-900 tracking-tight">
          Healthdocs Viewer
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Autenticación local de desarrollo — Contrato OpenAPI v0.2.1
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm rounded-xl border border-slate-200 sm:px-10">

          {/* Alerta de error 401: credenciales incorrectas */}
          {errorKind === 'credentials' && errorMessage && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Error de autenticación (401)</p>
                <p className="text-xs mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Alerta de error 403: sin acceso habilitado */}
          {errorKind === 'forbidden' && errorMessage && (
            <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm flex items-start gap-2.5">
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
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="paciente, estudiante o profesor"
                  autoComplete="username"
                  className="block w-full pl-10 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                  className="block w-full pl-10 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
            >
              {isLoading ? (
                'Iniciando sesión...'
              ) : (
                <>
                  <span>Ingresar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Accesos rápidos — desacoplados del mock interno */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center mb-4">
              Acceso rápido con cuentas de prueba
            </p>

            <div className="space-y-2.5">
              {QUICK_LOGIN_CREDENTIALS.map((cred) => (
                <button
                  key={cred.role}
                  type="button"
                  onClick={() => handleQuickLogin(cred.email, cred.password)}
                  disabled={isLoading}
                  className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center text-slate-600 group-hover:text-indigo-600 transition-colors">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        {cred.email}
                      </p>
                      <p className="text-[11px] text-slate-500 capitalize">
                        Rol: <span className="font-medium text-slate-700">{cred.label}</span>
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                    Entrar &rarr;
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
