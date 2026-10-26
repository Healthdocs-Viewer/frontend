import React from "react";
import { createPortal } from "react-dom";
import {
  ArrowDown, BarChart3, CalendarDays, CheckCircle2, Clock3, Download,
  FileArchive, FileText, GraduationCap, Info, RefreshCw, Settings, UserRound,
  MoreVertical, Pencil, Trash2, UploadCloud, X, TriangleAlert,
} from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { StudentAccessDrawer } from "../../components/cases/StudentAccessDrawer";
import { useParams } from "react-router-dom";
import { getCoordinatorAcademicCaseDetail, getCoordinatorInputChangeReviewForCase } from "../../services/academicCases";
import { apiClient } from "../../services/apiClient";
import { saveStudentAssignmentsForCase } from "../../services/academicStudents";
import type { CoordinatorAcademicCaseDetail, CoordinatorResultStatus } from "../../types/academicCases";
import type { PatientInputChangeRequest } from "../../types/patientCaseDetail";

type CaseFile = {
  name: string;
  date: string;
  size: string;
  kind: "archive" | "dicom" | "pdf";
};

type CaseResult = {
  id: string;
  fileName: string;
  type: string;
  uploadedAt: string;
  version: string;
  uploadedBy: string;
};

const formatDate = (value: string | null | undefined) => value
  ? new Intl.DateTimeFormat("es-CO", { dateStyle: "short", timeStyle: "short" }).format(new Date(value))
  : "—";
const formatSize = (bytes: number) => bytes >= 1024 * 1024
  ? `${(bytes / (1024 * 1024)).toFixed(bytes >= 100 * 1024 * 1024 ? 0 : 1)} MB`
  : `${Math.max(1, Math.round(bytes / 1024))} KB`;
const getFileKind = (filename: string): CaseFile["kind"] => {
  const extension = filename.split(".").pop()?.toLocaleLowerCase();
  return extension === "zip" ? "archive" : extension === "dcm" ? "dicom" : "pdf";
};
const resultStatusLabel: Record<CoordinatorResultStatus, string> = {
  UPLOADED: "Cargado", AVAILABLE: "Disponible", CORRECTION_REQUIRED: "Requiere corrección", DELETED: "Eliminado",
};
const getActionErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") return error.message;
  return "No se pudo completar la acción. Inténtalo de nuevo.";
};
const caseStatusLabel: Record<string, string> = {
  FILES_RECEIVED: "Archivos recibidos", ENABLED_FOR_PROCESSING: "En procesamiento",
  INPUT_CHANGE_DRAFT: "Cambio de archivos en borrador", INPUT_CHANGE_REVIEW: "Cambio de archivos en revisión",
  RESULT_UPLOADED: "Resultado cargado", RESULT_AVAILABLE: "Resultado disponible",
};
const toCaseResults = (detail: CoordinatorAcademicCaseDetail): CaseResult[] => detail.results.map((result) => ({
  id: result.id,
  fileName: result.file.originalFilename,
  type: result.file.extension?.toLocaleUpperCase() ?? result.file.contentType ?? "Archivo",
  uploadedAt: formatDate(result.uploadedAt),
  version: `v${result.version}`,
  uploadedBy: result.uploadedBy ? `${result.uploadedBy.fullName} · ${result.uploadedBy.studentCode}` : "—",
}));

type ResultMenuState = { resultId: string; top: number; left: number };

const getResultMenuPosition = (button: HTMLElement) => {
  const rect = button.getBoundingClientRect();
  const menuWidth = 176;
  const menuHeight = 88;
  const left = Math.min(window.innerWidth - menuWidth - 8, Math.max(8, rect.right - menuWidth));
  const top = rect.bottom + menuHeight + 8 > window.innerHeight
    ? Math.max(8, rect.top - menuHeight - 4)
    : rect.bottom + 4;
  return { top, left };
};

function SectionHeading({ icon: Icon, title, description }: {
  icon: typeof FileText;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-content">{title}</h2>
        <p className="text-sm leading-5 text-muted">{description}</p>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, children }: {
  icon: typeof UserRound;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[1.1rem_minmax(0,1fr)] items-center gap-x-3 gap-y-1 sm:grid-cols-[1.1rem_minmax(0,1fr)_auto]">
      <Icon className="h-4 w-4 text-muted" aria-hidden="true" />
      <span className="text-sm text-muted">{label}</span>
      <div className="col-start-2 text-sm font-medium text-content sm:col-start-3 sm:text-right">{children}</div>
    </div>
  );
}

