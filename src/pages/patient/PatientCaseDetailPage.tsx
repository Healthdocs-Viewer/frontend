import React from "react";
import { createPortal } from "react-dom";
import { useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  Calendar,
  Check,
  CheckCircle2,
  Clock3,
  Download,
  MoreHorizontal,
  Pencil,
  Trash2,
  Image,
  TriangleAlert,
  UploadCloud,
  X,
  FileArchive,
  FileCheck2,
  FileText,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import { cn } from "../../components/ui/cn";
import { IconButton } from "../../components/ui/IconButton";
import { getPatientCaseDetail } from "../../services/patientCaseDetail";
import { apiClient, isMockMode } from "../../services/apiClient";
import { uploadAndConfirmInputFile } from "../../services/inputFileUpload";
import type {
  PatientCaseDetailFile,
  PatientCaseDetailResponse,
  PatientCaseStatus,
} from "../../types/patientCaseDetail";
import type { UploadIntent } from "../../types/api";

type UploadedFile = PatientCaseDetailFile;

type FileMenuState = { fileId: string; top: number; left: number };

const getFileMenuPosition = (button: HTMLElement) => {
  const rect = button.getBoundingClientRect();
  const menuWidth = 160;
  const menuHeight = 88;
  const left = Math.min(
    window.innerWidth - menuWidth - 8,
    Math.max(8, rect.right - menuWidth),
  );
  const top =
    rect.bottom + menuHeight + 8 > window.innerHeight
      ? Math.max(8, rect.top - menuHeight - 4)
      : rect.bottom + 4;
  return { top, left };
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const MAX_REPLACEMENT_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_REPLACEMENT_FILE = /\.(pdf|jpe?g|png|dcm)$/i;

const validateReplacementFile = (file: File) => {
  if (file.size === 0) return "El archivo está vacío. Selecciona otro archivo.";
  if (!ALLOWED_REPLACEMENT_FILE.test(file.name)) {
    return "Formato no permitido. Selecciona un archivo PDF, JPG, PNG o DICOM.";
  }
  if (file.size > MAX_REPLACEMENT_FILE_SIZE) {
    return "El archivo supera el tamaño máximo de 50 MB.";
  }
  return "";
};

const getFileKind = (name: string): UploadedFile["kind"] => {
  const extension = name.split(".").pop()?.toLowerCase();
  if (["zip", "rar", "7z", "tar", "gz"].includes(extension ?? ""))
    return "archive";
  if (extension === "pdf") return "pdf";
  if (["jpg", "jpeg", "png"].includes(extension ?? "")) return "image";
  if (["dcm", "dicom"].includes(extension ?? "")) return "dicom";
  return "file";
};

export const PatientCaseDetailPage: React.FC = () => {
  const { caseId: caseReferenceCode = "" } = useParams<{ caseId: string }>();
  const [caseDetail, setCaseDetail] = React.useState<PatientCaseDetailResponse | null>(null);
  const [historyEvents, setHistoryEvents] = React.useState<PatientCaseDetailResponse["history"]>([]);
  const [caseLoading, setCaseLoading] = React.useState(true);
  const [caseError, setCaseError] = React.useState("");
  const [sortAscending, setSortAscending] = React.useState(true);
  const [fileFeedback, setFileFeedback] = React.useState("");
  const [openFileMenu, setOpenFileMenu] = React.useState<FileMenuState | null>(
    null,
  );
  const [files, setFiles] = React.useState<UploadedFile[]>([]);
  const [caseStatus, setCaseStatus] = React.useState<PatientCaseStatus>("FILES_RECEIVED");
  const [editingFileId, setEditingFileId] = React.useState<string | null>(null);
  const [isAddingFile, setIsAddingFile] = React.useState(false);
  const [deletingFileId, setDeletingFileId] = React.useState<string | null>(
    null,
  );
  const [downloadingFileId, setDownloadingFileId] = React.useState<string | null>(null);
  const [requestReason, setRequestReason] = React.useState("");
  const [inputChangeRequestId, setInputChangeRequestId] = React.useState<string | null>(null);
  const [resumeCaseStatus, setResumeCaseStatus] = React.useState<"FILES_RECEIVED" | "ENABLED_FOR_PROCESSING">("FILES_RECEIVED");
  const [requestBusy, setRequestBusy] = React.useState(false);
  const uploadIntents = React.useRef<Record<string, UploadIntent>>({});
  const [originalFiles, setOriginalFiles] = React.useState<UploadedFile[]>([]);
  const [isSubmitConfirmationOpen, setIsSubmitConfirmationOpen] = React.useState(false);
  const [isStartRequestConfirmationOpen, setIsStartRequestConfirmationOpen] = React.useState(false);
  const [isCancelRequestConfirmationOpen, setIsCancelRequestConfirmationOpen] = React.useState(false);
  const [isCoordinatorRejectionOpen, setIsCoordinatorRejectionOpen] = React.useState(false);
  const [coordinatorReason, setCoordinatorReason] = React.useState("");
  const applyCaseDetail = React.useCallback((response: PatientCaseDetailResponse) => {
    setCaseDetail(response);
    setHistoryEvents(response.history);
    setFiles(response.files);
    setCaseStatus(response.case.status);
    const activeRequest = response.inputChangeRequests.find(
      (request) => request.status === "DRAFT" || request.status === "PENDING_REVIEW",
    );
    setInputChangeRequestId(activeRequest?.id ?? null);
    setRequestReason(activeRequest?.reason ?? "");
    setResumeCaseStatus(activeRequest?.resumeCaseStatus
      ?? (response.case.status === "ENABLED_FOR_PROCESSING" ? "ENABLED_FOR_PROCESSING" : "FILES_RECEIVED"));
    if (activeRequest) {
      const fromRequestFiles = (requestFiles: typeof activeRequest.originalFiles) => requestFiles.map((file) => ({
        id: file.id,
        name: file.originalFilename,
        date: new Intl.DateTimeFormat("es-CO", { dateStyle: "short", timeStyle: "short" }).format(new Date(activeRequest.updatedAt)),
        sortDate: Date.parse(activeRequest.updatedAt),
        size: formatFileSize(file.sizeBytes ?? 0),
        kind: getFileKind(file.originalFilename),
      }));
      setOriginalFiles(fromRequestFiles(activeRequest.originalFiles));
      setFiles(fromRequestFiles(activeRequest.proposedFiles));
    } else {
      setOriginalFiles([]);
    }
  }, []);
  const refreshCaseDetail = React.useCallback(async () => {
    const response = await getPatientCaseDetail(caseReferenceCode);
    applyCaseDetail(response);
    return response;
  }, [applyCaseDetail, caseReferenceCode]);
  const handleDownloadInputFile = async (file: UploadedFile) => {
    if (!caseDetail?.case.id || downloadingFileId) return;
    const downloadWindow = window.open("about:blank", "_blank");
    if (downloadWindow) downloadWindow.opener = null;
    setDownloadingFileId(file.id);
    setFileFeedback(`Preparando la descarga de ${file.name}…`);
    try {
      const intent = await apiClient.patient.createInputDownload(caseDetail.case.id, file.id);
      if (downloadWindow) {
        downloadWindow.location.href = intent.downloadUrl;
      } else {
        window.location.assign(intent.downloadUrl);
      }
      setFileFeedback(`Descarga iniciada: ${file.name}`);
    } catch (error) {
      downloadWindow?.close();
      const message = error && typeof error === "object" && "message" in error
        ? String((error as { message: unknown }).message)
        : "No fue posible descargar el archivo. Inténtalo de nuevo.";
      setFileFeedback(message);
    } finally {
      setDownloadingFileId(null);
    }
  };
  React.useEffect(() => {
    let active = true;
    setCaseLoading(true);
    setCaseError("");
    getPatientCaseDetail(caseReferenceCode)
      .then((response) => {
        if (!active) return;
        applyCaseDetail(response);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setCaseError(error instanceof Error ? error.message : "No se pudo cargar el caso.");
      })
      .finally(() => {
        if (active) setCaseLoading(false);
      });
    return () => { active = false; };
  }, [applyCaseDetail, caseReferenceCode]);
  React.useEffect(() => {
    if (isMockMode() || caseStatus !== "INPUT_CHANGE_REVIEW") return;
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        void refreshCaseDetail().catch(() => {
          // La acción manual de actualización muestra el error y permite reintentar.
        });
      }
    };
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [caseStatus, refreshCaseDetail]);
  const handleFileDrawerChange = React.useCallback((open: boolean) => {
    if (!open) {
      setEditingFileId(null);
      setIsAddingFile(false);
    }
  }, []);
  const sortedFiles = [...files].sort((a, b) =>
    sortAscending ? a.sortDate - b.sortDate : b.sortDate - a.sortDate,
  );
  const editingFile = files.find((file) => file.id === editingFileId) ?? null;
  const deletingFile = files.find((file) => file.id === deletingFileId) ?? null;
  const canEditProposedFiles = caseStatus === "INPUT_CHANGE_DRAFT";
  const statusLabel = {
    CONSENT_PENDING: "Consentimiento pendiente",
    FILE_PENDING: "Archivo pendiente",
    CONFIRMATION_PENDING: "Pendiente de envío",
    FILES_RECEIVED: "Archivos recibidos",
    INPUT_CHANGE_DRAFT: "Editando solicitud de cambio",
    INPUT_CHANGE_REVIEW: "Solicitud en revisión",
    ENABLED_FOR_PROCESSING: "En proceso",
    RESULT_UPLOADED: "Resultado en revisión",
    RESULT_AVAILABLE: "Resultado disponible",
  }[caseStatus];

  const makeUploadedFile = (replacement: File): UploadedFile => {
    const now = new Date();
    return {
      id: `file-${crypto.randomUUID()}`,
      name: replacement.name,
      date: new Intl.DateTimeFormat("es-CO", {
        day: "numeric",
        month: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(now),
      sortDate: now.getTime(),
      size: formatFileSize(replacement.size),
      kind: getFileKind(replacement.name),
    };
  };

  const uploadProposedFile = async (selectedFile: File): Promise<UploadedFile> => {
    if (isMockMode() || !caseDetail || !inputChangeRequestId) return makeUploadedFile(selectedFile);
    const uploadKey = `${selectedFile.name}:${selectedFile.size}:${selectedFile.lastModified}`;
    const completion = await uploadAndConfirmInputFile(
      selectedFile,
      () => apiClient.patient.createInputChangeUpload(caseDetail.case.id, inputChangeRequestId, {
        originalFilename: selectedFile.name,
        contentType: selectedFile.type || "application/octet-stream",
        sizeBytes: selectedFile.size,
      }),
      uploadIntents.current[uploadKey],
      (intent) => {
        if (intent) uploadIntents.current[uploadKey] = intent;
        else delete uploadIntents.current[uploadKey];
      },
    );
    return {
      id: completion.file.id,
      name: completion.file.originalFilename,
      date: new Intl.DateTimeFormat("es-CO", { dateStyle: "short", timeStyle: "short" }).format(new Date()),
      sortDate: Date.now(),
      size: formatFileSize(completion.file.sizeBytes),
      kind: getFileKind(completion.file.originalFilename),
    };
  };

  const removeProposedFile = async (file: UploadedFile) => {
    if (!isMockMode() && caseDetail && inputChangeRequestId) {
      await apiClient.patient.removeInputChangeFile(caseDetail.case.id, inputChangeRequestId, file.id);
    }
    setFiles((current) => current.filter((item) => item.id !== file.id));
    setHistoryEvents((events) => [...events, {
      title: "Archivo retirado de la propuesta",
      detail: file.name,
      date: new Intl.DateTimeFormat("es-CO", { dateStyle: "short", timeStyle: "short" }).format(new Date()),
      state: "done",
    }]);
    setFileFeedback(`${file.name} se retiró de la propuesta.`);
  };

  const beginChangeRequest = async () => {
    if (requestBusy) return;
    setRequestBusy(true);
    try {
      if (!isMockMode() && caseDetail) {
        const request = await apiClient.patient.openInputChangeRequest(caseDetail.case.id);
        setInputChangeRequestId(request.id);
        setResumeCaseStatus(request.resumeCaseStatus);
        setRequestReason(request.reason ?? "");
        setOriginalFiles(files);
        setFiles(request.proposedFiles.map((file) => ({
          id: file.id,
          name: file.originalFilename,
          date: new Date().toLocaleDateString("es-CO"),
          sortDate: Date.now(),
          size: formatFileSize(file.sizeBytes ?? 0),
          kind: getFileKind(file.originalFilename),
        })));
      }
    setOriginalFiles(files);
    setRequestReason("");
    setCaseStatus("INPUT_CHANGE_DRAFT");
    setIsStartRequestConfirmationOpen(false);
    setHistoryEvents((events) => [...events, {
      title: "Solicitud de cambio iniciada",
      detail: "Se creó un borrador para actualizar los archivos del caso.",
      date: new Intl.DateTimeFormat("es-CO", { dateStyle: "short", timeStyle: "short" }).format(new Date()),
      state: "active",
    }]);
    setFileFeedback("Solicitud iniciada. Edita el conjunto de archivos y escribe el motivo del cambio.");
    } catch (error) {
      setFileFeedback(error instanceof Error ? error.message : "No se pudo iniciar la solicitud.");
    } finally {
      setRequestBusy(false);
    }
  };

  const submitChangeRequest = async () => {
    if (!requestReason.trim() || files.length === 0) return;
    if (requestBusy) return;
    setRequestBusy(true);
    try {
      if (!isMockMode() && caseDetail && inputChangeRequestId) {
        await apiClient.patient.updateInputChangeReason(caseDetail.case.id, inputChangeRequestId, requestReason.trim());
        await apiClient.patient.submitInputChangeRequest(caseDetail.case.id, inputChangeRequestId);
      }
    setCaseStatus("INPUT_CHANGE_REVIEW");
    setIsSubmitConfirmationOpen(false);
    setHistoryEvents((events) => [...events, {
      title: "Solicitud enviada a coordinación",
      detail: requestReason.trim(),
      date: new Intl.DateTimeFormat("es-CO", { dateStyle: "short", timeStyle: "short" }).format(new Date()),
      state: "active",
    }]);
    setFileFeedback("Solicitud enviada a coordinación. Los archivos quedaron bloqueados para revisión.");
    } catch (error) {
      setFileFeedback(error instanceof Error ? error.message : "No se pudo enviar la solicitud.");
    } finally {
      setRequestBusy(false);
    }
  };

  const cancelChangeRequest = async () => {
    if (requestBusy) return;
    setRequestBusy(true);
    try {
      if (!isMockMode() && caseDetail && inputChangeRequestId) {
        await apiClient.patient.cancelInputChangeRequest(caseDetail.case.id, inputChangeRequestId);
        setIsCancelRequestConfirmationOpen(false);
        try {
          await refreshCaseDetail();
          setFileFeedback("Borrador cancelado. Los archivos vigentes y el estado del caso se actualizaron desde el servidor.");
        } catch {
          setFileFeedback("El borrador se canceló, pero no se pudo actualizar el detalle. Intenta recargar el caso.");
        }
        return;
      }
    setFiles(originalFiles);
    setCaseStatus(resumeCaseStatus);
    setRequestReason("");
    setIsCancelRequestConfirmationOpen(false);
    setHistoryEvents((events) => [...events, {
      title: "Borrador cancelado",
      detail: "La solicitud se canceló y se conservaron los archivos vigentes.",
      date: new Intl.DateTimeFormat("es-CO", { dateStyle: "short", timeStyle: "short" }).format(new Date()),
      state: "done",
    }]);
    setFileFeedback("Borrador cancelado. Los archivos vigentes del caso siguen sin cambios.");
    setInputChangeRequestId(null);
    } catch (error) {
      setFileFeedback(error instanceof Error ? error.message : (error as { message?: string })?.message ?? "No se pudo cancelar el borrador.");
    } finally {
      setRequestBusy(false);
    }
  };

  const approveChangeRequest = () => {
    setCaseStatus("FILES_RECEIVED");
    setOriginalFiles(files);
    setHistoryEvents((events) => [...events, {
      title: "Solicitud aprobada",
      detail: "Coordinación aprobó el conjunto propuesto; ahora está vigente.",
      date: new Intl.DateTimeFormat("es-CO", { dateStyle: "short", timeStyle: "short" }).format(new Date()),
      state: "done",
    }]);
    setRequestReason("");
    setFileFeedback("Simulación: coordinación aprobó el cambio. El conjunto propuesto ahora está vigente.");
  };

  const rejectChangeRequest = () => {
    if (!coordinatorReason.trim()) return;
    setFiles(originalFiles);
    setCaseStatus("FILES_RECEIVED");
    setHistoryEvents((events) => [...events, {
      title: "Solicitud rechazada",
      detail: coordinatorReason.trim(),
      date: new Intl.DateTimeFormat("es-CO", { dateStyle: "short", timeStyle: "short" }).format(new Date()),
      state: "done",
    }]);
    setRequestReason("");
    setIsCoordinatorRejectionOpen(false);
    setFileFeedback(`Simulación: coordinación rechazó el cambio. Motivo: ${coordinatorReason.trim()}`);
    setCoordinatorReason("");
  };

  if (caseLoading) return <p className="p-6 text-sm text-muted">Cargando detalle del caso…</p>;
  if (caseError || !caseDetail) return <p role="alert" className="p-6 text-sm text-danger">{caseError || "No se encontró el caso solicitado."}</p>;
  const { steps, consent, result } = caseDetail;
  const resultFiles = (result.files ?? []).slice(0, 5);
  const hasResult = caseStatus === "RESULT_UPLOADED"
    || caseStatus === "RESULT_AVAILABLE"
    || resultFiles.length > 0;
  const canRequestInputChange = !hasResult
    && (caseStatus === "FILES_RECEIVED" || caseStatus === "ENABLED_FOR_PROCESSING");
  const displaySteps = steps.map((step, index) => {
    if (index === 2) return {
      ...step,
      title: "Solicitud de cambio",
      detail: canRequestInputChange ? "Puedes iniciar una solicitud." : "Edición de archivos y motivo.",
      state: caseStatus === "INPUT_CHANGE_DRAFT" ? "active" as const : caseStatus === "INPUT_CHANGE_REVIEW" ? "done" as const : "pending" as const,
    };
    if (index === 3) return {
      ...step,
      title: "Revisión de coordinación",
      detail: caseStatus === "INPUT_CHANGE_REVIEW" ? "Esperando decisión." : caseStatus === "RESULT_AVAILABLE" ? "Revisión completada." : "Se revisará al enviar la solicitud.",
      state: caseStatus === "INPUT_CHANGE_REVIEW" ? "active" as const : caseStatus === "RESULT_AVAILABLE" ? "done" as const : "pending" as const,
    };
    if (index === 4 && caseStatus === "RESULT_AVAILABLE") return {
      ...step,
      detail: "El resultado está disponible.",
      state: "done" as const,
    };
    return step;
  });

  return (
    <>
      <div className="space-y-4 pb-6">
        <Card className="overflow-hidden bg-gradient-to-r from-surface via-surface to-primary/10">
          <CardContent className="flex flex-wrap items-center gap-4 p-5 sm:p-6">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <FileText className="h-7 w-7" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Caso
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-content">
                  {caseDetail.case.referenceCode}
                </h1>
                <Badge
                  variant="neutral"
                  className="border-0 bg-info/10 text-info"
                >
                  <span className="mr-1.5 h-2.5 w-2.5 rounded-full border-2 border-info" />
                  {statusLabel}
                </Badge>
              </div>
              <p className="font-medium text-content">{caseDetail.case.studyName}</p>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                <Calendar className="h-3.5 w-3.5" />
                <span>Creado el {formatDateTime(caseDetail.case.createdAt)}</span>
                <span className="hidden text-border sm:inline" aria-hidden="true">·</span>
                <span>Actualizado el {formatDateTime(caseDetail.case.updatedAt)}</span>
              </p>
              <p className="mt-1 text-xs text-muted">
                {canRequestInputChange
                  ? caseStatus === "ENABLED_FOR_PROCESSING"
                    ? "El caso está en proceso y no tiene resultado. Puedes solicitar un cambio de archivos a coordinación."
                    : "Tus archivos están recibidos y bloqueados. Si necesitas cambiarlos, inicia una solicitud para coordinación."
                  : caseStatus === "INPUT_CHANGE_DRAFT"
                    ? "Estás preparando una propuesta. Los archivos vigentes no cambiarán hasta que coordinación la apruebe."
                    : caseStatus === "INPUT_CHANGE_REVIEW"
                      ? "La solicitud fue enviada y los archivos están bloqueados mientras coordinación la revisa."
                      : caseStatus === "CONFIRMATION_PENDING"
                        ? "Revisa los archivos de tu estudio antes de confirmar el envío a coordinación."
                        : caseStatus === "FILE_PENDING"
                          ? "El caso necesita al menos un archivo de estudio para continuar."
                          : caseStatus === "RESULT_AVAILABLE"
                            ? "El resultado de tu estudio ya está disponible para consulta y descarga."
                            : "El caso continúa su flujo de revisión."}
              </p>
            </div>
            <div className="hidden h-24 w-40 items-center justify-center rounded-full bg-primary/10 text-primary/30 md:flex">
              <FileCheck2 className="h-16 w-16" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div className="grid min-w-[960px] grid-cols-5 gap-4 p-5 xl:min-w-0">
                {displaySteps.map(({ title, detail, state }, index) => (
                  <div key={title} className="relative min-w-0">
                    {index < displaySteps.length - 1 && (
                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute left-3.5 right-[-1rem] top-3.5 h-0.5",
                          state === "done" ? "bg-success" : "bg-border",
                        )}
                      />
                    )}
                    <span
                      className={cn(
                        "relative z-10 grid h-7 w-7 place-items-center rounded-full border-2 bg-surface",
                        state === "done" && "border-success bg-success text-white",
                        state === "active" &&
                          "border-primary bg-primary text-white shadow-[0_0_0_5px_hsl(var(--color-background))]",
                        state === "pending" &&
                          "border-border text-muted",
                      )}
                    >
                      {state === "done" ? (
                        <Check className="h-4 w-4" />
                      ) : state === "active" ? (
                        <span className="h-2 w-2 rounded-full bg-white" />
                      ) : null}
                    </span>
                    <div className="mt-3 pr-2">
                      <strong
                        className={cn(
                          "block text-xs leading-5",
                          state === "active" ? "text-primary" : "text-content",
                        )}
                      >
                        {title}
                      </strong>
                      <span className="mt-1 block text-xs leading-4 text-muted">
                        {detail}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
          <div className="space-y-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <FileText
                    className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-content">
                      Archivos cargados
                    </h2>
                    <p className="text-sm leading-5 text-muted">
                      {canEditProposedFiles
                        ? "Conjunto propuesto de la solicitud. Los archivos vigentes siguen intactos hasta la aprobación."
                        : caseStatus === "INPUT_CHANGE_REVIEW"
                          ? "Propuesta bloqueada mientras coordinación revisa los cambios."
                          : "Archivos vigentes enviados para el estudio de este caso."}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-muted">
                    {caseStatus === "INPUT_CHANGE_DRAFT"
                      ? `${originalFiles.length} vigentes · ${files.length} en la propuesta`
                      : caseStatus === "INPUT_CHANGE_REVIEW"
                        ? "Propuesta bloqueada, pendiente de coordinación"
                        : "Conjunto vigente del caso"}
                  </p>
                  {canRequestInputChange && (
                    <Button onClick={() => setIsStartRequestConfirmationOpen(true)}>
                      Solicitar cambio
                    </Button>
                  )}
                  {canEditProposedFiles && (
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => setIsCancelRequestConfirmationOpen(true)}>
                        Cancelar borrador
                      </Button>
                      <Button
                        onClick={() => setIsSubmitConfirmationOpen(true)}
                        disabled={!requestReason.trim() || files.length === 0}
                      >
                        Confirmar cambios y enviar
                      </Button>
                    </div>
                  )}
                  {caseStatus === "INPUT_CHANGE_REVIEW" && (
                    <Badge variant="neutral" className="bg-warning/10 text-warning">
                      En revisión
                    </Badge>
                  )}
                </div>
                {canEditProposedFiles && (
                  <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <label htmlFor="change-request-reason" className="block text-sm font-semibold text-content">
                      Motivo del cambio
                    </label>
                    <p className="mt-1 text-xs text-muted">
                      Explica brevemente qué necesitas actualizar. Coordinación revisará esta solicitud antes de aplicar los cambios.
                    </p>
                    <textarea
                      id="change-request-reason"
                      value={requestReason}
                      onChange={(event) => setRequestReason(event.target.value.slice(0, 250))}
                      maxLength={250}
                      rows={2}
                      className="mt-3 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-content focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Ej.: Adjunto las imágenes completas del estudio."
                    />
                    <p className="mt-1 text-right text-xs text-muted">{requestReason.length}/250</p>
                    <div className="mt-3">
                      <Button variant="outline" onClick={() => setIsAddingFile(true)}>
                        <UploadCloud className="h-4 w-4" aria-hidden="true" />
                        Añadir archivos
                      </Button>
                    </div>
                  </div>
                )}
                {caseStatus === "INPUT_CHANGE_REVIEW" && (
                  <div className="mt-4 rounded-lg border border-info/20 bg-info/5 p-4">
                    <p className="text-sm font-semibold text-content">Esperando revisión de coordinación</p>
                    <p className="mt-1 text-xs text-muted">La propuesta no se puede modificar mientras está en revisión.</p>
                    {isMockMode() ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" onClick={approveChangeRequest}>Simular aprobación</Button>
                        <Button size="sm" variant="outline" onClick={() => setIsCoordinatorRejectionOpen(true)}>Simular rechazo</Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3"
                        disabled={requestBusy}
                        onClick={async () => {
                          try {
                            await refreshCaseDetail();
                            setFileFeedback("Estado del caso actualizado desde el servidor.");
                          } catch (error) {
                            setFileFeedback(error instanceof Error ? error.message : "No se pudo actualizar el estado del caso.");
                          }
                        }}
                      >
                        Actualizar estado
                      </Button>
                    )}
                  </div>
                )}
                <div className="mt-4 overflow-x-auto rounded-lg border border-border">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead className="bg-background text-xs font-semibold text-muted">
                      <tr>
                        <th scope="col" className="px-4 py-3">
                          Nombre
                        </th>
                        <th scope="col" className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => setSortAscending((value) => !value)}
                            className="inline-flex items-center gap-1 hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            aria-label={`Ordenar fecha ${sortAscending ? "descendente" : "ascendente"}`}
                          >
                            Fecha{" "}
                            <ArrowDown
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                          </button>
                        </th>
                        <th scope="col" className="px-4 py-3">
                          Tamaño
                        </th>
                        <th scope="col" className="px-4 py-3">
                          Acción
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedFiles.map((file) => {
                        const FileIcon =
                          file.kind === "archive"
                            ? FileArchive
                            : file.kind === "image"
                              ? Image
                              : FileText;
                        return (
                          <tr
                            key={file.id}
                            className="border-t border-border text-content"
                          >
                            <td className="whitespace-nowrap px-4 py-2.5">
                              <span className="inline-flex items-center gap-3">
                                <FileIcon
                                  className={`h-5 w-5 ${file.kind === "pdf" ? "text-danger" : "text-muted"}`}
                                  aria-hidden="true"
                                />
                                {file.name}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-4 py-2.5 text-muted">
                              {file.date}
                            </td>
                            <td className="whitespace-nowrap px-4 py-2.5 text-muted">
                              {file.size}
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={downloadingFileId !== null}
                                  loading={downloadingFileId === file.id}
                                  onClick={() => void handleDownloadInputFile(file)}
                                >
                                  <Download
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                  />
                                  Descargar
                                </Button>
                                {canEditProposedFiles && <div className="relative">
                                  <IconButton
                                    icon={MoreHorizontal}
                                    label={`Más acciones para ${file.name}`}
                                    variant="ghost"
                                    className="h-8 w-8"
                                    aria-expanded={
                                      openFileMenu?.fileId === file.id
                                    }
                                    aria-controls={`file-actions-${file.id}`}
                                    onClick={(event) => {
                                      const position = getFileMenuPosition(
                                        event.currentTarget,
                                      );
                                      setOpenFileMenu((current) =>
                                        current?.fileId === file.id
                                          ? null
                                          : { fileId: file.id, ...position },
                                      );
                                    }}
                                  />
                                </div>}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {fileFeedback && (
                  <p
                    role="status"
                    className="mt-3 rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary-strong"
                  >
                    {fileFeedback}
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <FileCheck2 className="h-5 w-5 text-primary" />
                  Resultado del estudio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3 rounded-lg bg-primary/10 p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface text-primary">
                    <FileCheck2 className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <strong className="block text-sm text-content">
                      {result.status}
                    </strong>
                    <p className="mt-1 text-xs leading-5 text-muted">
                      {result.description}
                    </p>
                  </div>
                  {resultFiles.length > 0 && (
                    <Badge variant="neutral" className="shrink-0">
                      {resultFiles.length} de 5
                    </Badge>
                  )}
                </div>
                {resultFiles.length > 0 ? (
                  <ul className="mt-4 space-y-2" aria-label="Archivos del resultado">
                    {resultFiles.map((resultFile) => (
                      <li key={resultFile.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3 sm:flex-nowrap">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-background text-primary">
                          <FileText className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-content" title={resultFile.name}>
                            {resultFile.label}
                          </p>
                          <p className="truncate text-xs text-muted" title={resultFile.name}>
                            {resultFile.name}
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            {resultFile.date} · {resultFile.size}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full shrink-0 sm:w-auto"
                          onClick={() => setFileFeedback(`Descarga preparada: ${resultFile.name}`)}
                        >
                          <Download className="h-4 w-4" aria-hidden="true" />
                          Descargar
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-4 rounded-lg border border-dashed border-border bg-background/50 px-4 py-6 text-center">
                    <Clock3 className="mx-auto h-6 w-6 text-muted" aria-hidden="true" />
                    <p className="mt-2 text-sm font-medium text-content">Aún no hay resultados disponibles</p>
                    <p className="mt-1 text-xs text-muted">Cuando coordinación publique el resultado, podrás descargar aquí hasta cinco archivos.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <aside className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Consentimiento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-success/30 bg-success/10 p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-success text-white">
                      <Check className="h-6 w-6" />
                    </span>
                    <div className="min-w-0">
                      <strong className="block text-sm font-semibold text-content">
                        {consent.status}
                      </strong>
                      <span className="block text-xs text-muted">
                        Versión de términos {consent.termsVersion}
                      </span>
                      <span className="block text-xs text-muted">
                        Aceptado el {consent.acceptedAt}
                      </span>
                    </div>
                  </div>
                  <p className="mt-4 text-xs leading-5 text-muted">
                    {consent.description}
                  </p>
                  <div className="mt-4 flex justify-end">
                    <Button size="sm" variant="outline">
                      <FileText className="h-3.5 w-3.5" />
                      Ver documento
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Clock3 className="h-5 w-5 text-primary" />
                  Historial del caso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-0">
                  {historyEvents.map(({ title, detail, date, state }, index) => (
                    <div
                      key={title}
                      className="relative flex gap-3 pb-4 last:pb-0"
                    >
                      <div className="flex w-7 shrink-0 justify-center">
                        <span
                          className={cn(
                            "relative z-10 grid h-5 w-5 place-items-center rounded-full",
                            state === "done" && "bg-success text-white",
                            state === "active" &&
                              "bg-primary text-white shadow-[0_0_0_5px_hsl(var(--color-background))]",
                            state === "pending" && "bg-muted/50",
                          )}
                        >
                          {state === "done" ? (
                            <Check className="h-3 w-3" />
                          ) : state === "active" ? (
                            <span className="h-1.5 w-1.5 rounded-full bg-white" />
                          ) : null}
                        </span>
                        {index < historyEvents.length - 1 && (
                          <span className="absolute top-5 h-full w-px bg-border" />
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 justify-between gap-3 text-sm">
                        <span>
                          <strong
                            className={cn(
                              "block",
                              state === "active"
                                ? "text-primary"
                                : "text-content",
                            )}
                          >
                            {title}
                          </strong>
                          <span className="text-xs text-muted">{detail}</span>
                        </span>
                        <span className="shrink-0 text-right text-xs text-muted">
                          {date}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Acciones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  [FileText, "Ver consentimiento"],
                  [Clock3, "Consultar historial del caso"],
                  [ArrowLeft, "Volver a mis casos"],
                ].map(([Icon, label]) => (
                  <Button
                    key={label as string}
                    variant="outline"
                    className="w-full justify-between text-sm"
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-primary" />
                      {label as string}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ))}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
      {openFileMenu &&
        createPortal(
          <>
            <button
              type="button"
              aria-label="Cerrar menú de acciones"
              className="fixed inset-0 z-[60] cursor-default"
              onClick={() => setOpenFileMenu(null)}
            />
            <div
              id={`file-actions-${openFileMenu.fileId}`}
              className="fixed z-[61] w-40 rounded-lg border border-border bg-surface p-1 shadow-lg"
              style={{ top: openFileMenu.top, left: openFileMenu.left }}
            >
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-content transition-colors hover:bg-background"
                onClick={() => {
                  setFileFeedback("");
                  setEditingFileId(openFileMenu.fileId);
                  setOpenFileMenu(null);
                }}
              >
                <Pencil className="h-4 w-4 text-muted" aria-hidden="true" />
                Editar
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-danger transition-colors hover:bg-danger/10"
                onClick={() => {
                  setDeletingFileId(openFileMenu.fileId);
                  setOpenFileMenu(null);
                }}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Eliminar
              </button>
            </div>
          </>,
          document.body,
        )}
      {deletingFile &&
        createPortal(
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setDeletingFileId(null);
            }}
          >
            <div
              className="absolute inset-0 bg-slate-950/40"
              aria-hidden="true"
            />
            <section
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="delete-file-title"
              aria-describedby="delete-file-description"
              className="relative w-full max-w-md rounded-xl border border-border bg-surface p-5 text-content shadow-xl"
            >
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-danger/10 text-danger">
                  <Trash2 className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2
                    id="delete-file-title"
                    className="text-base font-semibold"
                  >
                    Retirar archivo de la propuesta
                  </h2>
                  <p
                    id="delete-file-description"
                    className="mt-2 text-sm leading-5 text-muted"
                  >
                    El archivo{" "}
                    <strong className="break-all text-content">
                      {deletingFile.name}
                    </strong>{" "}
                    se retirará del conjunto propuesto. Los archivos vigentes del caso no cambiarán hasta que coordinación apruebe la solicitud.
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeletingFileId(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    try {
                      await removeProposedFile(deletingFile);
                      setDeletingFileId(null);
                    } catch (error) {
                      setFileFeedback(error instanceof Error ? error.message : "No se pudo retirar el archivo.");
                    }
                  }}
                >
                  Retirar de la propuesta
                </Button>
              </div>
            </section>
          </div>,
          document.body,
        )}
      {isStartRequestConfirmationOpen && createPortal(
        <ConfirmationDialog
          title="Iniciar solicitud de cambio"
          description="Se abrirá un borrador. Podrás agregar, reemplazar o retirar archivos; el conjunto vigente no cambiará hasta que coordinación apruebe la solicitud."
          confirmLabel="Iniciar solicitud"
          onCancel={() => setIsStartRequestConfirmationOpen(false)}
          onConfirm={beginChangeRequest}
        />,
        document.body,
      )}
      {isSubmitConfirmationOpen && createPortal(
        <ConfirmationDialog
          title="Enviar solicitud a coordinación"
          description={`Se enviará el motivo y la propuesta de ${files.length} archivo${files.length === 1 ? "" : "s"}. Después del envío no podrás editarla hasta que coordinación decida.`}
          confirmLabel="Enviar a coordinación"
          onCancel={() => setIsSubmitConfirmationOpen(false)}
          onConfirm={submitChangeRequest}
        />,
        document.body,
      )}
      {isCancelRequestConfirmationOpen && createPortal(
        <ConfirmationDialog
          title="Cancelar borrador"
          description="Se descartarán los cambios de la propuesta y el caso conservará el conjunto de archivos vigente."
          confirmLabel="Cancelar solicitud"
          onCancel={() => setIsCancelRequestConfirmationOpen(false)}
          onConfirm={cancelChangeRequest}
        />,
        document.body,
      )}
      {isCoordinatorRejectionOpen && createPortal(
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/40" aria-hidden="true" />
          <section role="alertdialog" aria-modal="true" aria-labelledby="reject-request-title" className="relative w-full max-w-md rounded-xl border border-border bg-surface p-5 text-content shadow-xl">
            <h2 id="reject-request-title" className="text-base font-semibold">Simular rechazo de coordinación</h2>
            <p className="mt-2 text-sm text-muted">En el flujo real, coordinación debe indicar el motivo del rechazo. El caso volverá a archivos recibidos y conservará los archivos originales.</p>
            <label htmlFor="coordinator-rejection-reason" className="mt-4 block text-sm font-medium">Motivo del rechazo</label>
            <textarea id="coordinator-rejection-reason" value={coordinatorReason} onChange={(event) => setCoordinatorReason(event.target.value.slice(0, 1000))} maxLength={1000} rows={3} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-content focus:outline-none focus:ring-2 focus:ring-primary" />
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCoordinatorRejectionOpen(false)}>Cancelar</Button>
              <Button variant="destructive" disabled={!coordinatorReason.trim()} onClick={rejectChangeRequest}>Confirmar rechazo</Button>
            </div>
          </section>
        </div>,
        document.body,
      )}
      <FileEditDrawer
        open={editingFile !== null || isAddingFile}
        file={isAddingFile ? null : editingFile}
        caseReferenceCode={caseDetail.case.referenceCode}
        studyName={caseDetail.case.studyName}
        onOpenChange={handleFileDrawerChange}
        onSave={async (replacementFiles) => {
          try {
          const newFiles = await Promise.all(replacementFiles.map(uploadProposedFile));
          if (isAddingFile) {
            setFiles((current) => [...current, ...newFiles]);
            setHistoryEvents((events) => [...events, ...newFiles.map((newFile) => ({
              title: "Archivo añadido a la propuesta",
              detail: newFile.name,
              date: new Intl.DateTimeFormat("es-CO", { dateStyle: "short", timeStyle: "short" }).format(new Date()),
              state: "done" as const,
            }))]);
            setFileFeedback(`${newFiles.length} archivo${newFiles.length === 1 ? "" : "s"} añadido${newFiles.length === 1 ? "" : "s"} a la propuesta.`);
          } else if (editingFile) {
            const newFile = newFiles[0];
            if (!newFile) return;
            if (!isMockMode() && caseDetail && inputChangeRequestId) {
              await apiClient.patient.removeInputChangeFile(caseDetail.case.id, inputChangeRequestId, editingFile.id);
            }
            setFiles((current) => current.map((file) => file.id === editingFile.id ? newFile : file));
            setHistoryEvents((events) => [...events, {
              title: "Archivo reemplazado en la propuesta",
              detail: `${editingFile.name} por ${newFile.name}`,
              date: new Intl.DateTimeFormat("es-CO", { dateStyle: "short", timeStyle: "short" }).format(new Date()),
              state: "done",
            }]);
            setFileFeedback(`${editingFile.name} se reemplazó en la propuesta por ${newFile.name}.`);
          }
          setEditingFileId(null);
          setIsAddingFile(false);
          } catch (error) {
            setFileFeedback(error instanceof Error ? error.message : "No se pudieron cargar los archivos.");
          }
        }}
      />
    </>
  );
};

function ConfirmationDialog({
  title,
  description,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/40" aria-hidden="true" />
      <section role="alertdialog" aria-modal="true" aria-labelledby="change-confirmation-title" className="relative w-full max-w-md rounded-xl border border-border bg-surface p-5 text-content shadow-xl">
        <h2 id="change-confirmation-title" className="text-base font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-5 text-muted">{description}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </section>
    </div>
  );
}

function FileEditDrawer({
  open,
  file,
  caseReferenceCode,
  studyName,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  file: UploadedFile | null;
  caseReferenceCode: string;
  studyName: string;
  onOpenChange: (open: boolean) => void;
  onSave: (files: File[]) => void | Promise<void>;
}) {
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [replacementError, setReplacementError] = React.useState("");
  const [isDragging, setIsDragging] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const dialogRef = React.useRef<HTMLElement>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!open) return;
    setSelectedFiles([]);
    setReplacementError("");
    setIsDragging(false);
    setIsSaving(false);
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
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

  if (!open) return null;

  const selectFiles = (selected: File[]) => {
    if (!selected.length) return;
    const filesToAdd = file ? selected.slice(0, 1) : selected;
    const validFiles: File[] = [];
    const errors: string[] = [];
    filesToAdd.forEach((selectedFile) => {
      const error = validateReplacementFile(selectedFile);
      if (error) errors.push(`${selectedFile.name}: ${error}`);
      else validFiles.push(selectedFile);
    });
    setSelectedFiles((current) => (file ? validFiles : [...current, ...validFiles]));
    setReplacementError(errors.join(" "));
  };

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    selectFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50"
      onMouseDown={(event) => {
        if (!dialogRef.current?.contains(event.target as Node))
          onOpenChange(false);
      }}
    >
      <div className="absolute inset-0 bg-slate-950/40" aria-hidden="true" />
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-file-title"
        aria-describedby="edit-file-description"
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-border bg-surface text-content shadow-xl"
      >
        <header className="flex items-start justify-between gap-4 px-5 pb-4 pt-5">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2
                id="edit-file-title"
                className="text-base font-semibold leading-6"
              >
                {file ? "Reemplazar archivo del estudio" : "Añadir archivos al estudio"}
              </h2>
              <p
                id="edit-file-description"
                className="text-sm leading-5 text-muted"
              >
                {file ? "Selecciona el archivo que reemplazará al actual en la propuesta." : "Selecciona uno o varios archivos para agregarlos a la propuesta de cambio."}
              </p>
            </div>
          </div>
          <Button
            ref={closeButtonRef}
            variant="secondary"
            size="icon"
            onClick={() => onOpenChange(false)}
            aria-label="Cerrar panel"
            className="h-8 w-8 shrink-0"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </header>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 pb-5 pt-2">
          <div className="grid grid-cols-2 gap-3 rounded-lg bg-background p-3 text-xs">
            <div className="min-w-0 border-r border-border pr-3">
              <p className="text-muted">Caso:</p>
              <p className="truncate font-semibold text-content">
                {caseReferenceCode}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-muted">Nombre del estudio:</p>
              <p className="truncate font-semibold text-content">
                {studyName}
              </p>
            </div>
          </div>
          {file && <div className="rounded-xl border border-border bg-background/50 p-4">
            <p className="text-xs font-medium text-muted">
              Archivo que vas a reemplazar
            </p>
            <div className="mt-2.5 flex min-w-0 items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <FileText className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className="break-all text-sm font-semibold leading-5 text-content"
                  title={file.name}
                >
                  {file.name}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  {file.kind === "dicom"
                    ? "DICOM"
                    : file.kind === "archive"
                      ? "Archivo comprimido"
                      : file.kind === "image"
                        ? "Imagen"
                        : file.kind === "pdf"
                          ? "PDF"
                          : "Archivo"}{" "}
                  · {file.size} · {file.date}
                </p>
                <p className="truncate text-[11px] text-muted">
                  Identificador: {file.id}
                </p>
              </div>
            </div>
          </div>}
          <div
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => {
              if (
                !event.currentTarget.contains(
                  event.relatedTarget as Node | null,
                )
              )
                setIsDragging(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              selectFiles(Array.from(event.dataTransfer.files));
            }}
            className={`flex min-h-60 flex-col items-center justify-center rounded-lg border border-dashed px-4 py-6 text-center transition-colors ${isDragging ? "border-primary bg-primary/10" : "border-primary/40 bg-primary/5 hover:bg-primary/10"}`}
          >
            <UploadCloud
              className="h-10 w-10 text-primary"
              aria-hidden="true"
            />
            <p className="mt-2 text-sm font-semibold text-content">
              Arrastra y suelta {file ? "un archivo" : "uno o varios archivos"} aquí
            </p>
            <p className="text-sm text-muted">
              {file ? "o selecciónalo desde tu dispositivo" : "o selecciónalos desde tu dispositivo"}
            </p>
            <label
              htmlFor="replacement-file-input"
              className="mt-3 cursor-pointer rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-strong"
            >
              Seleccionar {file ? "archivo" : "archivos"}
            </label>
            <p className="mt-3 text-xs text-muted">
              Formatos permitidos: PDF, JPG, PNG, DICOM
              <br />
              Tamaño máximo por archivo: 50 MB
            </p>
            <input
              id="replacement-file-input"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.dcm"
              multiple={!file}
              className="sr-only"
              onChange={handleFileInputChange}
              aria-label={file ? `Seleccionar archivo para reemplazar ${file.name}` : "Seleccionar archivo para agregar a la propuesta"}
            />
          </div>
          {replacementError && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger"
            >
              <TriangleAlert
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              {replacementError}
            </p>
          )}
          {selectedFiles.length > 0 && (
            <div className="space-y-2" aria-live="polite">
              <p className="text-xs font-semibold text-content">
                Archivos seleccionados ({selectedFiles.length})
              </p>
              {selectedFiles.map((selectedFile, index) => (
            <div key={`${selectedFile.name}-${selectedFile.lastModified}-${index}`} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                {selectedFile.type.startsWith("image/") ? (
                  <Image className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <FileText className="h-4 w-4" aria-hidden="true" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-content">
                  {selectedFile.name}
                </span>
                <span className="block text-xs text-muted">
                  {formatFileSize(selectedFile.size)}
                </span>
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                aria-label={`Quitar ${selectedFile.name} de la selección`}
                onClick={() => {
                  setSelectedFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
                }}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
              ))}
            </div>
          )}
        </div>

        <footer className="flex justify-end gap-2 border-t border-border bg-surface px-5 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={async () => {
              if (selectedFiles.length === 0 || isSaving) return;
              setIsSaving(true);
              try {
                await onSave(file ? selectedFiles.slice(0, 1) : selectedFiles);
              } finally {
                setIsSaving(false);
              }
            }}
            disabled={selectedFiles.length === 0 || isSaving}
          >
            {isSaving ? "Cargando archivos…" : file ? "Confirmar reemplazo" : `Añadir ${selectedFiles.length || ""} archivo${selectedFiles.length === 1 ? "" : "s"} a la propuesta`}
          </Button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}


// no borrar, respuesta de backend actual
// {
//     "id": "e03a6cc0-98d3-4f64-b6d8-ed1393e19f49",
//     "referenceCode": "CAS-20261015-0003",
//     "studyName": "Resonancia de owo",
//     "additionalReference": "aaa",
//     "originInstitution": "asdfasd",
//     "studyDate": "2026-02-03",
//     "notes": "asdfasdfa",
//     "status": "FILES_RECEIVED",
//     "createdAt": "2026-10-15T04:53:17.050811Z",
//     "updatedAt": "2026-10-15T04:53:30.327491Z",
//     "availableResultId": null
// }
