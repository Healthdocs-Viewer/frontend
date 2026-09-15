import React from 'react';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { PatientDashboard } from './pages/PatientDashboard';
import { StudentDashboard } from './pages/StudentDashboard';
import { ProfessorDashboard } from './pages/ProfessorDashboard';
import { Navbar } from './components/Navbar';
import { ForbiddenAlert } from './components/ForbiddenAlert';
import { notifyUnauthorized, notifyForbidden } from './services/apiClient';
import { ShieldAlert, LogOut } from 'lucide-react';

export const App: React.FC = () => {
  const { user, token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Validando sesión clínica...</p>
        </div>
      </div>
    );
  }

  // Rutas privadas protegidas: si no está autenticado, redirige al Login
  if (!token || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <ForbiddenAlert />
        <LoginPage />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <ForbiddenAlert />

      {/* Barra auxiliar de desarrollo para pruebas rápidas de seguridad */}
      <div className="bg-slate-800 text-slate-300 px-4 py-1.5 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Sesión activa: <strong className="text-white">{user.email}</strong> ({user.role})</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => notifyForbidden('Prueba: Tu rol actual no tiene acceso a esta acción.')}
            className="text-[11px] text-amber-300 hover:text-amber-200 underline flex items-center gap-1"
            title="Verificar manejo de respuesta 403"
          >
            <ShieldAlert className="w-3 h-3" />
            Probar 403 (Permisos insuficientes)
          </button>
          <button
            onClick={() => notifyUnauthorized()}
            className="text-[11px] text-red-300 hover:text-red-200 underline flex items-center gap-1"
            title="Verificar redirección y limpieza ante 401"
          >
            <LogOut className="w-3 h-3" />
            Probar 401 (Sesión inválida / Redirección)
          </button>
        </div>
      </div>

      <main className="flex-1">
        {/* Renderizado de vista según rol */}
        {user.role === 'paciente' && <PatientDashboard />}
        {user.role === 'estudiante' && <StudentDashboard />}
        {user.role === 'profesor' && <ProfessorDashboard />}
      </main>
    </div>
  );
};
