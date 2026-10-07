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
import { getAcademicCases } from "../../services/academicCases";
import { saveStudentAssignmentsForCase } from "../../services/academicStudents";

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
};

const caseFiles: CaseFile[] = [
  { name: "torax_estudio_01.zip", date: "18/9/2026, 16:12", size: "428 MB", kind: "archive" },
  { name: "serie_dicom_ap.dcm", date: "18/9/2026, 16:13", size: "36 MB", kind: "dicom" },
  { name: "solicitud_estudio.pdf", date: "18/9/2026, 16:14", size: "420 KB", kind: "pdf" },
];

const caseResults: CaseResult[] = [
  { id: "RES-20260918-0027-01", fileName: "video_explicativo.mp4", type: "Video explicativo", uploadedAt: "19/9/2026, 08:45", version: "v1.0" },
  { id: "RES-20260918-0027-02", fileName: "resumen_visual.pdf", type: "Resumen visual", uploadedAt: "19/9/2026, 09:12", version: "v1.0" },
];

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
  const [results, setResults] = React.useState(caseResults);
  const [openResultMenu, setOpenResultMenu] = React.useState<ResultMenuState | null>(null);
  const [resultAction, setResultAction] = React.useState<{ type: "edit" | "delete"; resultId: string } | null>(null);
  const { caseId } = useParams<{ caseId: string }>();
  const resolvedCaseId = caseId ?? "CAS-20260918-0027";
  const [caseUuid, setCaseUuid] = React.useState("");
  const actionResult = results.find((result) => result.id === resultAction?.resultId);
  const sortedFiles = [...caseFiles].sort((a, b) => sortAscending ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));
  React.useEffect(() => {
    let active = true;
    getAcademicCases()
      .then((items) => {
        if (!active) return;
        setCaseUuid(items.find((item) => item.referenceCode === resolvedCaseId || item.id === resolvedCaseId)?.id ?? "");
      })
      .catch(() => { if (active) setCaseUuid(""); });
    return () => { active = false; };
  }, [resolvedCaseId]);
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

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between lg:p-6">
          <div className="flex min-w-0 gap-4">
            <div className="w-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-content">{resolvedCaseId}</h1>
              <p className="mt-1 text-sm leading-5 text-muted">Detalle del caso académico y seguimiento de archivos, asignación y resultados asociados.</p>
            </div>
          </div>
          <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-3 lg:min-w-[610px] lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <div className="flex items-center gap-3 sm:border-r sm:border-border sm:pr-3">
              <CalendarDays className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div><p className="text-xs text-muted">Fecha de recepción</p><p className="mt-1 text-sm font-medium text-content">18/9/2026, 16:12</p></div>
            </div>
            <div className="flex items-center gap-3 sm:border-r sm:border-border sm:pr-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-hidden="true" />
              <div><p className="text-xs text-muted">Estado</p><Badge variant="success" className="mt-1"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />Resultado cargado</Badge></div>
            </div>
            <div className="flex items-center gap-3">
              <Clock3 className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div><p className="text-xs text-muted">Última actualización</p><p className="mt-1 text-sm font-medium text-content">19/9/2026, 09:12</p></div>
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

          <Card>
            <CardContent className="p-5">
              <SectionHeading icon={BarChart3} title="Resultados del caso" description="Resultados generados y cargados para este caso." />
              <div className="mt-4 overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold text-muted dark:bg-slate-800">
                    <tr>
                      <th scope="col" className="px-4 py-3">Resultado</th>
                      <th scope="col" className="px-4 py-3">Tipo</th>
                      <th scope="col" className="px-4 py-3">Fecha de carga</th>
                      <th scope="col" className="px-4 py-3">Versión</th>
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
                        <td className="px-4 py-3"><Badge variant="success" className="whitespace-nowrap"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />Cargado</Badge></td>
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
                    {results.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-muted">Este caso no tiene resultados cargados.</td></tr>}
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
                <DetailRow icon={UserRound} label="Investigador asignado">EST-1033 · P. Torres</DetailRow>
                <DetailRow icon={CalendarDays} label="Fecha de asignación">18/9/2026, 17:05</DetailRow>
                <DetailRow icon={Settings} label="Estado del procesamiento"><Badge variant="success" className="whitespace-nowrap"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />Resultado cargado</Badge></DetailRow>
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
                <DetailRow icon={FileText} label="Identificador">{resolvedCaseId}</DetailRow>
                <DetailRow icon={CalendarDays} label="Fecha de recepción">18/9/2026, 16:12</DetailRow>
                <DetailRow icon={Clock3} label="Última actualización">19/9/2026, 09:12</DetailRow>
                <DetailRow icon={CheckCircle2} label="Estado"><Badge variant="success" className="whitespace-nowrap"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />Resultado cargado</Badge></DetailRow>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      {feedback && <p role="status" className="rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary-strong">{feedback}</p>}
      {openResultMenu && createPortal(
        <>
          <button type="button" aria-label="Cerrar menú de acciones" className="fixed inset-0 z-[60] cursor-default" onClick={() => setOpenResultMenu(null)} />
          <div id={`result-actions-${openResultMenu.resultId}`} className="fixed z-[61] w-44 rounded-lg border border-border bg-surface p-1 shadow-lg" style={{ top: openResultMenu.top, left: openResultMenu.left }}>
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
        caseId={resolvedCaseId}
        caseUuid={caseUuid}
        caseStatus="Resultado cargado"
        onSave={async (selectedIds, expectedVersion) => {
          if (!caseUuid) throw new Error("No se pudo resolver el identificador del caso.");
          await saveStudentAssignmentsForCase(caseUuid, { studentIds: selectedIds, expectedVersion });
          setFeedback(`Acceso de investigadores actualizado para ${resolvedCaseId}.`);
        }}
      />
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
    </div>
  );
};

export const AcademicCaseDetailPage = CaseDetailPage;