function ResultEditDrawer({ open, result, caseId, onOpenChange, onSave }: {
  open: boolean;
  result: CaseResult | null;
  caseId: string;
  onOpenChange: (open: boolean) => void;
  onSave: (file: File) => void;
}) {
  const [replacement, setReplacement] = React.useState<File | null>(null);
  const [replacementError, setReplacementError] = React.useState("");
  const [isDragging, setIsDragging] = React.useState(false);
  const drawerRef = React.useRef<HTMLElement>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!open) return;
    setReplacement(null);
    setReplacementError("");
    setIsDragging(false);
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
      if (event.key !== "Tab") return;
      const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [open, onOpenChange]);

  if (!open || !result) return null;

  const selectReplacement = (file: File | null) => {
    if (!file) return;
    const allowed = /\.(pdf|mp4|dcm|zip)$/i.test(file.name);
    const error = !allowed
      ? "Formato no permitido. Selecciona un archivo PDF, MP4, DICOM o ZIP."
      : file.size === 0
        ? "El archivo está vacío. Selecciona otro archivo."
        : file.size > 100 * 1024 * 1024
          ? "El archivo supera el tamaño máximo de 100 MB."
          : "";
    setReplacementError(error);
    setReplacement(error ? null : file);
  };

  return createPortal(
    <div className="fixed inset-0 z-50" onMouseDown={(event) => { if (!drawerRef.current?.contains(event.target as Node)) onOpenChange(false); }}>
      <div className="absolute inset-0 bg-slate-950/40" aria-hidden="true" />
      <section ref={drawerRef} role="dialog" aria-modal="true" aria-labelledby="edit-result-title" aria-describedby="edit-result-description" className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-border bg-surface text-content shadow-xl">
        <header className="flex items-start justify-between gap-4 px-5 pb-4 pt-5">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><FileText className="h-5 w-5" aria-hidden="true" /></span>
            <div className="min-w-0"><h2 id="edit-result-title" className="text-base font-semibold leading-6">Reemplazar resultado</h2><p id="edit-result-description" className="text-sm leading-5 text-muted">Carga una nueva versión del resultado de este caso.</p></div>
          </div>
          <Button ref={closeButtonRef} variant="secondary" size="icon" onClick={() => onOpenChange(false)} aria-label="Cerrar panel" className="h-8 w-8 shrink-0"><X className="h-4 w-4" aria-hidden="true" /></Button>
        </header>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 pb-5 pt-2">
          <div className="space-y-4 rounded-xl border border-border bg-background/50 p-4">
            <div>
              <p className="text-xs font-medium text-muted">Caso académico</p>
              <p className="mt-1 break-words text-sm font-semibold text-content">{caseId}</p>
            </div>
            <div className="border-t border-border pt-4">
              <p className="text-xs font-medium text-muted">Resultado que vas a reemplazar</p>
              <div className="mt-2.5 flex min-w-0 items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="break-all text-sm font-semibold leading-5 text-content" title={result.fileName}>{result.fileName}</p>
                  <p className="mt-1 text-xs leading-5 text-muted">{result.type} · {result.id}</p>
                </div>
              </div>
            </div>
          </div>
          <div
            onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragging(false); }}
            onDrop={(event) => { event.preventDefault(); setIsDragging(false); if (event.dataTransfer.files.length > 1) { setReplacement(null); setReplacementError("Solo puedes cargar un archivo a la vez."); return; } selectReplacement(event.dataTransfer.files[0] ?? null); }}
            className={`flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed px-5 py-7 text-center transition-colors ${isDragging ? "border-primary bg-primary/10" : "border-primary/40 bg-primary/5 hover:bg-primary/10"}`}
          >
            <UploadCloud className="h-10 w-10 text-primary" aria-hidden="true" />
            <p className="mt-2 text-sm font-semibold text-content">Arrastra y suelta un archivo aquí</p>
            <p className="text-sm text-muted">o selecciónalo desde tu dispositivo</p>
            <label htmlFor="replacement-result-input" className="mt-3 cursor-pointer rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-strong">Seleccionar archivo</label>
            <p className="mt-3 text-xs text-muted">Formatos permitidos: PDF, MP4, DICOM, ZIP<br />Tamaño máximo por archivo: 100 MB</p>
            <input id="replacement-result-input" type="file" accept=".pdf,.mp4,.dcm,.zip" className="sr-only" aria-label={`Seleccionar reemplazo para ${result.id}`} onChange={(event) => { selectReplacement(event.target.files?.[0] ?? null); event.target.value = ""; }} />
          </div>
          {replacementError && <p role="alert" className="flex items-start gap-2 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger"><TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{replacementError}</p>}
          {replacement && <div className="flex items-center gap-3 rounded-lg border border-border px-3 py-2" aria-live="polite"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><FileText className="h-4 w-4" aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{replacement.name}</span><span className="block text-xs text-muted">{(replacement.size / (1024 * 1024)).toFixed(1)} MB</span></span><Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Quitar archivo seleccionado" onClick={() => { setReplacement(null); setReplacementError(""); }}><X className="h-4 w-4" aria-hidden="true" /></Button></div>}
        </div>

        <footer className="flex justify-end gap-2 border-t border-border bg-surface px-5 py-4"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button><Button onClick={() => replacement && onSave(replacement)} disabled={!replacement}>Cargar resultado</Button></footer>
      </section>
    </div>,
    document.body,
  );
}

