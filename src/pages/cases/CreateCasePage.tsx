import React from "react";
import {
  ArrowRight,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  CloudUpload,
  FileText,
  Info,
  Paperclip,
  Send,
  ShieldCheck,
  Stethoscope,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { useAuth } from "../../context/AuthContext";
import { apiClient } from "../../services/apiClient";
import { uploadAndConfirmInputFile } from "../../services/inputFileUpload";
import type { CaseSummary, CreateCaseRequest, FileSummary, UploadIntent } from "../../types/api";

const steps = ["Información", "Consentimiento", "Archivo", "Confirmación"];
const inputClassName =
  "h-12 w-full rounded-xl border border-slate-200/90 bg-slate-50/80 px-3.5 text-sm font-medium text-slate-800 shadow-sm outline-none transition placeholder:font-normal placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:border-slate-600 dark:focus:border-indigo-400 dark:focus:bg-slate-800";

const getTodayInputValue = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${value.year}-${value.month}-${value.day}`;
};

const CASE_CREATION_SESSION_KEY = "healthdocs_case_creation_session";
const CASE_CONFIRMED_FILES_KEY = "healthdocs_case_confirmed_files:";
const CONSENT_TERMS_VERSION = "1.0";

type UploadStatus = "pending" | "uploading" | "confirmed" | "failed";
type CaseUploadItem = {
  clientId: string;
  file?: File;
  fileName: string;
  sizeBytes: number;
  status: UploadStatus;
  error?: string;
  confirmedFile?: FileSummary;
};

function getCreationErrorMessage(error: unknown): string {
  if (error instanceof TypeError) {
    return "No pudimos confirmar la respuesta del servidor. Conservamos el estado de este paso; vuelve a intentarlo cuando se recupere la conexión.";
  }
  if (error && typeof error === "object") {
    const apiError = error as { status?: number; code?: string; message?: string };
    if (apiError.status === 409 || apiError.code === "CONFLICT") {
      return "El servidor detectó un conflicto al crear el caso. Revisa los datos e inténtalo de nuevo.";
    }
    if (apiError.status === 400 || apiError.code === "VALIDATION_ERROR") {
      return apiError.message || "El servidor rechazó algunos datos. Revisa la información del estudio.";
    }
    if (apiError.status === 401 || apiError.code === "UNAUTHORIZED") {
      return "Tu sesión expiró. Inicia sesión de nuevo para continuar.";
    }
    if (apiError.status === 403 || apiError.code === "FORBIDDEN") {
      return "Tu cuenta no tiene permisos para crear casos.";
    }
    if (apiError.message) return apiError.message;
  }
  return "No fue posible crear el caso. Inténtalo nuevamente.";
}

export const CreateCasePage = () => {
  const navigate = useNavigate();
  const { isMock } = useAuth();
  const { caseId: routeCaseId } = useParams<{ caseId?: string }>();
  const [studyName, setStudyName] = React.useState("");
  const [reference, setReference] = React.useState("");
  const [institution, setInstitution] = React.useState("");
  const [date, setDate] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
  const today = getTodayInputValue();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [accepted, setAccepted] = React.useState(false);
  const [consentConfirmed, setConsentConfirmed] = React.useState(false);
  const [consentSaving, setConsentSaving] = React.useState(false);
  const [consentError, setConsentError] = React.useState("");
  const [creatingCase, setCreatingCase] = React.useState(false);
  const [creationError, setCreationError] = React.useState("");
  const [createdCase, setCreatedCase] = React.useState<Pick<CaseSummary, "id" | "referenceCode"> | null>(null);
  const [resuming, setResuming] = React.useState(Boolean(routeCaseId));
  const [resumeError, setResumeError] = React.useState("");
  const [resumeAttempt, setResumeAttempt] = React.useState(0);
  const [confirmedFilesUnavailable, setConfirmedFilesUnavailable] = React.useState(false);
  const [submissionSaving, setSubmissionSaving] = React.useState(false);
  const [submissionError, setSubmissionError] = React.useState("");
  const [submissionConfirmed, setSubmissionConfirmed] = React.useState(false);
  const submissionRequestInFlight = React.useRef(false);
  const creationAttempt = React.useRef<{ payload: string; key: string } | null>(null);
  const createRequestInFlight = React.useRef(false);
  const [uploadFiles, setUploadFiles] = React.useState<CaseUploadItem[]>([]);
  const [uploadingFiles, setUploadingFiles] = React.useState(false);
  const uploadRequestInFlight = React.useRef(false);
  const uploadIntents = React.useRef<Record<string, UploadIntent>>({});

  React.useEffect(() => {
    if (!routeCaseId) {
      setResuming(false);
      setResumeError("");
      return;
    }

    let active = true;
    setResuming(true);
    setResumeError("");
    uploadIntents.current = {};
    apiClient.patient.getCaseDetails(routeCaseId)
      .then((details) => {
        if (!active) return;
        setCreatedCase({ id: details.id, referenceCode: details.referenceCode });
        setStudyName(details.studyName);
        setReference(details.additionalReference ?? "");
        setInstitution(details.originInstitution ?? "");
        setDate(details.studyDate ?? "");
        setNotes(details.notes ?? "");
        try {
          sessionStorage.setItem(CASE_CREATION_SESSION_KEY, JSON.stringify({
            caseId: details.id,
            referenceCode: details.referenceCode,
          }));
        } catch {
          // The route itself retains the caseId if session storage is unavailable.
        }
        const consentIsComplete = details.status === "FILE_PENDING" || details.status === "CONFIRMATION_PENDING" || details.status === "FILES_RECEIVED";
        setConsentConfirmed(consentIsComplete);
        setAccepted(consentIsComplete);
        const isReviewPending = details.status === "CONFIRMATION_PENDING";
        const cachedFiles = readConfirmedFiles(details.id);
        const resumableFiles = details.status === "FILE_PENDING" || isReviewPending || details.status === "FILES_RECEIVED"
          ? cachedFiles
          : [];
        setUploadFiles(resumableFiles.map((file) => ({
          clientId: file.id,
          fileName: file.originalFilename,
          sizeBytes: file.sizeBytes,
          status: "confirmed" as const,
          confirmedFile: file,
        })));
        setConfirmedFilesUnavailable(isReviewPending && cachedFiles.length === 0);
        setSubmissionConfirmed(details.status === "FILES_RECEIVED");
        setCurrentStep(
          details.status === "CONSENT_PENDING" ? 2
            : details.status === "FILE_PENDING" ? 3
              : 4,
        );
      })
      .catch(() => {
        if (active) setResumeError("No se pudo recuperar el estado del caso. Reintenta para continuar.");
      })
      .finally(() => {
        if (active) setResuming(false);
      });

    return () => {
      active = false;
    };
  }, [routeCaseId, resumeAttempt]);

  const handleSubmitCase = async () => {
    if (submissionRequestInFlight.current || !createdCase?.id) return;
    submissionRequestInFlight.current = true;
    setSubmissionSaving(true);
    setSubmissionError("");
    try {
      await apiClient.patient.submitCase(createdCase.id);
      setSubmissionConfirmed(true);
    } catch (error) {
      const status = error && typeof error === "object"
        ? (error as { status?: number }).status
        : undefined;
      if (status === 409 || error instanceof TypeError) {
        try {
          const details = await apiClient.patient.getCaseDetails(createdCase.id);
          if (details.status === "FILES_RECEIVED") {
            setSubmissionConfirmed(true);
            return;
          }
        } catch {
          // The original submission error remains actionable; the user can retry.
        }
      }
      setSubmissionError(getCreationErrorMessage(error));
    } finally {
      submissionRequestInFlight.current = false;
      setSubmissionSaving(false);
    }
  };

  const continueAfterConsent = async () => {
    if (!accepted || consentSaving) return;
    if (consentConfirmed) {
      setCurrentStep(3);
      return;
    }
    if (!createdCase?.id) {
      setConsentError("No encontramos el identificador del caso. Vuelve a crear el caso para continuar.");
      return;
    }

    setConsentSaving(true);
    setConsentError("");
    try {
      await apiClient.patient.acceptConsent(createdCase.id, { termsVersion: CONSENT_TERMS_VERSION });
      setConsentConfirmed(true);
      setCurrentStep(3);
    } catch (error) {
      const status = error && typeof error === "object"
        ? (error as { status?: number }).status
        : undefined;
      if (status === 409 || error instanceof TypeError) {
        try {
          const details = await apiClient.patient.getCaseDetails(createdCase.id);
          if (details.status === "FILE_PENDING" || details.status === "CONFIRMATION_PENDING") {
            setConsentConfirmed(true);
            setCurrentStep(3);
            return;
          }
        } catch {
          // Keep the original error; the user can retry after the connection recovers.
        }
      }
      setConsentError(getCreationErrorMessage(error));
    } finally {
      setConsentSaving(false);
    }
  };

  const updateUploadFile = (clientId: string, update: Partial<CaseUploadItem>) => {
    setUploadFiles((current) => current.map((item) =>
      item.clientId === clientId ? { ...item, ...update } : item,
    ));
  };

  const uploadPendingFiles = async () => {
    if (uploadRequestInFlight.current || !createdCase?.id) return;
    const pending = uploadFiles.filter((item) => item.status === "pending" || item.status === "failed");
    if (pending.length === 0) return;

    uploadRequestInFlight.current = true;
    setUploadingFiles(true);
    try {
      for (const item of pending) {
        if (!item.file || item.sizeBytes <= 0) {
          updateUploadFile(item.clientId, {
            status: "failed",
            error: "El archivo debe tener un tamaño mayor que cero.",
          });
          continue;
        }
        updateUploadFile(item.clientId, { status: "uploading", error: undefined });
        try {
          const selectedFile = item.file;
          const completion = await uploadAndConfirmInputFile(
            selectedFile,
            () => apiClient.patient.createInputUpload(createdCase.id, {
              originalFilename: item.fileName,
              contentType: selectedFile.type || "application/octet-stream",
              sizeBytes: item.sizeBytes,
            }),
            uploadIntents.current[item.clientId],
            (intent) => {
              if (intent) uploadIntents.current[item.clientId] = intent;
              else delete uploadIntents.current[item.clientId];
            },
          );
          updateUploadFile(item.clientId, {
            status: "confirmed",
            confirmedFile: completion.file,
          });
          persistConfirmedFile(createdCase.id, completion.file);
        } catch (error) {
          updateUploadFile(item.clientId, {
            status: "failed",
            error: getCreationErrorMessage(error),
          });
          break;
        }
      }
    } finally {
      uploadRequestInFlight.current = false;
      setUploadingFiles(false);
    }
  };

  const goToConsent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (createRequestInFlight.current) return;
    const nextErrors: Record<string, string> = {};
    if (!studyName.trim()) nextErrors.studyName = "Escribe el nombre del estudio.";
    if (studyName.trim().length > 200) nextErrors.studyName = "El nombre admite máximo 200 caracteres.";
    if (reference.trim().length > 100) nextErrors.reference = "La referencia admite máximo 100 caracteres.";
    if (!institution.trim()) nextErrors.institution = "Escribe la institución o centro de origen.";
    if (institution.trim().length > 200) nextErrors.institution = "La institución admite máximo 200 caracteres.";
    if (!date) nextErrors.date = "Selecciona la fecha del estudio.";
    else if (date > today) nextErrors.date = "La fecha del estudio no puede ser posterior a hoy.";
    if (notes.length > 500) nextErrors.notes = "Las notas admiten máximo 500 caracteres.";
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    if (createdCase) {
      setCurrentStep(2);
      return;
    }

    const payload: CreateCaseRequest = {
      studyName: studyName.trim(),
      originInstitution: institution.trim(),
      studyDate: date,
      additionalReference: reference.trim() || null,
      notes: notes.trim() || null,
    };
    const serializedPayload = JSON.stringify(payload);
    if (!creationAttempt.current || creationAttempt.current.payload !== serializedPayload) {
      creationAttempt.current = { payload: serializedPayload, key: crypto.randomUUID() };
    }

    setCreatingCase(true);
    createRequestInFlight.current = true;
    setCreationError("");
    try {
      const created = await apiClient.patient.createCase(payload, creationAttempt.current.key);
      setCreatedCase(created);
      try {
        sessionStorage.setItem(CASE_CREATION_SESSION_KEY, JSON.stringify({
          caseId: created.id,
          referenceCode: created.referenceCode,
        }));
      } catch {
        // The in-memory caseId remains available for the next step in this session.
      }
      navigate(`/mis_casos/${created.id}/edit`);
    } catch (error) {
      setCreationError(getCreationErrorMessage(error));
    } finally {
      createRequestInFlight.current = false;
      setCreatingCase(false);
    }
  };

  return (
    <div className="space-y-4 pb-6">
      {!submissionConfirmed && <>
      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 lg:p-6">
        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-500 via-violet-500 to-sky-400" />
        <div className="pl-2">
          <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Crear nuevo caso
          </h1>
          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">Paso {currentStep} de 4</span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Cuéntanos sobre el estudio para iniciar el registro de tu caso.
          </p>
        </div>
      </section>
      <section
        aria-label="Progreso del caso"
        className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 lg:px-16"
      >
        <div className="relative grid grid-cols-4 gap-2">
          <div className="absolute left-[12.5%] right-[12.5%] top-4 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div
            className="absolute left-[12.5%] top-4 h-1 rounded-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${Math.min(75, currentStep * 25 - 12.5)}%` }}
          />
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const complete = stepNumber < currentStep;
            const active = stepNumber === currentStep;
            return (
              <div
                key={step}
                className="relative z-10 flex flex-col items-center gap-2 text-center"
              >
                <span
                  className={`grid h-8 w-8 place-items-center rounded-full text-sm font-semibold ${active || complete ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}
                >
                  {complete ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    stepNumber
                  )}
                </span>
                <span
                  className={`text-xs font-medium ${active ? "text-slate-800 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"}`}
                >
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </section>
      </>}
      {resuming ? (
        <Card className="p-8 text-center">
          <p role="status" className="text-sm text-slate-600 dark:text-slate-300">Recuperando el caso…</p>
        </Card>
      ) : resumeError ? (
        <Card className="space-y-4 p-6">
          <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{resumeError}</p>
          <div className="flex gap-2">
            <Button onClick={() => setResumeAttempt((attempt) => attempt + 1)}>Reintentar</Button>
            <Button variant="secondary" onClick={() => navigate("/mis_casos")}>Volver a mis casos</Button>
          </div>
        </Card>
      ) : submissionConfirmed ? (
        <SubmissionSuccess referenceCode={createdCase?.referenceCode ?? ""} onViewCases={() => navigate("/mis_casos")} />
      ) : currentStep === 1 ? (
        <section className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.75fr)]">
          <Card className="min-w-0 overflow-hidden rounded-2xl border-slate-200/80 shadow-md shadow-slate-200/40 dark:border-slate-700 dark:shadow-black/10">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5 dark:border-slate-800 lg:px-6">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
                <Stethoscope className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold tracking-tight">
                  Información del estudio
                </h2>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                  Completa los datos tal como aparecen en la orden médica.
                </p>
              </div>
              <span className="hidden text-xs text-slate-400 sm:block"><span className="text-rose-500">*</span> Campo obligatorio</span>
            </div>
            <form onSubmit={goToConsent} className="space-y-5 p-5 lg:p-6">
              <div className="grid gap-x-5 gap-y-5 md:grid-cols-2">
                <label className="grid content-start gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <span>Nombre del estudio <span className="text-rose-500">*</span></span>
                  <span className="relative block">
                    <Stethoscope
                      className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-500"
                      aria-hidden="true"
                    />
                    <input
                      required
                      disabled={Boolean(createdCase)}
                      maxLength={200}
                      aria-invalid={Boolean(formErrors.studyName)}
                      aria-describedby={formErrors.studyName ? "study-name-error" : undefined}
                      placeholder="Ej. Resonancia magnética de rodilla"
                      value={studyName}
                      onChange={(e) => setStudyName(e.target.value)}
                      className={`${inputClassName} pl-10`}
                    />
                  </span>
                  {formErrors.studyName && <span id="study-name-error" role="alert" className="block text-xs font-normal text-rose-600">{formErrors.studyName}</span>}
                </label>
                <label className="grid content-start gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <span>Referencia adicional <span className="text-xs font-normal text-slate-400">(opcional)</span></span>
                  <input
                    disabled={Boolean(createdCase)}
                    maxLength={100}
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    aria-invalid={Boolean(formErrors.reference)}
                    className={inputClassName}
                  />
                  {formErrors.reference && <span role="alert" className="block text-xs font-normal text-rose-600">{formErrors.reference}</span>}
                  <span className="text-xs font-normal leading-5 text-slate-500 dark:text-slate-400">Un código o nombre corto para reconocer el caso.</span>
                </label>
                <label className="grid content-start gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <span>Institución o centro de origen <span className="text-rose-500">*</span></span>
                  <input
                    required
                    disabled={Boolean(createdCase)}
                    maxLength={200}
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    aria-invalid={Boolean(formErrors.institution)}
                    className={inputClassName}
                  />
                  {formErrors.institution && <span role="alert" className="block text-xs font-normal text-rose-600">{formErrors.institution}</span>}
                  <span className="text-xs font-normal leading-5 text-slate-500 dark:text-slate-400">Hospital, clínica o centro donde se realizó el estudio.</span>
                </label>
                <label className="grid content-start gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <span>Fecha del estudio <span className="text-rose-500">*</span></span>
                  <span className="relative block">
                    <CalendarDays
                      className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                      aria-hidden="true"
                    />
                    <input
                      required
                      disabled={Boolean(createdCase)}
                      type="date"
                      max={today}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      aria-invalid={Boolean(formErrors.date)}
                      className={`${inputClassName} [color-scheme:light] pl-10 dark:[color-scheme:dark]`}
                    />
                  </span>
                  {formErrors.date && <span role="alert" className="block text-xs font-normal text-rose-600">{formErrors.date}</span>}
                  <span className="text-xs font-normal leading-5 text-slate-500 dark:text-slate-400">Usa la fecha en que te realizaron el estudio.</span>
                </label>
              </div>
              <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <span>Notas adicionales <span className="text-xs font-normal text-slate-400">(opcional)</span></span>
                <textarea
                  disabled={Boolean(createdCase)}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={500}
                  aria-invalid={Boolean(formErrors.notes)}
                  rows={3}
                  placeholder="Agrega contexto que pueda ayudar a identificar el estudio…"
                  className={`${inputClassName} h-24 resize-y py-3`}
                />
                {formErrors.notes && <span role="alert" className="block text-xs font-normal text-rose-600">{formErrors.notes}</span>}
                <span className="flex justify-between gap-3 text-xs font-normal text-slate-500 dark:text-slate-400">
                  <span>Evita incluir información que no sea relevante para el estudio.</span>
                  <span className="shrink-0 tabular-nums">{notes.length}/500</span>
                </span>
              </label>
              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500 dark:text-slate-400"><span className="text-rose-500">*</span> Información requerida para continuar</p>
                <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => navigate("/mis_casos")}
                >
                  Cancelar
                </Button>
                <Button type="submit" loading={creatingCase} className="min-w-36 shadow-md shadow-indigo-600/20">
                  {creatingCase ? "Creando caso..." : "Continuar"}{" "}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
                </div>
              </div>
              {creationError && (
                <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
                  {creationError}
                </p>
              )}
            </form>
          </Card>
          <Card className="p-5 lg:p-6">
            <div className="mb-6 flex h-24 items-center justify-center rounded-xl bg-indigo-50 text-indigo-300 dark:bg-indigo-950/40">
              <FileText className="h-14 w-14" aria-hidden="true" />
            </div>
            <div className="flex items-start gap-3">
              <Info
                className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600"
                aria-hidden="true"
              />
              <div>
                <h2 className="text-base font-semibold">Antes de continuar</h2>
                <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
                  Ten en cuenta las siguientes recomendaciones para un proceso
                  exitoso.
                </p>
              </div>
            </div>
            <div className="mt-6 space-y-5">
              <Tip icon={FileText} title="Escribe el nombre del estudio">
                Si tienes una orden médica, usa el nombre tal como aparece allí.
              </Tip>
              <Tip icon={CalendarDays} title="Revisa la información">
                Asegúrate de que la fecha y los datos del centro de origen sean
                correctos.
              </Tip>
              <Tip icon={CloudUpload} title="Ten listo tu archivo">
                En el siguiente paso podrás cargar las imágenes o documentos de
                tu estudio.
              </Tip>
            </div>
          </Card>
        </section>
      ) : currentStep === 2 ? (
        <ConsentStep
          accepted={accepted}
          setAccepted={setAccepted}
          consentConfirmed={consentConfirmed}
          saving={consentSaving}
          error={consentError}
          referenceCode={createdCase?.referenceCode ?? ""}
          studyName={studyName}
          institution={institution}
          date={date}
          onBack={() => setCurrentStep(1)}
          onContinue={continueAfterConsent}
        />
      ) : currentStep === 3 ? (
        <FileUploadStep
          caseId={createdCase?.id ?? ""}
          referenceCode={createdCase?.referenceCode ?? ""}
          studyName={studyName}
          files={uploadFiles}
          setFiles={setUploadFiles}
          uploading={uploadingFiles}
          isMock={isMock}
          filesUnavailable={confirmedFilesUnavailable}
          hasActiveIntent={(clientId) => Boolean(uploadIntents.current[clientId])}
          onUpload={uploadPendingFiles}
          onBack={() => setCurrentStep(2)}
          onContinue={() => setCurrentStep(4)}
        />
      ) : (
        <ConfirmationStep
          studyName={studyName}
          reference={reference}
          institution={institution}
          date={date}
          notes={notes}
          referenceCode={createdCase?.referenceCode ?? ""}
          uploadedFiles={uploadFiles.filter((item) => item.status === "confirmed")}
          filesUnavailable={confirmedFilesUnavailable}
          submitting={submissionSaving}
          error={submissionError}
          onBack={() => setCurrentStep(3)}
          onSubmit={handleSubmitCase}
        />
      )}
    </div>
  );
};

const ConsentStep = ({
  accepted,
  setAccepted,
  consentConfirmed,
  saving,
  error,
  referenceCode,
  studyName,
  institution,
  date,
  onBack,
  onContinue,
}: {
  accepted: boolean;
  setAccepted: (value: boolean) => void;
  consentConfirmed: boolean;
  saving: boolean;
  error: string;
  referenceCode: string;
  studyName: string;
  institution: string;
  date: string;
  onBack: () => void;
  onContinue: () => void | Promise<void>;
}) => (
  <section className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.75fr)]">
    <Card className="min-w-0 p-5 lg:p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">
          <FileText className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-semibold">Consentimiento informado</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Lee la información y confirma tu aceptación para continuar.
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-800 sm:grid-cols-2">
        <div>
          <p className="text-slate-500 dark:text-slate-400">
            Caso creado:
          </p>
          <p className="font-semibold">{referenceCode}</p>
        </div>
        <div className="border-slate-200 sm:border-l sm:pl-4 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400">
            Versión del documento:
          </p>
          <p className="font-semibold">{CONSENT_TERMS_VERSION}</p>
        </div>
      </div>
      <div className="mt-3 grid gap-3 rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700 sm:grid-cols-2">
        <SummaryItem label="Estudio" value={studyName} />
        <SummaryItem label="Institución de origen" value={institution} />
        <SummaryItem label="Fecha del estudio" value={new Date(`${date}T00:00:00`).toLocaleDateString("es-CO")} />
      </div>
      <div className="mt-3 space-y-3 rounded-lg border border-slate-200 p-3 text-sm leading-5 text-slate-600 dark:border-slate-700 dark:text-slate-300">
        <p>
          Autorizo a Healthdocs para el tratamiento de la información médica que
          cargue en esta plataforma, con el fin de gestionar el estudio de mi
          caso con fines de apoyo académico y diagnóstico, dentro del marco de
          la prestación de servicios de salud.
        </p>
        <p>
          La información será tratada de forma confidencial, de acuerdo con la
          normativa aplicable en materia de protección de datos personales y
          secreto médico.
        </p>
        <p>
          Declaro que he sido informado(a) de que el resultado del estudio podrá
          ser publicado en la plataforma cuando esté disponible.
        </p>
      </div>
      <div className="mt-3 flex gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
        <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
        <p>
          <strong>
            Este consentimiento no reemplaza la atención médica ni modifica el
            resultado del estudio.
          </strong>
          <br />
          Ante cualquier duda sobre tu situación de salud, consulta directamente
          con tu médico tratante.
        </p>
      </div>
      <label className="mt-4 flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
        <input
          type="checkbox"
          checked={accepted}
          disabled={consentConfirmed || saving}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
        He leído y acepto los términos del consentimiento informado para este
        caso.
      </label>
      {error && <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">{error}</p>}
      <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
        <Button variant="secondary" onClick={onBack}>
          Volver
        </Button>
        <Button disabled={!accepted || saving} loading={saving} onClick={onContinue}>
          {consentConfirmed ? "Continuar a la carga" : "Aceptar y continuar"}{" "}
          {!saving && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
        </Button>
      </div>
    </Card>
    <Card className="p-5 lg:p-6">
      <div className="mb-6 flex h-24 items-center justify-center rounded-xl bg-indigo-50 text-indigo-300 dark:bg-indigo-950/40">
        <FileText className="h-14 w-14" aria-hidden="true" />
      </div>
      <div className="flex items-start gap-3">
        <Info
          className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600"
          aria-hidden="true"
        />
        <div>
          <h2 className="text-base font-semibold">Puntos clave</h2>
          <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
            Ten en cuenta la siguiente información antes de aceptar el
            consentimiento.
          </p>
        </div>
      </div>
      <div className="mt-6 space-y-5">
        <Tip icon={FileText} title="Uso de la información">
          Los archivos que cargues serán utilizados únicamente dentro del
          proceso autorizado de estudio de tu caso.
        </Tip>
        <Tip icon={CalendarDays} title="Registro de aceptación">
          La fecha y hora de tu aceptación quedarán registradas en la
          plataforma.
        </Tip>
        <Tip icon={ShieldCheck} title="Próximo paso">
          Una vez que aceptes, podrás cargar las imágenes o documentos de tu
          estudio médico.
        </Tip>
      </div>
    </Card>
  </section>
);

const FileUploadStep = ({
  caseId,
  referenceCode,
  studyName,
  files,
  setFiles,
  uploading,
  isMock,
  filesUnavailable,
  hasActiveIntent,
  onUpload,
  onBack,
  onContinue,
}: {
  caseId: string;
  referenceCode: string;
  studyName: string;
  files: CaseUploadItem[];
  setFiles: React.Dispatch<React.SetStateAction<CaseUploadItem[]>>;
  uploading: boolean;
  isMock: boolean;
  filesUnavailable: boolean;
  hasActiveIntent: (clientId: string) => boolean;
  onUpload: () => void;
  onBack: () => void;
  onContinue: () => void;
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const addFiles = (selected: FileList | null) => {
    if (!selected) return;
    // Snapshot FileList before clearing the input; browsers may empty the live
    // FileList as soon as the input value is reset in onChange.
    const selectedFiles = Array.from(selected);
    if (selectedFiles.length === 0) return;
    setFiles((current) => [...current, ...selectedFiles.map((file) => ({
      clientId: crypto.randomUUID(),
      file,
      fileName: file.name,
      sizeBytes: file.size,
      status: "pending" as const,
      ...(file.size <= 0 ? { error: "El archivo debe tener un tamaño mayor que cero." } : {}),
    }))]);
  };
  const allConfirmed = files.length > 0 && files.every((item) => item.status === "confirmed");
  const hasPending = files.some((item) => item.status === "pending" || item.status === "failed");

  return (
    <section className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.75fr)]">
      <Card data-case-id={caseId} className="min-w-0 p-5 lg:p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-semibold">
              Cargar archivo del estudio
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Adjunta las imágenes o documentos solicitados para este caso.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-800 sm:grid-cols-2">
          <div>
            <p className="text-slate-500 dark:text-slate-400">
              Caso:
            </p>
            <p className="font-semibold">{referenceCode}</p>
          </div>
          <div className="border-slate-200 sm:border-l sm:pl-4 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400">
              Nombre del estudio:
            </p>
            <p className="font-semibold">{studyName}</p>
          </div>
        </div>
        <div
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            addFiles(event.dataTransfer.files);
          }}
          className={`mt-3 flex flex-col items-center justify-center rounded-xl border border-dashed px-4 py-6 text-center transition ${dragging ? "border-indigo-500 bg-indigo-100 dark:bg-indigo-900/40" : "border-indigo-300 bg-indigo-50/30 hover:bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40"}`}
        >
          <UploadCloud
            className={`h-10 w-10 ${dragging ? "text-indigo-700 dark:text-indigo-300" : "text-indigo-600"}`}
            aria-hidden="true"
          />
          <span className="mt-2 text-sm font-semibold">
            {dragging ? "Suelta tus archivos aquí" : "Arrastra y suelta tus archivos aquí"}
          </span>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            o selecciona archivos desde tu dispositivo
          </span>
          <Button className="mt-3" onClick={() => inputRef.current?.click()} disabled={uploading}>
            Seleccionar archivos
          </Button>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="sr-only"
            aria-label="Seleccionar archivos del estudio"
            disabled={uploading}
            onChange={(e) => {
              addFiles(e.target.files);
              e.currentTarget.value = "";
            }}
          />
        </div>
        <h3 className="mt-3 text-sm font-semibold">Archivos seleccionados ({files.length})</h3>
        <div className="mt-2 space-y-2">
          {files.length === 0 && <p className="rounded-lg border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">Aún no has agregado archivos. Selecciona uno o arrástralo al recuadro.</p>}
          {files.map((item) => (
            <div
              key={item.clientId}
              className="flex items-center gap-3 rounded-lg border border-slate-200 p-2 dark:border-slate-700"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-50 text-indigo-600 dark:bg-slate-800 dark:text-indigo-300">
                <FileText className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">{item.fileName}</p>
                <p className="text-xs text-slate-400">{formatFileSize(item.sizeBytes)}</p>
                {item.error && <p role="alert" className="mt-1 text-xs text-rose-600">{item.error}</p>}
              </div>
              <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${item.status === "confirmed" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" : item.status === "failed" ? "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300" : item.status === "uploading" ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
                {item.status === "confirmed" ? <Check className="h-3 w-3" aria-hidden="true" /> : item.status === "uploading" ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-r-transparent" /> : null}
                {item.status === "confirmed" ? "Confirmado" : item.status === "uploading" ? "Subiendo" : item.status === "failed" ? "Pendiente de reintento" : "Pendiente"}
              </span>
              {(item.status === "pending" || (item.status === "failed" && !hasActiveIntent(item.clientId))) && !uploading && (
                <button
                  type="button"
                  aria-label={`Eliminar ${item.fileName}`}
                  onClick={() => setFiles((current) => current.filter((entry) => entry.clientId !== item.clientId))}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
        </div>
        <p role="status" className={`mt-3 rounded-lg border p-3 text-xs ${isMock ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200" : "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"}`}>
          Modo activo: <strong>{isMock ? "Mock Dev" : "Backend API"}</strong>. {isMock
            ? <>La carga se procesa localmente y no llega al backend. Puedes cambiarlo desde el selector de modo de la barra superior.</>
            : <>Al pulsar «Subir y confirmar archivos», se enviará la carga al backend configurado.</>}
        </p>
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
          <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            <strong>
              Después de seleccionar archivos, pulsa «Subir y confirmar archivos» para iniciar la carga.
            </strong>
            <br />
            {files.filter((item) => item.status === "confirmed").length} de {files.length} archivos confirmados.
            {filesUnavailable && <><br />El backend confirma archivos previos, pero el detalle no incluye sus nombres.</>}
          </p>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="secondary" onClick={onBack}>
            Volver
          </Button>
          {allConfirmed ? (
            <Button onClick={onContinue}>Continuar <ArrowRight className="h-4 w-4" aria-hidden="true" /></Button>
          ) : (
            <Button disabled={!hasPending || uploading} loading={uploading} onClick={onUpload}>
              {uploading ? "Cargando archivos..." : files.some((item) => item.status === "failed") ? "Reintentar carga" : "Subir y confirmar archivos"}
              {!uploading && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
            </Button>
          )}
        </div>
      </Card>
      <Card className="p-5 lg:p-6">
        <div className="mb-6 flex h-24 items-center justify-center rounded-xl bg-indigo-50 text-indigo-300 dark:bg-indigo-950/40">
          <FileText className="h-14 w-14" aria-hidden="true" />
        </div>
        <div className="flex items-start gap-3">
          <Info
            className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600"
            aria-hidden="true"
          />
          <div>
            <h2 className="text-base font-semibold">
              Recomendaciones de carga
            </h2>
            <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
              Ten en cuenta las siguientes recomendaciones para un proceso
              exitoso.
            </p>
          </div>
        </div>
        <div className="mt-6 space-y-5">
          <Tip icon={FileText} title="Verifica la legibilidad">
            Asegúrate de que las imágenes o documentos sean claros y de buena
            calidad, sin cortes ni información borrosa.
          </Tip>
          <Tip icon={CalendarDays} title="Incluye todos los archivos">
            Carga el estudio principal y los documentos de soporte que apliquen.
          </Tip>
          <Tip icon={ShieldCheck} title="Protección de datos">
            Tus archivos serán tratados de forma confidencial y segura.
          </Tip>
        </div>
      </Card>
    </section>
  );
};

function formatFileSize(sizeBytes: number): string {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readConfirmedFiles(caseId: string): FileSummary[] {
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(`${CASE_CONFIRMED_FILES_KEY}${caseId}`) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is FileSummary =>
      item && typeof item.id === "string" && typeof item.originalFilename === "string"
      && typeof item.sizeBytes === "number" && item.fileKind === "INPUT",
    );
  } catch {
    return [];
  }
}

function persistConfirmedFile(caseId: string, file: FileSummary): void {
  try {
    const existing = readConfirmedFiles(caseId).filter((item) => item.id !== file.id);
    sessionStorage.setItem(`${CASE_CONFIRMED_FILES_KEY}${caseId}`, JSON.stringify([...existing, file]));
  } catch {
    // File metadata remains available in component state for this visit.
  }
}

const SubmissionSuccess = ({
  referenceCode,
  onViewCases,
}: {
  referenceCode: string;
  onViewCases: () => void;
}) => (
  <Card className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border-emerald-200/80 shadow-lg shadow-emerald-950/5 dark:border-emerald-900/70">
    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-6 py-9 text-center dark:from-emerald-950/40 dark:via-slate-900 dark:to-teal-950/30 sm:px-10 sm:py-12">
      <div aria-hidden="true" className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-emerald-200/30 blur-3xl dark:bg-emerald-500/10" />
      <span className="relative mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-700 ring-8 ring-white/70 dark:bg-emerald-900/70 dark:text-emerald-300 dark:ring-slate-800/70">
        <Check className="h-8 w-8" strokeWidth={2.5} aria-hidden="true" />
      </span>
      <p className="relative mt-5 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">Proceso completado</p>
      <h1 className="relative mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">¡Tu caso fue enviado!</h1>
      <p className="relative mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
        El backend confirmó la recepción. Ya puedes consultar el estado y seguir las actualizaciones desde Mis casos.
      </p>
    </div>
    <div className="flex flex-col gap-5 border-t border-slate-100 px-6 py-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-8">
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Código de seguimiento</p>
        <p className="mt-1 break-all font-semibold text-slate-900 dark:text-slate-100">{referenceCode}</p>
      </div>
      <Button className="shrink-0 shadow-md shadow-indigo-600/20" onClick={onViewCases}>
        Ir a mis casos <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  </Card>
);

const ConfirmationStep = ({
  studyName,
  reference,
  institution,
  date,
  notes,
  referenceCode,
  uploadedFiles,
  filesUnavailable,
  submitting,
  error,
  onBack,
  onSubmit,
}: {
  studyName: string;
  reference: string;
  institution: string;
  date: string;
  notes: string;
  referenceCode: string;
  uploadedFiles: CaseUploadItem[];
  filesUnavailable: boolean;
  submitting: boolean;
  error: string;
  onBack: () => void;
  onSubmit: () => void;
}) => (
  <section className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.75fr)]">
    <Card className="min-w-0 p-5 lg:p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">
          <FileText className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-semibold">Confirmación del caso</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Verifica los datos antes de finalizar el envío.
          </p>
        </div>
      </div>
      <div className="mt-5 flex items-center gap-4 rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
        <ShieldCheck className="h-8 w-8 text-indigo-600" aria-hidden="true" />
        <div className="flex-1">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Caso:
          </p>
          <p className="font-semibold">{referenceCode}</p>
        </div>
        <div className="hidden border-l border-slate-200 pl-4 sm:block dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400">Estado</p>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            <Check className="h-3 w-3" aria-hidden="true" />
            Listo para enviar
          </span>
        </div>
      </div>
      <Summary title="Información del estudio" icon={Stethoscope}>
        <div className="grid gap-3 sm:grid-cols-2">
          <SummaryItem label="Nombre del estudio" value={studyName} />
          <SummaryItem
            label="Nombre o referencia del estudio"
            value={reference}
          />
          <SummaryItem
            label="Institución o centro de origen"
            value={institution}
          />
          <SummaryItem
            label="Fecha del estudio"
            value={new Date(`${date}T00:00:00`).toLocaleDateString("es-CO")}
          />
          <SummaryItem label="Notas adicionales" value={notes} />
        </div>
      </Summary>
      <Summary title="Consentimiento" icon={FileText}>
        <div className="flex items-center gap-2 text-sm">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300">
            <Check className="h-4 w-4" aria-hidden="true" />
          </span>
          Consentimiento informado aceptado{" "}
          <span className="ml-auto text-xs text-slate-500">Versión 1.0</span>
        </div>
      </Summary>
      <Summary title={`Archivos adjuntos (${uploadedFiles.length})`} icon={Paperclip}>
        <div className="space-y-2">
          {uploadedFiles.map((item) => (
            <AttachedFile key={item.clientId} name={item.confirmedFile?.originalFilename ?? item.fileName} size={formatFileSize(item.confirmedFile?.sizeBytes ?? item.sizeBytes)} />
          ))}
          {filesUnavailable && <p className="text-sm text-amber-700 dark:text-amber-300">El detalle del backend no incluye los nombres de los archivos de este caso. El estado confirma que hay archivos recibidos; puedes enviar el caso o volver para agregar archivos.</p>}
        </div>
      </Summary>
      {error && <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">{error}</p>}
      <div className="mt-4 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
        <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
        <p>
          <strong>
            Al confirmar, tu caso será enviado para su procesamiento.
          </strong>
          <br />
          Podrás consultar el estado del caso desde tu panel de paciente en
          cualquier momento.
        </p>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="secondary" onClick={onBack}>
          Volver
        </Button>
        <Button loading={submitting} disabled={submitting} onClick={onSubmit}>
          <Send className="h-4 w-4" aria-hidden="true" />
          Confirmar y enviar{" "}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </Card>
    <Card className="p-5 lg:p-6">
      <div className="mb-6 flex h-24 items-center justify-center rounded-xl bg-indigo-50 text-indigo-300 dark:bg-indigo-950/40">
        <FileText className="h-14 w-14" aria-hidden="true" />
      </div>
      <h2 className="text-base font-semibold">Qué sucede después</h2>
      <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
        Una vez que confirmes el envío, tu caso será registrado en la plataforma
        y podrás hacer seguimiento desde tu panel.
      </p>
      <div className="mt-6 space-y-5">
        <Tip icon={FileText} title="Recepción del caso">
          Tu información y archivos serán registrados en la plataforma.
        </Tip>
        <Tip icon={BarChart3} title="Seguimiento del estado">
          Podrás consultar el avance del caso desde tu panel de paciente.
        </Tip>
        <Tip icon={Bell} title="Notificación de resultado">
          Recibirás un aviso cuando el resultado esté disponible.
        </Tip>
      </div>
    </Card>
  </section>
);

const Summary = ({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) => (
  <section className="mt-3 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
    <div className="mb-3 flex items-center gap-2">
      <Icon className="h-5 w-5 text-indigo-600" aria-hidden="true" />
      <h3 className="text-base font-semibold">{title}</h3>
    </div>
    {children}
  </section>
);
const SummaryItem = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    <p className="text-sm font-semibold">{value}</p>
  </div>
);
const AttachedFile = ({ name, size }: { name: string; size: string }) => (
  <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-2 dark:border-slate-700">
    <FileText className="h-5 w-5 text-indigo-600" aria-hidden="true" />
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium">{name}</p>
      <p className="text-xs text-slate-400">{size}</p>
    </div>
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
      <Check className="h-3 w-3" aria-hidden="true" />
      Cargado
    </span>
  </div>
);

const Tip = ({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="flex gap-3">
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">
      <Icon className="h-5 w-5" aria-hidden="true" />
    </span>
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
        {children}
      </p>
    </div>
  </div>
);
