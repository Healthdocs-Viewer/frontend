import React from "react";
import { createPortal } from "react-dom";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, Download, FileText, Info, MoreVertical, RefreshCw, Trash2, Users, X } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { ResultUploadCard } from "../../components/internal/ResultUploadCard";
import { apiClient } from "../../services/apiClient";
import { getResearcherAcademicCaseDetail } from "../../services/academicCases";
import type { CompleteUploadResponse } from "../../types/api";
import type { AcademicCaseStatus, ResearcherAcademicCaseDetail } from "../../types/academicCases";

const statusConfig: Record<AcademicCaseStatus, { label: string; variant: "info" | "success" | "warning" }> = {
  FILES_RECEIVED: { label: "Archivos recibidos", variant: "info" },
  INPUT_CHANGE_DRAFT: { label: "Cambio de archivos en borrador", variant: "warning" },
  INPUT_CHANGE_REVIEW: { label: "Cambio de archivos en revisión", variant: "warning" },
  ENABLED_FOR_PROCESSING: { label: "En procesamiento", variant: "info" },
  RESULT_UPLOADED: { label: "Resultado cargado", variant: "success" },
  RESULT_AVAILABLE: { label: "Disponible para el paciente", variant: "success" },
};

const resultStatusLabel = {
  UPLOADED: "Pendiente de revisión",
  AVAILABLE: "Disponible para el paciente",
  CORRECTION_REQUIRED: "Requiere corrección",
} as const;

const formatDate = (value: string | null | undefined) => value
  ? new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
  : "—";

