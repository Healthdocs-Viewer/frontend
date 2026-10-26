import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  ClipboardCheck,
  Clock,
  Download,
  FileCheck,
  FileText,
  FolderPlus,
  Loader2,
  RefreshCw,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { CaseSummary, FileSummary, PatientResult } from '../types/api';

type WizardStep = 1 | 2 | 3 | 4 | 5;

const TERMS_VERSION = '1.0';

function errorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: string }).message;
    if (message) return message;
  }
  return fallback;
}

function uploadFileToTemporaryUrl(
  uploadUrl: string,
  file: File,
  onProgress: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
      } else {
        reject(new Error(`No fue posible transferir el archivo (${xhr.status}).`));
      }
    };
    xhr.onerror = () => reject(new Error('No fue posible conectar con el almacenamiento temporal.'));
    xhr.send(file);
  });
}

export const PatientDashboard: React.FC = () => {
  const { token } = useAuth();
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [isLoadingCases, setIsLoadingCases] = useState(true);
  const [caseLoadError, setCaseLoadError] = useState<string | null>(null);

  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [studyName, setStudyName] = useState('');
  const [currentCase, setCurrentCase] = useState<CaseSummary | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [consentId, setConsentId] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [completedFile, setCompletedFile] = useState<FileSummary | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [flowError, setFlowError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [patientResult, setPatientResult] = useState<PatientResult | null>(null);
  const [isCheckingResult, setIsCheckingResult] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const selectedCase = useMemo(
    () => cases.find((item) => item.id === selectedCaseId) ?? null,
    [cases, selectedCaseId]
  );

  const fetchCases = async () => {
    setIsLoadingCases(true);
    setCaseLoadError(null);
    try {
      const data = await apiClient.patient.listMyCases();
      setCases(data);
      if (data.length > 0 && !selectedCaseId) setSelectedCaseId(data[0].id);
    } catch (err) {
      setCaseLoadError(errorMessage(err, 'No fue posible cargar tus casos.'));
    } finally {
      setIsLoadingCases(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const resetWizard = () => {
    setWizardStep(1);
    setStudyName('');
    setCurrentCase(null);
    setTermsAccepted(false);
    setConsentId(null);
    setUploadFile(null);
    setCompletedFile(null);
    setFlowError(null);
    setUploadProgress(0);
  };

  const handleCreateCase = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) {
      setFlowError('Sin sesion activa. Vuelve a iniciar sesion.');
      return;
    }
    setIsBusy(true);
    setFlowError(null);
    try {
      const now = new Date();
      const studyDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const created = await apiClient.patient.createCase({
        studyName,
        originInstitution: 'Centro de prueba',
        studyDate,
      });
      setCurrentCase(created);
      setCases((prev) => [created, ...prev.filter((item) => item.id !== created.id)]);
      setSelectedCaseId(created.id);
      setWizardStep(2);
    } catch (err) {
      setFlowError(errorMessage(err, 'No fue posible crear el caso.'));
    } finally {
      setIsBusy(false);
    }
  };

  const handleAcceptTerms = async () => {
    if (!currentCase || !termsAccepted) return;
    setIsBusy(true);
    setFlowError(null);
    try {
      const consent = await apiClient.patient.acceptConsent(currentCase.id, {
        termsVersion: TERMS_VERSION,
      });
      setConsentId(consent.id);
      setWizardStep(3);
    } catch (err) {
      setFlowError(errorMessage(err, 'No fue posible registrar el consentimiento.'));
    } finally {
      setIsBusy(false);
    }
  };

  const handleUpload = async () => {
    if (!currentCase || !uploadFile) return;
    setIsBusy(true);
    setFlowError(null);
    setUploadProgress(0);
    try {
      setWizardStep(4);
      const intent = await apiClient.patient.createInputUpload(currentCase.id, {
        originalFilename: uploadFile.name,
        contentType: uploadFile.type || 'application/octet-stream',
        sizeBytes: uploadFile.size,
      });
      if (Date.now() >= Date.parse(intent.expiresAt)) {
        throw new Error('La intención de carga expiró. Solicita una nueva carga.');
      }
      const isLegacyMockUrl = intent.uploadUrl.startsWith('https://storage.healthdocs.local');
      if (isLegacyMockUrl) {
        setUploadProgress(100);
      } else {
        await uploadFileToTemporaryUrl(intent.uploadUrl, uploadFile, setUploadProgress);
      }
      const confirmed = await apiClient.files.completeUpload(intent.file.id);
      setCompletedFile(confirmed.file);
      setUploadFile(null);
      setWizardStep(5);
      await fetchCases();
    } catch (err) {
      setFlowError(errorMessage(err, 'La carga fallo. Puedes reintentar sin crear otro caso.'));
      setWizardStep(3);
    } finally {
      setIsBusy(false);
    }
  };

  const handleCheckResult = async (caseId: string) => {
    setIsCheckingResult(true);
    setPatientResult(null);
    setResultMessage(null);
    try {
      const res = await apiClient.patient.getPatientResult(caseId);
      setPatientResult(res);
    } catch (err: any) {
      if (err?.code === 'NOT_FOUND' || err?.status === 404) {
        setResultMessage('El resultado aun no esta disponible para este caso.');
      } else {
        setResultMessage(errorMessage(err, 'No fue posible consultar el resultado.'));
      }
    } finally {
      setIsCheckingResult(false);
    }
  };

  const stepLabels = ['Crear caso', 'Consentimiento', 'Archivo', 'Carga', 'Confirmacion'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Portal del Paciente</h1>
          <p className="text-xs text-slate-500 mt-1">
            Crea un caso, acepta el consentimiento y carga el estudio de forma guiada.
          </p>
        </div>
        <button
          onClick={resetWizard}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-xs transition-colors"
        >
          <FolderPlus className="w-4 h-4" />
          <span>Nuevo flujo</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <aside className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col h-fit">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              Mis Casos ({cases.length})
            </h2>
            <button onClick={fetchCases} className="text-slate-400 hover:text-slate-600 p-1 rounded" title="Refrescar casos">
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCases ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {caseLoadError && (
            <div className="mb-3 p-3 rounded-lg text-xs bg-amber-50 text-amber-800 border border-amber-200">
              {caseLoadError}
            </div>
          )}

          {isLoadingCases ? (
            <div className="py-8 text-center text-xs text-slate-400">Cargando casos...</div>
          ) : cases.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No tienes casos registrados. Inicia el flujo guiado.
            </div>
          ) : (
            <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[520px]">
              {cases.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedCaseId(item.id);
                    setPatientResult(null);
                    setResultMessage(null);
                  }}
                  className={`w-full p-3 rounded-lg border text-left transition-all ${
                    selectedCaseId === item.id
                      ? 'border-indigo-500 bg-indigo-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-mono font-semibold text-slate-800 truncate">
                      {item.referenceCode || item.id}
                    </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {item.status}
                    </span>
                  </div>
              <p className="text-xs text-slate-500 mt-1 truncate">{item.studyName}</p>
            <div className="flex items-center gap-1 text-xs text-slate-400 mt-2">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(item.createdAt).toLocaleString()}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </aside>

        <main className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <div className="grid grid-cols-5 gap-2">
                {stepLabels.map((label, index) => {
                  const number = (index + 1) as WizardStep;
                  const active = wizardStep === number;
                  const done = wizardStep > number;
                  return (
                    <div key={label} className="min-w-0">
                      <div className={`h-1.5 rounded-full mb-2 ${done ? 'bg-emerald-500' : active ? 'bg-indigo-600' : 'bg-slate-200'}`} />
              <div className={`text-xs font-semibold truncate ${active ? 'text-indigo-700' : 'text-slate-500'}`}>
                        {number}. {label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6">
              {flowError && (
                <div className="mb-5 p-3 rounded-lg text-xs flex items-center gap-2 bg-red-50 text-red-800 border border-red-200">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{flowError}</span>
                </div>
              )}

              {wizardStep === 1 && (
                <form onSubmit={handleCreateCase} className="space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <ClipboardCheck className="w-4 h-4 text-indigo-600" />
                      Crear caso
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Escribe el nombre tal como aparece en la orden médica. No ingreses historia clínica.
                    </p>
                  </div>
                  <label className="block">
                    <span className="block text-xs font-semibold text-slate-700 mb-1">Nombre del estudio</span>
                    <input
                      required
                      maxLength={200}
                      placeholder="Ej. Radiografía de tórax"
                      value={studyName}
                      onChange={(event) => setStudyName(event.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </label>
                  <button type="submit" disabled={isBusy} className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg disabled:opacity-50">
                    {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderPlus className="w-4 h-4" />}
                    <span>{isBusy ? 'Creando...' : 'Crear caso y continuar'}</span>
                  </button>
                </form>
              )}

              {wizardStep === 2 && currentCase && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      Consentimiento informado
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Caso {currentCase.referenceCode}. Version de terminos {TERMS_VERSION}.
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 leading-5">
                    Confirmo que autorizo el tratamiento de la informacion suministrada para la gestion academica y diagnostica del caso. Entiendo que debo cargar un archivo correspondiente al estudio seleccionado y que la plataforma registrara la fecha de aceptacion.
                  </div>
                  <label className="flex items-start gap-3 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(event) => setTermsAccepted(event.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Acepto los terminos y el consentimiento informado para este caso.</span>
                  </label>
                  <button onClick={handleAcceptTerms} disabled={!termsAccepted || isBusy} className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg disabled:opacity-50">
                    {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    <span>{isBusy ? 'Registrando...' : 'Aceptar y continuar'}</span>
                  </button>
                </div>
              )}

              {wizardStep === 3 && currentCase && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <UploadCloud className="w-4 h-4 text-indigo-600" />
                      Seleccionar archivo
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Caso {currentCase.referenceCode}. Consentimiento registrado {consentId ? `(${consentId.slice(0, 8)})` : ''}.
                    </p>
                  </div>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors">
                    <input
                      type="file"
                      id="patient-flow-file-input"
                      onChange={(event) => {
                        setUploadFile(event.target.files?.[0] || null);
                        setFlowError(null);
                      }}
                      className="hidden"
                      disabled={isBusy}
                    />
                    <label htmlFor="patient-flow-file-input" className="cursor-pointer flex flex-col items-center">
                      <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="text-xs font-semibold text-indigo-600">
                        {uploadFile ? uploadFile.name : 'Seleccionar archivo'}
                      </span>
                      {uploadFile && (
              <span className="text-xs text-slate-500 mt-1">
                          {(uploadFile.size / 1024).toFixed(1)} KB · {uploadFile.type || 'application/octet-stream'}
                        </span>
                      )}
                    </label>
                  </div>
                  <button onClick={handleUpload} disabled={!uploadFile || isBusy} className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg disabled:opacity-50">
                    <UploadCloud className="w-4 h-4" />
                    <span>Solicitar URL y cargar</span>
                  </button>
                </div>
              )}

              {wizardStep === 4 && (
                <div className="space-y-5">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                    Cargando archivo
                  </h3>
                  <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-indigo-600 transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <p className="text-xs text-slate-500">{uploadProgress}% completado</p>
                </div>
              )}

              {wizardStep === 5 && currentCase && completedFile && (
                <div className="space-y-5">
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                    <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Carga confirmada
                    </h3>
                    <p className="text-xs text-emerald-800 mt-2">
                      El archivo {completedFile.originalFilename} fue asociado al caso {currentCase.referenceCode}.
                    </p>
                  </div>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="rounded-lg border border-slate-200 p-3">
                      <dt className="text-slate-500">Archivo</dt>
                      <dd className="font-mono text-slate-900 truncate">{completedFile.id}</dd>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-3">
                      <dt className="text-slate-500">Estado esperado</dt>
                      <dd className="font-semibold text-slate-900">FILES_RECEIVED</dd>
                    </div>
                  </dl>
                  <button onClick={resetWizard} className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-lg">
                    <FolderPlus className="w-4 h-4" />
                    <span>Crear otro caso</span>
                  </button>
                </div>
              )}
            </div>
          </section>

          {selectedCase && (
            <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    Consultar resultado
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Caso seleccionado: <span className="font-mono">{selectedCase.referenceCode || selectedCase.id}</span>
                  </p>
                </div>
                <button onClick={() => handleCheckResult(selectedCase.id)} disabled={isCheckingResult} className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-50">
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingResult ? 'animate-spin' : ''}`} />
                  <span>Consultar</span>
                </button>
              </div>
              {resultMessage && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{resultMessage}</span>
                </div>
              )}
              {patientResult && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs">
                      <FileCheck className="w-4 h-4" />
                      <span>Resultado disponible</span>
                    </div>
              <span className="text-xs text-emerald-600">
                      {new Date(patientResult.availableAt).toLocaleString()}
                    </span>
                  </div>
                  <a href={patientResult.download.downloadUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg">
                    <Download className="w-4 h-4" />
                    <span>Descargar resultado temporal</span>
                  </a>
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
};
