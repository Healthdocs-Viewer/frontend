import React from "react";
import { createPortal } from "react-dom";
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

const steps = [
  ["Caso creado", "20/9/2026, 20:45", "done"],
  ["Archivo recibido", "20/9/2026, 20:46", "done"],
  [
    "En procesamiento",
    "Tu estudio está siendo revisado por nuestro equipo médico.",
    "active",
  ],
  ["Resultado disponible", "Te notificaremos cuando esté listo.", "pending"],
] as const;
const history = [
  [
    "Caso creado",
    "Se ha creado el caso en la plataforma.",
    "20/9/2026, 20:45",
    "done",
  ],
  [
    "Consentimiento aceptado",
    "Has aceptado los términos y condiciones para este caso.",
    "20/9/2026, 20:45",
    "done",
  ],
  [
    "Archivo cargado",
    "Se ha recibido correctamente el archivo del estudio.",
    "20/9/2026, 20:46",
    "done",
  ],
  [
    "En procesamiento",
    "Tu estudio se encuentra en revisión por nuestro equipo médico.",
    "20/9/2026, 20:47",
    "active",
  ],
  [
    "Resultado disponible",
    "Te notificaremos cuando el resultado esté listo.",
    "Pendiente",
    "pending",
  ],
] as const;

type UploadedFile = {
  id: string;
  name: string;
  date: string;
  sortDate: number;
  size: string;
  kind: "archive" | "dicom" | "pdf" | "image" | "file";
};

const uploadedFiles: UploadedFile[] = [
  { id: "file-1", name: "torax_estudio_01.zip", date: "18/9/2026, 16:12", sortDate: Date.parse("2026-09-18T16:12:00-05:00"), size: "428 MB", kind: "archive" },
  { id: "file-2", name: "serie_dicom_ap.dcm", date: "18/9/2026, 16:13", sortDate: Date.parse("2026-09-18T16:13:00-05:00"), size: "36 MB", kind: "dicom" },
  { id: "file-3", name: "solicitud_estudio.pdf", date: "18/9/2026, 16:14", sortDate: Date.parse("2026-09-18T16:14:00-05:00"), size: "420 KB", kind: "pdf" },
];

type FileMenuState = { fileId: string; top: number; left: number };

const getFileMenuPosition = (button: HTMLElement) => {
  const rect = button.getBoundingClientRect();
  const menuWidth = 160;
  const menuHeight = 88;
  const left = Math.min(window.innerWidth - menuWidth - 8, Math.max(8, rect.right - menuWidth));
  const top = rect.bottom + menuHeight + 8 > window.innerHeight
    ? Math.max(8, rect.top - menuHeight - 4)
    : rect.bottom + 4;
  return { top, left };
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

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
  if (["zip", "rar", "7z", "tar", "gz"].includes(extension ?? "")) return "archive";
  if (extension === "pdf") return "pdf";
  if (["jpg", "jpeg", "png"].includes(extension ?? "")) return "image";
  if (["dcm", "dicom"].includes(extension ?? "")) return "dicom";
  return "file";
};