export const CaseDetailPage: React.FC = () => {
  const [feedback, setFeedback] = React.useState("");
  const [sortAscending, setSortAscending] = React.useState(true);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [results, setResults] = React.useState<CaseResult[]>([]);
  const [openResultMenu, setOpenResultMenu] = React.useState<ResultMenuState | null>(null);
  const [resultAction, setResultAction] = React.useState<{ type: "edit" | "delete" | "correction"; resultId: string } | null>(null);
  const [correctionReason, setCorrectionReason] = React.useState("");
  const [resultActionLoading, setResultActionLoading] = React.useState(false);
  const [resultActionError, setResultActionError] = React.useState("");
  const { caseId } = useParams<{ caseId: string }>();
  const resolvedCaseId = caseId ?? "";
  const [caseDetail, setCaseDetail] = React.useState<CoordinatorAcademicCaseDetail | null>(null);
  const [caseLoadError, setCaseLoadError] = React.useState("");
  const [inputChangeReview, setInputChangeReview] = React.useState<PatientInputChangeRequest | null>(null);
  const [inputChangeReviewLoading, setInputChangeReviewLoading] = React.useState(false);
  const [inputChangeReviewError, setInputChangeReviewError] = React.useState("");
  const [reviewDecisionLoading, setReviewDecisionLoading] = React.useState(false);
  const [reviewDecisionError, setReviewDecisionError] = React.useState("");
  const [rejectionReason, setRejectionReason] = React.useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false);
  const [reviewFileLoadingId, setReviewFileLoadingId] = React.useState("");
  const [reviewFileError, setReviewFileError] = React.useState("");
  const [reviewFileLink, setReviewFileLink] = React.useState<{ url: string; name: string } | null>(null);
  const caseUuid = caseDetail?.case.id ?? "";
  const detailCase = caseDetail?.case;
  const caseFiles: CaseFile[] = (caseDetail?.inputFiles ?? []).map((file) => ({
    name: file.originalFilename, date: formatDate(file.uploadedAt), size: formatSize(file.sizeBytes), kind: getFileKind(file.originalFilename),
  }));
  const actionResult = results.find((result) => result.id === resultAction?.resultId);
  const sortedFiles = [...caseFiles].sort((a, b) => sortAscending ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));
  React.useEffect(() => {
    let active = true;
    setCaseLoadError("");
    setCaseDetail(null);
    getCoordinatorAcademicCaseDetail(resolvedCaseId)
      .then((detail) => {
        if (!active) return;
        setCaseDetail(detail);
        setResults(toCaseResults(detail));
      })
      .catch((error: unknown) => { if (active) setCaseLoadError(error instanceof Error ? error.message : "No se pudo cargar el caso."); });
    return () => { active = false; };
  }, [resolvedCaseId]);
  React.useEffect(() => {
    if (!caseDetail) return;
    if (caseDetail.case.status !== "INPUT_CHANGE_REVIEW") {
      setInputChangeReview(null);
      setInputChangeReviewError("");
      setInputChangeReviewLoading(false);
      return;
    }
    let active = true;
    setInputChangeReview(null);
    setInputChangeReviewError("");
    setInputChangeReviewLoading(true);
    getCoordinatorInputChangeReviewForCase(caseDetail.case.id)
      .then((request) => { if (active) setInputChangeReview(request); })
      .catch((error: unknown) => { if (active) setInputChangeReviewError(getActionErrorMessage(error)); })
      .finally(() => { if (active) setInputChangeReviewLoading(false); });
    return () => { active = false; };
  }, [caseDetail?.case.id, caseDetail?.case.status]);
  const closeResultAction = React.useCallback(() => setResultAction(null), []);
  const handleResultDrawerChange = React.useCallback((open: boolean) => {
    if (!open) closeResultAction();
  }, [closeResultAction]);
  const saveReplacement = (replacementFile: File) => {
    if (!resultAction) return;
    const uploadedAt = new Intl.DateTimeFormat("es-CO", {
      day: "numeric", month: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
    }).format(new Date());
    setResults((current) => current.map((result) => result.id === resultAction.resultId
      ? { ...result, fileName: replacementFile.name, uploadedAt, version: `v${(Number(result.version.slice(1)) + 1).toFixed(1)}` }
      : result));
    setFeedback(`Resultado ${actionResult?.id} reemplazado correctamente.`);
    closeResultAction();
  };
  const deleteResult = () => {
    if (!resultAction || !actionResult) return;
    setResults((current) => current.filter((result) => result.id !== resultAction.resultId));
    setFeedback(`Resultado ${actionResult.id} eliminado del caso ${resolvedCaseId}.`);
    closeResultAction();
  };
  const refreshCaseDetail = async () => {
    const detail = await getCoordinatorAcademicCaseDetail(caseUuid);
    setCaseDetail(detail);
    setResults(toCaseResults(detail));
    return detail;
  };
  const downloadReviewFile = async (fileId: string, filename: string) => {
    setReviewFileLoadingId(fileId);
    setReviewFileError("");
    setReviewFileLink(null);
    let downloadWindow: Window | null = null;
    try {
      if (!inputChangeReview) throw new Error("La solicitud ya no está disponible para revisión.");
      downloadWindow = window.open("about:blank", "_blank");
      const download = await apiClient.operations.createInputChangeReviewDownload(inputChangeReview.id, fileId);
      if (downloadWindow) {
        downloadWindow.location.replace(download.downloadUrl);
        downloadWindow.opener = null;
      } else {
        setReviewFileLink({ url: download.downloadUrl, name: filename });
      }
    } catch (error) {
      downloadWindow?.close();
      setReviewFileError(getActionErrorMessage(error));
    } finally {
      setReviewFileLoadingId("");
    }
  };
  const decideInputChangeRequest = async (decision: "approve" | "reject") => {
    if (!inputChangeReview || reviewDecisionLoading || (decision === "reject" && !rejectionReason.trim())) return;
    setReviewDecisionLoading(true);
    setReviewDecisionError("");
    setInputChangeReviewError("");
    setFeedback("");
    try {
      if (decision === "approve") {
        await apiClient.operations.approveInputChangeRequest(inputChangeReview.id);
      } else {
        await apiClient.operations.rejectInputChangeRequest(inputChangeReview.id, rejectionReason.trim());
      }
      const resumedStatus = inputChangeReview.resumeCaseStatus;
      setRejectDialogOpen(false);
      setRejectionReason("");
      setInputChangeReview(null);
      setFeedback(`Solicitud ${decision === "approve" ? "aprobada" : "rechazada"}. El caso volvió a ${caseStatusLabel[resumedStatus] ?? resumedStatus}.`);
      try {
        await refreshCaseDetail();
      } catch {
        setInputChangeReviewError("La decisión se registró, pero no se pudo actualizar el detalle. Recarga el caso para ver el estado y los archivos vigentes.");
      }
    } catch (error) {
      setReviewDecisionError(getActionErrorMessage(error));
    } finally {
      setReviewDecisionLoading(false);
    }
  };
  const publishResult = async (resultId: string) => {
    setResultActionLoading(true);
    setResultActionError("");
    setFeedback("Publicando resultado…");
    try {
      await apiClient.operations.publishAcademicCaseResult(resultId);
      await refreshCaseDetail();
      setFeedback("Resultado publicado y disponible para el paciente.");
      setOpenResultMenu(null);
    } catch (error) {
      setResultActionError(getActionErrorMessage(error));
    } finally {
      setResultActionLoading(false);
    }
  };
  const requestCorrection = async () => {
    if (!resultAction || !correctionReason.trim()) return;
    setResultActionLoading(true);
    setResultActionError("");
    setFeedback("");
    try {
      await apiClient.operations.requestAcademicResultCorrection(resultAction.resultId, correctionReason.trim());
      await refreshCaseDetail();
      setFeedback("Se solicitó la corrección del resultado.");
      setCorrectionReason("");
      closeResultAction();
    } catch (error) {
      setResultActionError(getActionErrorMessage(error));
    } finally {
      setResultActionLoading(false);
    }
  };

  if (!caseDetail) {
    return <Card><CardContent className="p-6 text-sm text-muted" role={caseLoadError ? "alert" : "status"}>
      {caseLoadError || `Cargando el caso ${resolvedCaseId}…`}
    </CardContent></Card>;
  }
  const statusLabel = caseStatusLabel[detailCase?.status ?? ""] ?? detailCase?.status ?? "Estado desconocido";
  const latestUpdate = detailCase?.updatedAt ?? detailCase?.createdAt;
  const mainResearcher = caseDetail.researchers[0];

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between lg:p-6">
          <div className="flex min-w-0 gap-4">
            <div className="w-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-content">{detailCase?.referenceCode}</h1>
              <p className="mt-1 text-sm leading-5 text-muted">{detailCase?.studyName} · Detalle y seguimiento del caso académico.</p>
            </div>
          </div>
          <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-3 lg:min-w-[610px] lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <div className="flex items-center gap-3 sm:border-r sm:border-border sm:pr-3">
              <CalendarDays className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div><p className="text-xs text-muted">Fecha de recepción</p><p className="mt-1 text-sm font-medium text-content">{formatDate(detailCase?.receivedAt ?? detailCase?.createdAt)}</p></div>
            </div>
            <div className="flex items-center gap-3 sm:border-r sm:border-border sm:pr-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-hidden="true" />
              <div><p className="text-xs text-muted">Estado</p><Badge variant={detailCase?.status === "RESULT_AVAILABLE" ? "success" : "neutral"} className="mt-1">{statusLabel}</Badge></div>
            </div>
            <div className="flex items-center gap-3">
              <Clock3 className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div><p className="text-xs text-muted">Última actualización</p><p className="mt-1 text-sm font-medium text-content">{formatDate(latestUpdate)}</p></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.85fr)_minmax(320px,1fr)]">
        <div className="min-w-0 space-y-5">
          <Card>
            <CardContent className="p-5">
              <SectionHeading icon={FileText} title="Archivos recibidos" description="Archivos enviados para el estudio de este caso." />
              <div className="mt-4 overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold text-muted dark:bg-slate-800">
                    <tr>
                      <th scope="col" className="px-4 py-3">Nombre</th>
                      <th scope="col" className="px-4 py-3">
                        <button type="button" onClick={() => setSortAscending((value) => !value)} className="inline-flex items-center gap-1 hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label={`Ordenar fecha ${sortAscending ? "descendente" : "ascendente"}`}>
                          Fecha <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </th>
                      <th scope="col" className="px-4 py-3">Tamaño</th>
                      <th scope="col" className="px-4 py-3">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedFiles.map((file) => {
                      const FileIcon = file.kind === "archive" ? FileArchive : FileText;
                      return (
                        <tr key={file.name} className="border-t border-slate-100 text-content dark:border-slate-700">
                          <td className="whitespace-nowrap px-4 py-2.5"><span className="inline-flex items-center gap-3"><FileIcon className={`h-5 w-5 ${file.kind === "pdf" ? "text-danger" : "text-muted"}`} aria-hidden="true" />{file.name}</span></td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-muted">{file.date}</td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-muted">{file.size}</td>
                          <td className="px-4 py-2.5"><Button size="sm" variant="outline" onClick={() => setFeedback(`Descarga preparada: ${file.name}`)}><Download className="h-4 w-4" aria-hidden="true" />Descargar</Button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {detailCase?.status === "INPUT_CHANGE_REVIEW" && <Card>
            <CardContent className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <SectionHeading icon={FileText} title="Solicitud de cambio de archivos" description="Revisa el motivo y compara los archivos vigentes con la propuesta del paciente." />
                <Badge variant="warning" className="whitespace-nowrap">Pendiente de revisión</Badge>
              </div>
              {inputChangeReviewLoading && <p role="status" className="mt-4 text-sm text-muted">Cargando la solicitud de cambio…</p>}
              {inputChangeReviewError && <p role="alert" className="mt-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{inputChangeReviewError}</p>}
              {!inputChangeReviewLoading && !inputChangeReviewError && !inputChangeReview && <p role="status" className="mt-4 text-sm text-muted">No se encontró una solicitud pendiente asociada a este caso.</p>}
              {reviewDecisionError && <p role="alert" className="mt-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{reviewDecisionError}</p>}
              {reviewFileError && <p role="alert" className="mt-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{reviewFileError}</p>}
              {reviewFileLink && <p className="mt-3 text-sm text-muted">La descarga no se abrió automáticamente. <a className="font-medium text-primary underline" href={reviewFileLink.url} target="_blank" rel="noopener noreferrer">Abrir {reviewFileLink.name}</a></p>}
              {inputChangeReview && <>
                <div className="mt-4 rounded-lg border border-border bg-background/50 p-4">
                  <div className="flex flex-wrap justify-between gap-2 text-xs text-muted"><span>Enviada {formatDate(inputChangeReview.submittedAt)}</span><span>Caso {detailCase.referenceCode}</span></div>
                  <p className="mt-3 text-xs font-medium text-muted">Motivo del cambio</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-content">{inputChangeReview.reason?.trim() || "El paciente no indicó un motivo."}</p>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <section className="rounded-lg border border-border p-4" aria-labelledby="original-input-files-title">
                    <div className="flex items-center justify-between gap-2"><h3 id="original-input-files-title" className="text-sm font-semibold text-content">Archivos vigentes</h3><span className="text-xs text-muted">{inputChangeReview.originalFiles.length}</span></div>
                    {inputChangeReview.originalFiles.length ? <ul className="mt-3 divide-y divide-border">{inputChangeReview.originalFiles.map((file) => <li key={file.id} className="flex min-w-0 items-center gap-2 py-2 first:pt-0 last:pb-0"><FileText className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" /><span className="min-w-0 flex-1 break-all text-sm text-content">{file.originalFilename}<span className="block text-xs text-muted">{file.sizeBytes == null ? "—" : formatSize(file.sizeBytes)}</span></span><Button size="sm" variant="outline" disabled={Boolean(reviewFileLoadingId)} onClick={() => void downloadReviewFile(file.id, file.originalFilename)} aria-label={`Descargar archivo original ${file.originalFilename}`}>{reviewFileLoadingId === file.id ? "Preparando…" : <><Download className="h-4 w-4" aria-hidden="true" />Descargar</>}</Button></li>)}</ul> : <p className="mt-3 text-sm text-muted">La solicitud no tiene archivos originales registrados.</p>}
                  </section>
                  <section className="rounded-lg border border-primary/30 bg-primary/5 p-4" aria-labelledby="proposed-input-files-title">
                    <div className="flex items-center justify-between gap-2"><h3 id="proposed-input-files-title" className="text-sm font-semibold text-content">Archivos propuestos</h3><span className="text-xs text-muted">{inputChangeReview.proposedFiles.length}</span></div>
                    {inputChangeReview.proposedFiles.length ? <ul className="mt-3 divide-y divide-border">{inputChangeReview.proposedFiles.map((file) => <li key={file.id} className="flex min-w-0 items-center gap-2 py-2 first:pt-0 last:pb-0"><FileText className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" /><span className="min-w-0 flex-1 break-all text-sm text-content">{file.originalFilename}<span className="block text-xs text-muted">{file.sizeBytes == null ? "—" : formatSize(file.sizeBytes)}</span></span><Button size="sm" variant="outline" disabled={Boolean(reviewFileLoadingId)} onClick={() => void downloadReviewFile(file.id, file.originalFilename)} aria-label={`Descargar archivo propuesto ${file.originalFilename}`}>{reviewFileLoadingId === file.id ? "Preparando…" : <><Download className="h-4 w-4" aria-hidden="true" />Descargar</>}</Button></li>)}</ul> : <p className="mt-3 text-sm text-muted">La propuesta no tiene archivos cargados.</p>}
                  </section>
                </div>
                {inputChangeReview.status === "PENDING_REVIEW" && <footer className="mt-5 flex flex-wrap justify-end gap-2 border-t border-border pt-4">
                  <Button variant="outline" disabled={reviewDecisionLoading} onClick={() => { setReviewDecisionError(""); setRejectionReason(""); setRejectDialogOpen(true); }}>Rechazar cambio</Button>
                  <Button disabled={reviewDecisionLoading} onClick={() => void decideInputChangeRequest("approve")}>{reviewDecisionLoading ? "Procesando…" : "Aprobar cambios"}</Button>
                </footer>}
              </>}
            </CardContent>
          </Card>}

          <Card>
            <CardContent className="p-5">
              <SectionHeading icon={BarChart3} title="Resultados del caso" description="Resultados generados y cargados para este caso." />
              <div className="mt-4 overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold text-muted dark:bg-slate-800">
                    <tr>
                      <th scope="col" className="px-4 py-3">Resultado</th>
                      <th scope="col" className="px-4 py-3">Tipo</th>
                      <th scope="col" className="px-4 py-3">Fecha de carga</th>
                      <th scope="col" className="px-4 py-3">Versión</th>
                      <th scope="col" className="px-4 py-3">Responsable</th>
                      <th scope="col" className="px-4 py-3">Estado</th>
                      <th scope="col" className="px-4 py-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result) => (
                      <tr key={result.id} className="border-t border-slate-100 text-content dark:border-slate-700">
                        <td className="whitespace-nowrap px-4 py-3"><span className="inline-flex items-center gap-3"><FileText className="h-5 w-5 text-muted" aria-hidden="true" /><span><span className="block">{result.id}</span><span className="block text-xs text-muted">{result.fileName}</span></span></span></td>
                        <td className="whitespace-nowrap px-4 py-3 text-muted">{result.type}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-muted">{result.uploadedAt}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-muted">{result.version}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-muted">{result.uploadedBy}</td>
                        <td className="px-4 py-3"><Badge variant={caseDetail.results.find((item) => item.id === result.id)?.status === "AVAILABLE" ? "success" : caseDetail.results.find((item) => item.id === result.id)?.status === "CORRECTION_REQUIRED" ? "warning" : "neutral"} className="whitespace-nowrap">{resultStatusLabel[caseDetail.results.find((item) => item.id === result.id)?.status ?? "UPLOADED"]}</Badge>
                          {caseDetail.results.find((item) => item.id === result.id)?.correctionRequest && <span className="mt-1 block max-w-52 text-xs text-muted">{caseDetail.results.find((item) => item.id === result.id)?.correctionRequest}</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="relative">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label={`Más acciones para ${result.id}`}
                              aria-expanded={openResultMenu?.resultId === result.id}
                              aria-controls={`result-actions-${result.id}`}
                              onClick={(event) => setOpenResultMenu((current) => current?.resultId === result.id ? null : { resultId: result.id, ...getResultMenuPosition(event.currentTarget) })}
                            ><MoreVertical className="h-4 w-4" aria-hidden="true" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {results.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-muted">Este caso no tiene resultados cargados.</td></tr>}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="min-w-0 space-y-5" aria-label="Información del caso">
          <Card>
            <CardContent className="p-5">
              <SectionHeading icon={GraduationCap} title="Gestión académica" description="Información de asignación y estado del procesamiento." />
              <div className="mt-4 space-y-4 rounded-lg border border-border bg-slate-50/70 p-4 dark:bg-slate-800/60">
                <div className="grid grid-cols-[1.1rem_minmax(0,1fr)] gap-x-3">
                  <UserRound className="mt-0.5 h-4 w-4 text-muted" aria-hidden="true" />
                  <div><p className="text-sm text-muted">Investigadores asignados</p>{caseDetail.researchers.length ? <ul className="mt-2 space-y-2">{caseDetail.researchers.map((researcher) => <li key={researcher.userId} className="text-sm font-medium text-content">{researcher.fullName ?? "Nombre no disponible"}<span className="block break-all text-xs font-normal text-muted">{researcher.email}</span></li>)}</ul> : <p className="mt-1 text-sm font-medium text-content">Sin investigadores asignados</p>}</div>
                </div>
                <DetailRow icon={CalendarDays} label="Fecha de asignación">{formatDate(mainResearcher?.assignedAt)}</DetailRow>
                <DetailRow icon={Settings} label="Estado del procesamiento"><Badge variant={detailCase?.status === "RESULT_AVAILABLE" ? "success" : "neutral"} className="whitespace-nowrap">{statusLabel}</Badge></DetailRow>
                <div className="border-t border-border pt-4">
                  <Button variant="outline" className="w-full border-primary/50 text-primary hover:bg-primary/5" onClick={() => setDrawerOpen(true)} disabled={!caseUuid}><RefreshCw className="h-4 w-4" aria-hidden="true" />Gestionar acceso</Button>
                  <p className="mt-2 text-xs leading-5 text-muted">Administra qué investigadores pueden acceder a este caso.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <SectionHeading icon={Info} title="Información del caso" description="Información complementaria del caso académico." />
              <div className="mt-4 space-y-4 rounded-lg border border-border bg-slate-50/70 p-4 dark:bg-slate-800/60">
                <DetailRow icon={FileText} label="Identificador">{detailCase?.referenceCode}</DetailRow>
                <DetailRow icon={GraduationCap} label="Estudio">{detailCase?.studyName ?? "—"}</DetailRow>
                {detailCase?.additionalReference && <DetailRow icon={FileText} label="Referencia adicional">{detailCase.additionalReference}</DetailRow>}
                {detailCase?.originInstitution && <DetailRow icon={UserRound} label="Institución de origen">{detailCase.originInstitution}</DetailRow>}
                {detailCase?.studyDate && <DetailRow icon={CalendarDays} label="Fecha del estudio">{formatDate(detailCase.studyDate)}</DetailRow>}
                <DetailRow icon={CalendarDays} label="Fecha de recepción">{formatDate(detailCase?.receivedAt ?? detailCase?.createdAt)}</DetailRow>
                <DetailRow icon={Clock3} label="Última actualización">{formatDate(latestUpdate)}</DetailRow>
                <DetailRow icon={CheckCircle2} label="Estado"><Badge variant={detailCase?.status === "RESULT_AVAILABLE" ? "success" : "neutral"} className="whitespace-nowrap">{statusLabel}</Badge></DetailRow>
                {detailCase?.notes && <div className="border-t border-border pt-3"><p className="text-xs text-muted">Notas</p><p className="mt-1 whitespace-pre-wrap text-sm text-content">{detailCase.notes}</p></div>}
              </div>
            </CardContent>
          </Card>

          {caseDetail.history.length > 0 && <Card>
            <CardContent className="p-5">
              <SectionHeading icon={Clock3} title="Historial" description="Actividad registrada para este caso." />
              <ol className="mt-4 space-y-4">
                {caseDetail.history.map((event, index) => <li key={`${event.type}-${event.occurredAt ?? index}-${event.relatedId ?? ""}`} className="flex gap-3 border-l border-border pl-4">
                  <div><p className="text-sm font-medium text-content">{event.description}</p><p className="mt-1 text-xs text-muted">{formatDate(event.occurredAt)}</p></div>
                </li>)}
              </ol>
            </CardContent>
          </Card>}
        </aside>
      </div>

      {feedback && <p role="status" aria-live="polite" className="rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary-strong">{feedback}</p>}
      {resultActionError && <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">{resultActionError}</p>}
      {openResultMenu && createPortal(
        <>
          <button type="button" aria-label="Cerrar menú de acciones" className="fixed inset-0 z-[60] cursor-default" onClick={() => setOpenResultMenu(null)} />
          <div id={`result-actions-${openResultMenu.resultId}`} className="fixed z-[61] w-52 rounded-lg border border-border bg-surface p-1 shadow-lg" style={{ top: openResultMenu.top, left: openResultMenu.left }}>
            {caseDetail.results.find((item) => item.id === openResultMenu.resultId)?.status === "UPLOADED" && <button type="button" disabled={resultActionLoading} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-content transition-colors hover:bg-background disabled:opacity-50" onClick={() => void publishResult(openResultMenu.resultId)}>
              <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />Publicar para paciente
            </button>}
            {caseDetail.results.find((item) => item.id === openResultMenu.resultId)?.status === "AVAILABLE" && <button type="button" disabled={resultActionLoading} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-content transition-colors hover:bg-background disabled:opacity-50" onClick={() => { setResultActionError(""); setCorrectionReason(""); setResultAction({ type: "correction", resultId: openResultMenu.resultId }); setOpenResultMenu(null); }}>
              <TriangleAlert className="h-4 w-4 text-warning" aria-hidden="true" />Solicitar corrección
            </button>}
            <button type="button" className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-content transition-colors hover:bg-background" onClick={() => { setOpenResultMenu(null); setResultAction({ type: "edit", resultId: openResultMenu.resultId }); }}>
              <Pencil className="h-4 w-4 text-muted" aria-hidden="true" />Editar resultado
            </button>
            <button type="button" className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-danger transition-colors hover:bg-danger/10" onClick={() => { setOpenResultMenu(null); setResultAction({ type: "delete", resultId: openResultMenu.resultId }); }}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />Eliminar resultado
            </button>
          </div>
        </>,
        document.body,
      )}
      <StudentAccessDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        caseId={detailCase?.referenceCode ?? resolvedCaseId}
        caseUuid={caseUuid}
        caseStatus={statusLabel}
        onSave={async (selectedIds) => {
          if (!caseUuid) throw new Error("No se pudo resolver el identificador del caso.");
          await saveStudentAssignmentsForCase(caseUuid, { researcherIds: selectedIds });
          await refreshCaseDetail();
          setFeedback(`Acceso de investigadores actualizado para ${detailCase?.referenceCode}.`);
        }}
      />
      {rejectDialogOpen && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !reviewDecisionLoading) setRejectDialogOpen(false); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="reject-input-change-title" className="w-full max-w-lg rounded-xl border border-border bg-surface p-5 text-content shadow-2xl">
          <h2 id="reject-input-change-title" className="text-base font-semibold">Rechazar solicitud de cambio</h2>
          <p className="mt-2 text-sm text-muted">Explica por qué no se aceptan los archivos propuestos. El paciente podrá consultar este motivo.</p>
          <label htmlFor="input-change-rejection-reason" className="mt-4 block text-sm font-medium">Motivo del rechazo</label>
          <textarea id="input-change-rejection-reason" rows={4} maxLength={1000} value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-content focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Describe qué debe corregir el paciente…" />
          {reviewDecisionError && <p role="alert" className="mt-2 text-sm text-danger">{reviewDecisionError}</p>}
          <footer className="mt-5 flex justify-end gap-2"><Button variant="outline" disabled={reviewDecisionLoading} onClick={() => setRejectDialogOpen(false)}>Cancelar</Button><Button className="bg-danger text-white hover:bg-danger/90" disabled={reviewDecisionLoading || !rejectionReason.trim()} onClick={() => void decideInputChangeRequest("reject")}>{reviewDecisionLoading ? "Enviando…" : "Confirmar rechazo"}</Button></footer>
        </section>
      </div>}
      <ResultEditDrawer
        open={resultAction?.type === "edit" && Boolean(actionResult)}
        result={actionResult ?? null}
        caseId={resolvedCaseId}
        onOpenChange={handleResultDrawerChange}
        onSave={saveReplacement}
      />
      {resultAction?.type === "delete" && actionResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) closeResultAction(); }}>
            <section role="alertdialog" aria-modal="true" aria-labelledby="delete-result-title" aria-describedby="delete-result-description" className="w-full max-w-md rounded-xl border border-border bg-surface p-5 text-content shadow-2xl">
              <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-danger/10 text-danger"><Trash2 className="h-5 w-5" aria-hidden="true" /></span><div><h2 id="delete-result-title" className="text-base font-semibold">Eliminar resultado</h2><p id="delete-result-description" className="mt-2 text-sm leading-5 text-muted">¿Seguro que quieres eliminar el resultado <strong className="font-semibold text-content">{actionResult.id}</strong> ({actionResult.fileName}) de este caso? Esta acción no se puede deshacer.</p></div></div>
              <footer className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={closeResultAction}>Cancelar</Button><Button onClick={deleteResult} className="bg-danger text-white hover:bg-danger/90">Eliminar resultado</Button></footer>
            </section>
        </div>
      )}
      {resultAction?.type === "correction" && actionResult && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !resultActionLoading) closeResultAction(); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="correction-title" className="w-full max-w-lg rounded-xl border border-border bg-surface p-5 text-content shadow-2xl">
          <h2 id="correction-title" className="text-base font-semibold">Solicitar corrección</h2>
          <p className="mt-2 text-sm text-muted">Indica qué debe corregir el investigador en {actionResult.fileName} ({actionResult.version}).</p>
          <label htmlFor="correction-reason" className="mt-4 block text-sm font-medium">Motivo de la corrección</label>
          <textarea id="correction-reason" rows={4} maxLength={2000} value={correctionReason} onChange={(event) => setCorrectionReason(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-content focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Describe los ajustes necesarios…" />
          {resultActionError && <p role="alert" className="mt-2 text-sm text-danger">{resultActionError}</p>}
          <footer className="mt-5 flex justify-end gap-2"><Button variant="outline" disabled={resultActionLoading} onClick={closeResultAction}>Cancelar</Button><Button disabled={resultActionLoading || !correctionReason.trim()} onClick={() => void requestCorrection()}>{resultActionLoading ? "Enviando…" : "Enviar solicitud"}</Button></footer>
        </section>
      </div>}
    </div>
  );
};

export const AcademicCaseDetailPage = CaseDetailPage;
