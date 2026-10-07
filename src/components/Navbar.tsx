import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, User, LogOut, Database, Wifi } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, isMock, setMock } = useAuth();

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'patient':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'researcher':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'coordinator':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo y Nombre del Sistema */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 text-base tracking-tight">Healthdocs</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                Viewer MVP
              </span>
            </div>
            <p className="text-xs text-slate-500">Plataforma de Intercambio Clínico</p>
          </div>
        </div>

        {/* Indicadores de Entorno y Usuario */}
        <div className="flex items-center gap-4">
          {/* Switch de Modo Mock / Backend Real */}
          <div className="flex items-center text-xs bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setMock(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                isMock
                  ? 'bg-white text-indigo-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Modo Mock según contrato OpenAPI"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Mock Dev</span>
            </button>
            <button
              onClick={() => setMock(false)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                !isMock
                  ? 'bg-white text-emerald-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Conexión con /api/v1 (Spring Boot)"
            >
              <Wifi className="w-3.5 h-3.5" />
              <span>Backend API</span>
            </button>
          </div>

          {user && (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200">
                  <User className="w-4 h-4" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-medium text-slate-800 leading-tight">{user.email}</p>
                  <span
className={`inline-block text-xs font-medium uppercase px-2 py-0.5 rounded-full border mt-0.5 ${getRoleBadge(
                      user.role
                    )}`}
                  >
                    {user.role}
                  </span>
                </div>
              </div>

              <button
                onClick={logout}
                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