const formatSize = (bytes: number | null) => {
  if (bytes == null || bytes <= 0) return "Tamaño no registrado";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

type ResultMenuState = { resultId: string; top: number; left: number };

const getResultMenuPosition = (button: HTMLElement) => {
  const rect = button.getBoundingClientRect();
  const menuWidth = 192;
  const menuHeight = 136;
  return {
    left: Math.min(window.innerWidth - menuWidth - 8, Math.max(8, rect.right - menuWidth)),
    top: rect.bottom + menuHeight + 8 > window.innerHeight
      ? Math.max(8, rect.top - menuHeight - 4)
      : rect.bottom + 4,
  };
};

function SectionHeading({ icon: Icon, title, description }: {
  icon: typeof FileText;
  title: string;
  description: string;
}) {
  return <div className="flex items-start gap-3">
    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
    <div><h2 className="text-base font-semibold text-content">{title}</h2><p className="text-sm leading-5 text-muted">{description}</p></div>
  </div>;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex items-start justify-between gap-4 text-sm"><span className="text-muted">{label}</span><span className="text-right font-medium text-content">{children}</span></div>;
}

export function ResearcherCaseDetailPage() {
  const { caseId = "" } = useParams();
  const [detail, setDetail] = React.useState<ResearcherAcademicCaseDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [downloadId, setDownloadId] = React.useState("");
  const [downloadError, setDownloadError] = React.useState("");
  const [resultAction, setResultAction] = React.useState<{ kind: "replace" | "delete"; resultId: string } | null>(null);
  const [deletionReason, setDeletionReason] = React.useState("");
  const [resultActionError, setResultActionError] = React.useState("");
  const [resultActionLoading, setResultActionLoading] = React.useState(false);
  const [resultActionNotice, setResultActionNotice] = React.useState("");
  const [syncError, setSyncError] = React.useState("");
  const [openResultMenu, setOpenResultMenu] = React.useState<ResultMenuState | null>(null);

  const refreshDetail = React.useCallback(async () => {
    const response = await getResearcherAcademicCaseDetail(caseId);
    setDetail(response);
  }, [caseId]);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getResearcherAcademicCaseDetail(caseId)
      .then((response) => { if (active) setDetail(response); })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "No se pudo cargar el caso.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [caseId]);

  const download = async (fileId: string, result = false) => {
    if (!detail || downloadId) return;
    setDownloadId(fileId);
    setDownloadError("");
    try {
      const intent = result
        ? await apiClient.internal.createResultDownload(detail.case.id, fileId)
        : await apiClient.internal.createInputDownload(detail.case.id, fileId);
      window.open(intent.downloadUrl, "_blank", "noopener,noreferrer");
    } catch (reason) {
      setDownloadError(reason instanceof Error ? reason.message : "No se pudo descargar el archivo.");
    } finally {
      setDownloadId("");
    }
  };

  const openResultAction = (kind: "replace" | "delete", resultId: string) => {
    setResultAction({ kind, resultId });
    setDeletionReason("");
    setResultActionError("");
  };

  const confirmResultAction = async () => {
    if (!detail || !resultAction || !deletionReason.trim() || resultActionLoading) return;
    setResultActionLoading(true);
    setResultActionError("");
    try {
      await apiClient.internal.deleteResult(detail.case.id, resultAction.resultId, deletionReason.trim());
      const actionKind = resultAction.kind;
      setDetail((current) => current ? {
        ...current,
        case: { ...current.case, status: "ENABLED_FOR_PROCESSING" },
        results: current.results.filter((result) => result.id !== resultAction.resultId),
      } : current);
      setResultActionNotice(resultAction.kind === "replace"
        ? "El resultado se retiró. Ya puedes cargar la versión corregida para revisión."
        : "El resultado se retiró y el caso quedó habilitado para procesamiento.");
      setResultAction(null);
      setDeletionReason("");
      setSyncError("");
      try {
        await refreshDetail();
      } catch {
        setSyncError(`La acción se completó, pero no se pudo actualizar el detalle. ${actionKind === "replace" ? "Puedes continuar con una nueva carga." : "El caso quedó habilitado para procesamiento."}`);
      }
    } catch (reason) {
      setResultActionError(reason instanceof Error ? reason.message : "No se pudo actualizar el resultado.");
    } finally {
      setResultActionLoading(false);
    }
  };

  const handleUploadSuccess = async (response: CompleteUploadResponse) => {
    if (detail) {
      setDetail((current) => current ? {
        ...current,
        case: { ...current.case, status: "RESULT_UPLOADED" },
        results: response.result ? [{
          id: response.result.id,
          originalFilename: response.file.originalFilename,
          contentType: response.file.contentType ?? null,
          sizeBytes: response.file.sizeBytes,
          uploadedAt: response.result.uploadedAt,
          updatedAt: response.result.uploadedAt,
          version: response.result.version ?? null,
          status: response.result.status,
          correctionRequest: response.result.correctionRequest ?? null,
          publicationType: response.result.publicationType ?? null,
          availableAt: null,
        }] : current.results,
      } : current);
    }
    setResultActionNotice("El resultado se cargó y quedó pendiente de revisión por coordinación.");
    setSyncError("");
    try {
      await refreshDetail();
    } catch {
      setSyncError("El resultado se cargó, pero no se pudo actualizar el detalle. Recarga la página para ver la versión vigente.");
    }
  };

  if (loading || error || !detail) return <div className="space-y-4">
    <Link to="/casos_asignados" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Volver a casos asignados</Link>
    <Card><CardContent className="p-6 text-sm text-muted" role={error ? "alert" : "status"}>{error || `Cargando el caso ${caseId}…`}</CardContent></Card>
  </div>;

  const caseInfo = detail.case;
  const researchersWithAccess = detail.researchers ?? [];
  const status = statusConfig[caseInfo.status];
  const canUploadResult = caseInfo.status === "ENABLED_FOR_PROCESSING";
  const resultForUpload = detail.results[0];
  const uploadResult = resultForUpload ? {
    id: resultForUpload.id,
    originalFilename: resultForUpload.originalFilename,
    status: resultForUpload.status,
    uploadedBy: "",
    uploadedAt: resultForUpload.uploadedAt ?? undefined,
    availableAt: resultForUpload.availableAt ?? undefined,
  } : undefined;
  const statusMessage: Partial<Record<AcademicCaseStatus, string>> = {
    FILES_RECEIVED: "El caso está asignado, pero todavía no se ha habilitado para cargar resultados.",
    INPUT_CHANGE_DRAFT: "Hay una solicitud de cambio de archivos en edición. La carga de resultados está bloqueada.",
    INPUT_CHANGE_REVIEW: "La solicitud de cambio de archivos está en revisión. La carga de resultados se habilitará al resolverla.",
    RESULT_UPLOADED: "El resultado está pendiente de revisión por coordinación. No puedes cargar otra versión todavía.",
    RESULT_AVAILABLE: "El resultado ya está disponible para el paciente. Para procesar una nueva versión, el caso debe volver a habilitarse.",
  };
  const selectedResultForMenu = openResultMenu
    ? detail.results.find((item) => item.id === openResultMenu.resultId)
    : undefined;
  const resultActionTarget = resultAction
    ? detail.results.find((item) => item.id === resultAction.resultId)
    : undefined;
  const canReplaceOrDeleteResult = (selectedResultForMenu?.status === "UPLOADED" && caseInfo.status === "RESULT_UPLOADED")
    || (selectedResultForMenu?.status === "CORRECTION_REQUIRED" && caseInfo.status === "ENABLED_FOR_PROCESSING");

  return <div className="space-y-5">
    <Link to="/casos_asignados" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Volver a casos asignados</Link>

    <Card><CardContent className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between lg:p-6">
      <div className="flex min-w-0 gap-4"><div className="w-1 shrink-0 rounded-full bg-primary" aria-hidden="true" /><div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Detalle del caso asignado</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-content">{caseInfo.referenceCode}</h1>
        <p className="mt-1 text-sm leading-5 text-muted">{caseInfo.studyName} · Consulta de archivos y seguimiento del caso.</p>
      </div></div>
      <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-3 lg:min-w-[610px] lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
        <div className="flex items-center gap-3 sm:border-r sm:border-border sm:pr-3"><CalendarDays className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" /><div><p className="text-xs text-muted">Fecha de recepción</p><p className="mt-1 text-sm font-medium text-content">{formatDate(caseInfo.receivedAt ?? caseInfo.createdAt)}</p></div></div>
        <div className="flex items-center gap-3 sm:border-r sm:border-border sm:pr-3"><CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-hidden="true" /><div><p className="text-xs text-muted">Estado</p><Badge variant={status.variant} className="mt-1">{status.label}</Badge></div></div>
        <div className="flex items-center gap-3"><Clock3 className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" /><div><p className="text-xs text-muted">Última actualización</p><p className="mt-1 text-sm font-medium text-content">{formatDate(caseInfo.updatedAt)}</p></div></div>
      </div>
    </CardContent></Card>

    <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.85fr)_minmax(320px,1fr)]">
      <div className="min-w-0 space-y-5">
        <Card><CardContent className="p-5">
          <SectionHeading icon={FileText} title="Archivos recibidos" description="Archivos de entrada disponibles para el análisis de este caso." />
          {downloadError && <p role="alert" className="mt-3 text-sm text-danger">{downloadError}</p>}
          <div className="mt-4 overflow-x-auto rounded-lg border border-border"><table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-muted dark:bg-slate-800"><tr><th scope="col" className="px-4 py-3">Nombre</th><th scope="col" className="px-4 py-3">Fecha</th><th scope="col" className="px-4 py-3">Tamaño</th><th scope="col" className="px-4 py-3">Acción</th></tr></thead>
            <tbody>{detail.inputFiles.map((file) => <tr key={file.id} className="border-t border-border text-content"><td className="break-all px-4 py-3 font-medium">{file.originalFilename}<span className="block text-xs font-normal text-muted">{file.contentType ?? "Tipo no disponible"}</span></td><td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(file.uploadedAt)}</td><td className="whitespace-nowrap px-4 py-3 text-muted">{formatSize(file.sizeBytes)}</td><td className="px-4 py-3"><Button size="sm" variant="outline" disabled={Boolean(downloadId)} onClick={() => void download(file.id)}><Download className="h-4 w-4" aria-hidden="true" />{downloadId === file.id ? "Preparando…" : "Descargar"}</Button></td></tr>)}
              {detail.inputFiles.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted">No hay archivos de entrada disponibles.</td></tr>}</tbody>
          </table></div>
        </CardContent></Card>

        <Card><CardContent className="p-5">
          <SectionHeading icon={FileText} title="Resultados del caso" description="Resultados cargados y su estado de revisión." />
          {syncError && <p role="alert" className="mt-4 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">{syncError}</p>}
          {resultActionNotice && <div role="status" className="mt-4 flex items-start justify-between gap-3 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"><span>{resultActionNotice}</span><button type="button" aria-label="Cerrar mensaje" onClick={() => setResultActionNotice("")}><X className="h-4 w-4" aria-hidden="true" /></button></div>}
          {canUploadResult && <div className="mt-4"><ResultUploadCard caseId={caseInfo.id} caseStatus={caseInfo.status} result={uploadResult} onUploadSuccess={handleUploadSuccess} /></div>}
          {!canUploadResult && statusMessage[caseInfo.status] && <p className="mt-4 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning" role="status">{statusMessage[caseInfo.status]}</p>}
          <div className="mt-4 overflow-x-auto rounded-lg border border-border"><table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-muted dark:bg-slate-800"><tr><th scope="col" className="px-4 py-3">Resultado</th><th scope="col" className="px-4 py-3">Fecha de carga</th><th scope="col" className="px-4 py-3">Versión</th><th scope="col" className="px-4 py-3">Estado</th><th scope="col" className="px-4 py-3">Acción</th></tr></thead>
            <tbody>{detail.results.map((result) => <React.Fragment key={result.id}><tr className="border-t border-border text-content">
              <td className="break-all px-4 py-3 font-medium">{result.originalFilename}<span className="block text-xs font-normal text-muted">{result.contentType ?? "Tipo no disponible"} · {formatSize(result.sizeBytes)}</span></td>
              <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(result.uploadedAt)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-muted">{result.version ? `v${result.version}` : "—"}</td>
              <td className="px-4 py-3"><Badge variant={result.status === "AVAILABLE" ? "success" : result.status === "CORRECTION_REQUIRED" ? "warning" : "info"}>{resultStatusLabel[result.status]}</Badge></td>
              <td className="px-4 py-3">
                <Button variant="ghost" size="icon" className="h-8 w-8"
                  aria-label={`Más acciones para ${result.originalFilename}`}
                  aria-haspopup="menu" aria-expanded={openResultMenu?.resultId === result.id}
                  aria-controls={`researcher-result-actions-${result.id}`}
                  onClick={(event) => {
                    const position = getResultMenuPosition(event.currentTarget);
                    setOpenResultMenu((current) => current?.resultId === result.id
                      ? null
                      : { resultId: result.id, ...position });
                  }}
                ><MoreVertical className="h-4 w-4" aria-hidden="true" /></Button>
              </td>
            </tr>{result.status === "CORRECTION_REQUIRED" && result.correctionRequest && <tr className="border-t border-border bg-warning/5"><td colSpan={5} className="px-4 py-3"><div className="rounded-lg border border-warning/20 bg-warning/10 px-3 py-2.5"><p className="text-[11px] font-semibold uppercase tracking-wide text-warning">Motivo de corrección</p><p className="mt-1 whitespace-pre-wrap break-words text-sm leading-5 text-content">{result.correctionRequest}</p></div></td></tr>}</React.Fragment>)}
              {detail.results.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">Este caso todavía no tiene resultados cargados.</td></tr>}</tbody>
          </table></div>
        </CardContent></Card>
      </div>

      <aside className="min-w-0 space-y-5" aria-label="Información del caso">
        <Card><CardContent className="p-5">
          <SectionHeading icon={Info} title="Estado del procesamiento" description="Acciones habilitadas según el estado actual del caso." />
          <div className="mt-4 rounded-lg border border-border bg-slate-50/70 p-4 dark:bg-slate-800/60"><DetailRow label="Estado"><Badge variant={status.variant}>{status.label}</Badge></DetailRow>
            {canUploadResult ? <p className="mt-3 text-sm leading-5 text-muted">El caso está habilitado para análisis y carga de resultado.</p> : <p className="mt-3 text-sm leading-5 text-muted">{statusMessage[caseInfo.status] ?? "No hay acciones disponibles para este estado."}</p>}
          </div>
        </CardContent></Card>

        <Card><CardContent className="p-5">
          <SectionHeading icon={Users} title="Investigadores con acceso" description="Personas asignadas para consultar y trabajar en este caso." />
          <ul className="mt-4 space-y-3">
            {researchersWithAccess.map((researcher) => <li key={researcher.userId} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-slate-50/70 p-3 dark:bg-slate-800/60">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-content">{researcher.fullName || "Investigador asignado"}</p>
                <p className="mt-0.5 text-xs text-muted">{researcher.researcherCode || "Código no registrado"}</p>
              </div>
              {researcher.authorizationStatus && <Badge variant={researcher.authorizationStatus === "AUTHORIZED" ? "success" : "warning"}>{researcher.authorizationStatus === "AUTHORIZED" ? "Autorizado" : "Restringido"}</Badge>}
            </li>)}
            {researchersWithAccess.length === 0 && <li className="rounded-lg border border-dashed border-border px-3 py-5 text-center text-sm text-muted">No hay investigadores asignados.</li>}
          </ul>
        </CardContent></Card>

        <Card><CardContent className="p-5">
          <SectionHeading icon={Info} title="Información del caso" description="Datos registrados para este estudio." />
          <div className="mt-4 space-y-4 rounded-lg border border-border bg-slate-50/70 p-4 dark:bg-slate-800/60">
            <DetailRow label="Identificador">{caseInfo.referenceCode}</DetailRow>
            <DetailRow label="Estudio">{caseInfo.studyName || "—"}</DetailRow>
            {caseInfo.additionalReference && <DetailRow label="Referencia adicional">{caseInfo.additionalReference}</DetailRow>}
            {caseInfo.originInstitution && <DetailRow label="Institución de origen">{caseInfo.originInstitution}</DetailRow>}
            {caseInfo.studyDate && <DetailRow label="Fecha del estudio">{formatDate(caseInfo.studyDate)}</DetailRow>}
            <DetailRow label="Fecha de recepción">{formatDate(caseInfo.receivedAt ?? caseInfo.createdAt)}</DetailRow>
            <DetailRow label="Última actualización">{formatDate(caseInfo.updatedAt)}</DetailRow>
            {caseInfo.notes && <div className="border-t border-border pt-3"><p className="text-xs text-muted">Notas</p><p className="mt-1 whitespace-pre-wrap text-sm text-content">{caseInfo.notes}</p></div>}
          </div>
        </CardContent></Card>
      </aside>
    </div>
    {openResultMenu && createPortal(
      <>
        <button type="button" aria-label="Cerrar menú de acciones" className="fixed inset-0 z-[60] cursor-default" onClick={() => setOpenResultMenu(null)} />
        <div id={`researcher-result-actions-${openResultMenu.resultId}`} role="menu" aria-label="Acciones del resultado" className="fixed z-[61] w-48 rounded-lg border border-border bg-surface p-1 shadow-lg" style={{ top: openResultMenu.top, left: openResultMenu.left }}>
          <button type="button" role="menuitem" disabled={Boolean(downloadId) || resultActionLoading} onClick={() => { const resultId = openResultMenu.resultId; setOpenResultMenu(null); void download(resultId, true); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-content transition-colors hover:bg-background disabled:opacity-50">
            <Download className="h-4 w-4 text-muted" aria-hidden="true" />{downloadId === openResultMenu.resultId ? "Preparando…" : "Descargar"}
          </button>
          {canReplaceOrDeleteResult && <>
            <button type="button" role="menuitem" disabled={resultActionLoading} onClick={() => { const resultId = openResultMenu.resultId; setOpenResultMenu(null); openResultAction("replace", resultId); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-content transition-colors hover:bg-background disabled:opacity-50">
              <RefreshCw className="h-4 w-4 text-muted" aria-hidden="true" />{selectedResultForMenu?.status === "CORRECTION_REQUIRED" ? "Cargar versión corregida" : "Reemplazar"}
            </button>
            <button type="button" role="menuitem" disabled={resultActionLoading} onClick={() => { const resultId = openResultMenu.resultId; setOpenResultMenu(null); openResultAction("delete", resultId); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-danger transition-colors hover:bg-danger/10 disabled:opacity-50">
              <Trash2 className="h-4 w-4" aria-hidden="true" />Eliminar
            </button>
          </>}
        </div>
      </>,
      document.body,
    )}
    {resultAction && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !resultActionLoading) setResultAction(null); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="researcher-result-action-title" className="w-full max-w-lg rounded-xl border border-border bg-surface p-5 shadow-xl">
        <h2 id="researcher-result-action-title" className="text-lg font-semibold text-content">{resultAction.kind === "replace" ? resultActionTarget?.status === "CORRECTION_REQUIRED" ? "Cargar versión corregida" : "Reemplazar carga pendiente" : resultActionTarget?.status === "CORRECTION_REQUIRED" ? "Eliminar resultado por corregir" : "Eliminar carga pendiente"}</h2>
        <p className="mt-2 text-sm leading-5 text-muted">{resultAction.kind === "replace" ? "Se retirará esta versión y el caso quedará habilitado para cargar una nueva. La nueva carga recibirá otro número de versión." : "Se retirará esta versión y el caso quedará habilitado para procesamiento. Esta acción se conservará en el historial."}</p>
        <label htmlFor="researcher-result-deletion-reason" className="mt-4 block text-sm font-medium text-content">Motivo</label>
        <textarea id="researcher-result-deletion-reason" rows={3} maxLength={4000} value={deletionReason} onChange={(event) => setDeletionReason(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-content focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Indica por qué retiras este resultado…" />
        {resultActionError && <p role="alert" className="mt-2 text-sm text-danger">{resultActionError}</p>}
        <footer className="mt-5 flex justify-end gap-2"><Button variant="outline" disabled={resultActionLoading} onClick={() => setResultAction(null)}>Cancelar</Button><Button variant="destructive" disabled={resultActionLoading || !deletionReason.trim()} loading={resultActionLoading} onClick={() => void confirmResultAction()}>{resultAction.kind === "replace" ? "Retirar y continuar" : "Confirmar eliminación"}</Button></footer>
      </section>
    </div>}
  </div>;
}
