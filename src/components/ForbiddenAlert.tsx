import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ForbiddenAlert: React.FC = () => {
  const { forbiddenMessage, clearForbiddenAlert } = useAuth();

  if (!forbiddenMessage) return null;

  return (
    <div className="fixed top-20 right-6 z-50 max-w-md w-full animate-bounce-short">
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-lg flex items-start gap-3">
        <div className="flex-shrink-0 text-amber-600 mt-0.5">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-amber-800">
            Error 403 — Permisos Insuficientes
          </h4>
          <p className="text-xs text-amber-700 mt-1 leading-relaxed">
            {forbiddenMessage}
          </p>
          <p className="text-xs text-amber-600 mt-1 italic">
            Tu rol o habilitación actual no permite realizar esta operación en este recurso.
          </p>
        </div>
        <button
          onClick={clearForbiddenAlert}
          className="text-amber-500 hover:text-amber-700 p-1 rounded transition-colors"
          title="Cerrar notificación"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
