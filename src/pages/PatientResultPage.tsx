import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Clock, Download, Loader2, RefreshCw, ShieldAlert } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { PatientResult } from '../types/api';

type ResultState = 'loading' | 'pending' | 'available' | 'not-found' | 'forbidden' | 'expired' | 'temporary-error' | 'unexpected-error';

function statusOf(error: unknown): number | undefined {
  if (error && typeof error === 'object' && 'status' in error) return Number((error as { status?: number }).status);
  return undefined;
}

export const PatientResultPage: React.FC<{ caseId: string }> = ({ caseId }) => {
  const { user, token } = useAuth();
  const [state, setState] = useState<ResultState>('loading');
  const [result, setResult] = useState<PatientResult | null>(null);

  const loadResult = async () => {
    if (!token) {
      setState('expired');
      return;
    }
    setState('loading');
    setResult(null);
    try {
      const data = await apiClient.patient.getPatientResult(caseId);
      setResult(data);
      setState('available');
    } catch (error) {
      const status = statusOf(error);
      const code = error && typeof error === 'object' && 'code' in error ? String((error as { code?: string }).code) : '';
      if (status === 401 || code === 'UNAUTHORIZED') setState('expired');
      else if (status === 403 || code === 'FORBIDDEN') setState('forbidden');
      else if (status === 409 || code === 'CONFLICT') setState('pending');
      else if (status === 404 || code === 'NOT_FOUND') setState('not-found');
      else if (status === 408 || status === 429 || (status !== undefined && status >= 500) || error instanceof TypeError) setState('temporary-error');
      else setState('unexpected-error');
    }
  };

  useEffect(() => { void loadResult(); }, [caseId, token]);

  if (!user || user.role !== 'paciente') {
    return <StatePanel state="forbidden" onRetry={loadResult} />;
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Portal del paciente</p>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Consulta de resultado</h1>
          <p className="text-xs text-slate-500 mt-2">Caso seleccionado: <span className="font-mono">{caseId}</span></p>
        </div>
        <div className="p-6">
          {state !== 'available' ? <StatePanel state={state} onRetry={loadResult} /> : (
            <div data-testid="patient-result-available" className="space-y-5">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                <div className="flex items-center gap-2 font-semibold text-sm"><CheckCircle className="w-5 h-5" /> Resultado disponible</div>
                <p className="text-xs mt-2">Disponible el {new Date(result!.availableAt).toLocaleString()}.</p>
              </div>
              {Date.now() >= Date.parse(result!.download.expiresAt) ? <StatePanel state="expired" onRetry={loadResult} /> : <a
                data-testid="patient-result-download"
                href={result!.download.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg"
              >
                <Download className="w-4 h-4" /> Descargar resultado
              </a>}
              <p className="text-xs text-slate-500 flex items-start gap-2"><ShieldAlert className="w-4 h-4 flex-shrink-0" />El enlace es temporal. No compartas esta ventana y vuelve a autenticarte si tu sesión expira.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

const StatePanel: React.FC<{ state: ResultState; onRetry: () => void }> = ({ state, onRetry }) => {
  if (state === 'loading') return <div data-testid="patient-result-loading" className="py-10 text-center text-sm text-slate-500"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />Cargando resultado...</div>;
  const content: Record<Exclude<ResultState, 'loading' | 'available'>, { title: string; text: string }> = {
    pending: { title: 'Resultado pendiente', text: 'El resultado todavía no está disponible para este caso.' },
    'not-found': { title: 'Resultado no encontrado', text: 'No fue posible encontrar un resultado para este caso.' },
    forbidden: { title: 'Acceso no autorizado', text: 'No tienes permisos para consultar este resultado.' },
    expired: { title: 'Sesión expirada', text: 'Inicia sesión nuevamente para consultar tu resultado.' },
    'temporary-error': { title: 'Error temporal', text: 'No fue posible consultar el resultado. Intenta nuevamente.' },
    'unexpected-error': { title: 'Error inesperado', text: 'Ocurrió un error inesperado al consultar el resultado.' },
  };
  const item = content[state as Exclude<ResultState, 'loading' | 'available'>];
  return <div data-testid={`patient-result-${state}`} className="py-8 text-center">
    {state === 'pending' ? <Clock className="w-7 h-7 mx-auto mb-3 text-amber-500" /> : <AlertCircle className="w-7 h-7 mx-auto mb-3 text-amber-500" />}
    <h2 className="text-sm font-bold text-slate-900">{item.title}</h2>
    <p className="text-xs text-slate-500 mt-2">{item.text}</p>
    {(state === 'temporary-error' || state === 'unexpected-error') && <button onClick={onRetry} className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-indigo-700"><RefreshCw className="w-4 h-4" />Reintentar</button>}
  </div>;
};