export const ResultDetailPage: React.FC = () => {
  const [sortAscending, setSortAscending] = React.useState(true);
  const [fileFeedback, setFileFeedback] = React.useState("");
  const [openFileMenu, setOpenFileMenu] = React.useState<FileMenuState | null>(null);
  const [files, setFiles] = React.useState(uploadedFiles);
  const [editingFileId, setEditingFileId] = React.useState<string | null>(null);
  const handleFileDrawerChange = React.useCallback((open: boolean) => {
    if (!open) setEditingFileId(null);
  }, []);
  const sortedFiles = [...files].sort((a, b) =>
    sortAscending ? a.sortDate - b.sortDate : b.sortDate - a.sortDate,
  );
  const editingFile = files.find((file) => file.id === editingFileId) ?? null;

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
              CAS-20260921-0002
            </h1>
            <Badge
              variant="neutral"
              className="border-0 bg-info/10 text-info"
            >
              <span className="mr-1.5 h-2.5 w-2.5 rounded-full border-2 border-info" />
              En procesamiento
            </Badge>
          </div>
          <p className="font-medium text-content">Radiografía de tórax</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
            <Calendar className="h-3.5 w-3.5" />
            Creado el 20 de septiembre de 2026, 20:45
          </p>
          <p className="mt-1 text-xs text-muted">
            Tu estudio ha sido recibido correctamente y se encuentra en proceso
            de análisis por nuestro equipo médico.
          </p>
        </div>
        <div className="hidden h-24 w-40 items-center justify-center rounded-full bg-primary/10 text-primary/30 md:flex">
          <FileCheck2 className="h-16 w-16" />
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="grid gap-4 p-5 md:grid-cols-4">
        {steps.map(([title, date, state], index) => (
          <div key={title} className="relative flex gap-3 md:block md:pr-3">
            {index < steps.length - 1 && (
              <span
                className={cn(
                  "absolute left-3.5 top-3.5 hidden h-0.5 w-[calc(100%+0.75rem)] md:block",
                  state === "done" ? "bg-success" : "bg-border",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full border-2",
                state === "done" &&
                  "border-success bg-success text-white",
                state === "active" &&
                  "border-primary bg-primary text-white shadow-[0_0_0_6px_hsl(var(--color-background))]",
                state === "pending" &&
                  "border-border bg-background text-muted",
              )}
            >
              {state === "done" ? (
                <Check className="h-4 w-4" />
              ) : state === "active" ? (
                <span className="h-2 w-2 rounded-full bg-white" />
              ) : null}
            </span>
            <span className="relative z-10 block pt-0.5 md:mt-3">
              <strong
                className={cn(
                  "block text-xs",
                  state === "active" ? "text-primary" : "text-content",
                )}
              >
                {title}
              </strong>
              <span className="mt-1 block text-xs leading-4 text-muted">
                {date}
              </span>
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
      <div className="space-y-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-content">Archivos cargados</h2>
                <p className="text-sm leading-5 text-muted">Archivos enviados para el estudio de este caso.</p>
              </div>
            </div>
            <div className="mt-4 overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-background text-xs font-semibold text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3">Nombre</th>
                    <th scope="col" className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setSortAscending((value) => !value)}
                        className="inline-flex items-center gap-1 hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        aria-label={`Ordenar fecha ${sortAscending ? "descendente" : "ascendente"}`}
                      >
                        Fecha <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </th>
                    <th scope="col" className="px-4 py-3">Tamaño</th>
                    <th scope="col" className="px-4 py-3">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedFiles.map((file) => {
                    const FileIcon = file.kind === "archive"
                      ? FileArchive
                      : file.kind === "image" ? Image : FileText;
                    return (
                      <tr key={file.id} className="border-t border-border text-content">
                        <td className="whitespace-nowrap px-4 py-2.5">
                          <span className="inline-flex items-center gap-3">
                            <FileIcon className={`h-5 w-5 ${file.kind === "pdf" ? "text-danger" : "text-muted"}`} aria-hidden="true" />
                            {file.name}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-muted">{file.date}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-muted">{file.size}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setFileFeedback(`Descarga preparada: ${file.name}`)}
                            >
                              <Download className="h-4 w-4" aria-hidden="true" />
                              Descargar
                            </Button>
                            <div className="relative">
                              <IconButton
                                icon={MoreHorizontal}
                                label={`Más acciones para ${file.name}`}
                                variant="ghost"
                                className="h-8 w-8"
                                aria-expanded={openFileMenu?.fileId === file.id}
                                aria-controls={`file-actions-${file.id}`}
                                onClick={(event) => setOpenFileMenu((current) => current?.fileId === file.id ? null : { fileId: file.id, ...getFileMenuPosition(event.currentTarget) })}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {fileFeedback && (
              <p role="status" className="mt-3 rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary-strong">
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
            <div className="flex items-center gap-4 rounded-lg bg-primary/10 p-4">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-surface text-primary/70">
                <FileText className="h-8 w-8" />
              </span>
              <div>
                <strong className="block text-sm text-content">
                  Aún en procesamiento
                </strong>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Tu estudio está siendo revisado por nuestro equipo médico. Te
                  notificaremos cuando el resultado esté disponible.
                </p>
              </div>
            </div>
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
                    Consentimiento aceptado
                  </strong>
                  <span className="block text-xs text-muted">
                    Versión de términos 1.0
                  </span>
                  <span className="block text-xs text-muted">
                    Aceptado el 20/9/2026, 20:45
                  </span>
                </div>
              </div>
              <p className="mt-4 text-xs leading-5 text-muted">
                Has autorizado el tratamiento y gestión de la información
                suministrada para la gestión académica y diagnóstica de este
                caso.
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
              {history.map(([title, detail, date, state], index) => (
                <div key={title} className="relative flex gap-3 pb-4 last:pb-0">
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
                    {index < history.length - 1 && (
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
    {openFileMenu && createPortal(
      <>
        <button type="button" aria-label="Cerrar menú de acciones" className="fixed inset-0 z-[60] cursor-default" onClick={() => setOpenFileMenu(null)} />
        <div id={`file-actions-${openFileMenu.fileId}`} className="fixed z-[61] w-40 rounded-lg border border-border bg-surface p-1 shadow-lg" style={{ top: openFileMenu.top, left: openFileMenu.left }}>
          <button type="button" className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-content transition-colors hover:bg-background" onClick={() => { setFileFeedback(""); setEditingFileId(openFileMenu.fileId); setOpenFileMenu(null); }}>
            <Pencil className="h-4 w-4 text-muted" aria-hidden="true" />Editar
          </button>
          <button type="button" className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-danger transition-colors hover:bg-danger/10" onClick={() => { const file = files.find((item) => item.id === openFileMenu.fileId); if (file) setFileFeedback(`La eliminación de ${file.name} estará disponible más adelante.`); setOpenFileMenu(null); }}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />Eliminar
          </button>
        </div>
      </>,
      document.body,
    )}
    <FileEditDrawer
      open={editingFile !== null}
      file={editingFile}
      onOpenChange={handleFileDrawerChange}
      onSave={(replacement) => {
        if (!editingFile) return;
        const now = new Date();
        const size = formatFileSize(replacement.size);
        const kind = getFileKind(replacement.name);
        setFiles((current) => current.map((file) => file.id === editingFile.id
          ? { ...file, name: replacement.name, size, kind, sortDate: now.getTime(), date: new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(now) }
          : file));
        setFileFeedback(`Archivo actualizado: ${replacement.name}`);
        setEditingFileId(null);
      }}
    />
    </>
  );
};

function FileEditDrawer({
  open,
  file,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  file: UploadedFile | null;
  onOpenChange: (open: boolean) => void;
  onSave: (file: File) => void;
}) {
  const [replacement, setReplacement] = React.useState<File | null>(null);
  const [replacementError, setReplacementError] = React.useState("");
  const [isDragging, setIsDragging] = React.useState(false);
  const dialogRef = React.useRef<HTMLElement>(null);
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

  if (!open || !file) return null;

  const selectReplacement = (selected: File | null) => {
    if (!selected) return;
    const error = validateReplacementFile(selected);
    setReplacementError(error);
    setReplacement(error ? null : selected);
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    selectReplacement(event.target.files?.[0] ?? null);
    event.target.value = "";
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50"
      onMouseDown={(event) => {
        if (!dialogRef.current?.contains(event.target as Node)) onOpenChange(false);
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
              <h2 id="edit-file-title" className="text-base font-semibold leading-6">Cargar archivo del estudio</h2>
              <p id="edit-file-description" className="text-sm leading-5 text-muted">
                Reemplaza el archivo cargado para este caso.
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
              <p className="truncate font-semibold text-content">CAS-20260921-0002</p>
            </div>
            <div className="min-w-0">
              <p className="text-muted">Nombre del estudio:</p>
              <p className="truncate font-semibold text-content">Radiografía de tórax</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-background/50 p-4">
            <p className="text-xs font-medium text-muted">Archivo que vas a reemplazar</p>
            <div className="mt-2.5 flex min-w-0 items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><FileText className="h-5 w-5" aria-hidden="true" /></span>
              <div className="min-w-0 flex-1">
                <p className="break-all text-sm font-semibold leading-5 text-content" title={file.name}>{file.name}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{file.kind === "dicom" ? "DICOM" : file.kind === "archive" ? "Archivo comprimido" : file.kind === "image" ? "Imagen" : file.kind === "pdf" ? "PDF" : "Archivo"} · {file.size} · {file.date}</p>
                <p className="truncate text-[11px] text-muted">Identificador: {file.id}</p>
              </div>
            </div>
          </div>
          <div
            onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragging(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              if (event.dataTransfer.files.length > 1) {
                setReplacement(null);
                setReplacementError("Solo puedes cargar un archivo a la vez.");
                return;
              }
              selectReplacement(event.dataTransfer.files[0] ?? null);
            }}
            className={`flex min-h-60 flex-col items-center justify-center rounded-lg border border-dashed px-4 py-6 text-center transition-colors ${isDragging ? "border-primary bg-primary/10" : "border-primary/40 bg-primary/5 hover:bg-primary/10"}`}
          >
            <UploadCloud className="h-10 w-10 text-primary" aria-hidden="true" />
            <p className="mt-2 text-sm font-semibold text-content">Arrastra y suelta un archivo aquí</p>
            <p className="text-sm text-muted">o selecciónalo desde tu dispositivo</p>
            <label
              htmlFor="replacement-file-input"
              className="mt-3 cursor-pointer rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-strong"
            >
              Seleccionar archivo
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
              className="sr-only"
              onChange={handleFileInputChange}
              aria-label={`Seleccionar archivo para reemplazar ${file.name}`}
            />
          </div>
          {replacementError && (
            <p role="alert" className="flex items-start gap-2 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {replacementError}
            </p>
          )}
          {replacement && (
            <div className="flex items-center gap-3 rounded-lg border border-border px-3 py-2" aria-live="polite">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                {replacement.type.startsWith("image/") ? <Image className="h-4 w-4" aria-hidden="true" /> : <FileText className="h-4 w-4" aria-hidden="true" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-content">{replacement.name}</span>
                <span className="block text-xs text-muted">{formatFileSize(replacement.size)}</span>
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                aria-label="Quitar archivo seleccionado"
                onClick={() => { setReplacement(null); setReplacementError(""); }}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          )}
        </div>

        <footer className="flex justify-end gap-2 border-t border-border bg-surface px-5 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => replacement && onSave(replacement)} disabled={!replacement}>
            Cargar archivo
          </Button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
