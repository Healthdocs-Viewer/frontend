import React from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import type { AcademicStudentCase, AcademicStudent } from "../../types/academicStudents";

const formatDate = (value: string) => new Intl.DateTimeFormat("es-CO", {
  day: "numeric", month: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
}).format(new Date(value));

const statusPresentation: Record<AcademicStudentCase["status"], { label: string; variant: "info" | "success" | "warning" }> = {
  ENABLED_FOR_PROCESSING: { label: "En procesamiento", variant: "info" },
  RESULT_UPLOADED: { label: "Resultado cargado", variant: "success" },
  RESULT_AVAILABLE: { label: "Disponible para el paciente", variant: "success" },
  CREATED: { label: "Creado", variant: "info" },
  FILES_RECEIVED: { label: "Archivos recibidos", variant: "info" },
  INPUT_CHANGE_DRAFT: { label: "Cambio en edición", variant: "warning" },
  INPUT_CHANGE_REVIEW: { label: "Cambio pendiente de revisión", variant: "warning" },
};

type StudentCasesDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: AcademicStudent | null;
  cases: AcademicStudentCase[];
  isLoading: boolean;
  onSave: (studentId: string, caseIds: string[]) => Promise<void>;
};

export function StudentCasesDrawer({ open, onOpenChange, student, cases, isLoading, onSave }: StudentCasesDrawerProps) {
  const [tab, setTab] = React.useState<"assigned" | "available">("assigned");
  const [query, setQuery] = React.useState("");
  const [order, setOrder] = React.useState("receivedAt,desc");
  const [page, setPage] = React.useState(1);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [confirmRemoval, setConfirmRemoval] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const dialogRef = React.useRef<HTMLElement>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!open) return;
    setTab("assigned");
    setQuery("");
    setOrder("receivedAt,desc");
    setPage(1);
    setConfirmRemoval(false);
    setSelectedIds(cases.filter((item) => item.isAssigned).map((item) => item.id));
  }, [open, student?.userId, cases]);

  React.useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (confirmRemoval) setConfirmRemoval(false);
        else onOpenChange(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [open, confirmRemoval, onOpenChange]);

  if (!open || !student) return null;

  const initialIds = cases.filter((item) => item.isAssigned).map((item) => item.id);
  const initialSet = new Set(initialIds);
  const selectedSet = new Set(selectedIds);
  const additions = selectedIds.filter((id) => !initialSet.has(id)).length;
  const removals = initialIds.filter((id) => !selectedSet.has(id)).length;
  const assignedCases = cases.filter((item) => selectedSet.has(item.id));
  const availableCases = cases.filter((item) => !selectedSet.has(item.id));
  const source = tab === "assigned" ? assignedCases : availableCases;
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
  const filtered = source.filter((item) => normalize(`${item.referenceCode} ${item.studyName}`).includes(normalize(query.trim())));
  const ordered = [...filtered].sort((a, b) => order === "receivedAt,asc"
    ? a.receivedAt.localeCompare(b.receivedAt)
    : b.receivedAt.localeCompare(a.receivedAt));
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(ordered.length / pageSize));
  const visible = ordered.slice((page - 1) * pageSize, page * pageSize);
  const canEdit = student.authorizationStatus === "AUTHORIZED";

  const save = async () => {
    if (removals > 0 && !confirmRemoval) { setConfirmRemoval(true); return; }
    setSaving(true);
    setError("");
    try {
      await onSave(student.userId, selectedIds);
      onOpenChange(false);
    } catch {
      setError("No se pudieron guardar los cambios.");
    } finally {
      setSaving(false);
      setConfirmRemoval(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50" onMouseDown={(event) => { if (!dialogRef.current?.contains(event.target as Node)) onOpenChange(false); }}>
      <div className="absolute inset-0 bg-slate-950/40" aria-hidden="true" />
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="student-cases-title" className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col border-l border-border bg-surface text-content shadow-xl">
        <header className="flex items-start justify-between gap-4 px-5 pb-4 pt-5">
          <div className="min-w-0"><h2 id="student-cases-title" className="text-base font-semibold">Gestionar casos de {student.fullName}</h2><p className="mt-1 text-sm leading-5 text-muted">Consulta, asigna o retira casos de este investigador.</p></div>
          <Button ref={closeButtonRef} variant="secondary" size="icon" onClick={() => onOpenChange(false)} aria-label="Cerrar panel" className="shrink-0"><X className="h-4 w-4" aria-hidden="true" /></Button>
        </header>

        <div className="mx-5 flex flex-wrap items-center gap-3 rounded-lg border border-border p-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><UserRound className="h-5 w-5" aria-hidden="true" /></span>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{student.fullName}</p><p className="text-xs text-muted">{student.studentCode}</p></div>
          <Badge variant={student.authorizationStatus === "AUTHORIZED" ? "success" : "destructive"}>{student.authorizationStatus === "AUTHORIZED" ? "Autorizado" : "Restringido"}</Badge>
          <div className="border-l border-border pl-3"><p className="text-base font-semibold">{initialIds.length}</p><p className="text-xs text-muted">casos asignados</p></div>
        </div>

        <div className="mx-5 mt-4 grid grid-cols-2 rounded-lg bg-slate-100 p-1" role="tablist" aria-label="Casos del investigador">
          <button type="button" role="tab" aria-selected={tab === "assigned"} onClick={() => { setTab("assigned"); setQuery(""); setPage(1); }} className={`rounded-lg px-3 py-2 text-sm font-medium ${tab === "assigned" ? "border border-primary bg-primary/5 text-primary" : "text-muted hover:text-content"}`}>Asignados ({assignedCases.length})</button>
          <button type="button" role="tab" aria-selected={tab === "available"} onClick={() => { setTab("available"); setQuery(""); setPage(1); }} className={`rounded-lg px-3 py-2 text-sm font-medium ${tab === "available" ? "border border-primary bg-primary/5 text-primary" : "text-muted hover:text-content"}`}>Disponibles ({availableCases.length})</button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-5 pt-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative block flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Buscar por identificador del caso" aria-label="Buscar por identificador del caso" className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-content outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-primary/30" /></label>
            <select value={order} onChange={(event) => { setOrder(event.target.value); setPage(1); }} aria-label="Ordenar casos" className="h-9 rounded-lg border border-border bg-surface px-3 text-sm text-content"><option value="receivedAt,desc">Más reciente</option><option value="receivedAt,asc">Más antiguo</option></select>
          </div>
          <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[470px] text-left text-xs"><thead className="bg-slate-50 text-muted dark:bg-slate-800"><tr><th scope="col" className="w-10 px-3 py-3"><span className="sr-only">Seleccionar</span></th><th scope="col" className="px-2 py-3">Identificador</th><th scope="col" className="px-2 py-3">Fecha de recepción</th><th scope="col" className="px-2 py-3">Estado</th></tr></thead>
                <tbody>{visible.map((item) => {
                  const checked = selectedSet.has(item.id);
                  const config = statusPresentation[item.status];
                  return <tr key={item.id} className="border-t border-slate-100 dark:border-slate-700"><td className="px-3 py-2.5"><input type="checkbox" checked={checked} disabled={!canEdit} onChange={() => setSelectedIds((current) => checked ? current.filter((id) => id !== item.id) : [...current, item.id])} aria-label={`${checked ? "Quitar" : "Asignar"} caso ${item.referenceCode}`} className="h-4 w-4 accent-primary disabled:cursor-not-allowed" /></td><td className="whitespace-nowrap px-2 py-2.5 font-medium">{item.referenceCode}</td><td className="whitespace-nowrap px-2 py-2.5 text-muted">{formatDate(item.receivedAt)}</td><td className="px-2 py-2.5"><Badge variant={config.variant} className="gap-1 whitespace-nowrap">{item.status === "ENABLED_FOR_PROCESSING" ? <Clock3 className="h-3.5 w-3.5" aria-hidden="true" /> : <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />}{config.label}</Badge></td></tr>;
                })}</tbody>
              </table>
              {isLoading && <p role="status" className="px-4 py-8 text-center text-sm text-muted">Cargando casos…</p>}
              {!isLoading && visible.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted">{source.length === 0 ? "No hay casos en esta sección." : "No hay casos que coincidan con la búsqueda."}</p>}
            </div>
            <div className="flex items-center justify-between gap-3 py-4 text-xs text-muted"><span>Mostrando {visible.length} de {ordered.length} casos</span><nav aria-label="Paginación de casos" className="flex items-center gap-1"><Button size="icon" variant="outline" disabled={page === 1} onClick={() => setPage((value) => value - 1)} aria-label="Página anterior"><ArrowLeft className="h-4 w-4" aria-hidden="true" /></Button>{Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => <Button key={number} size="icon" variant={page === number ? "default" : "outline"} aria-current={page === number ? "page" : undefined} onClick={() => setPage(number)} aria-label={`Página ${number}`}>{number}</Button>)}<Button size="icon" variant="outline" disabled={page === pageCount} onClick={() => setPage((value) => value + 1)} aria-label="Página siguiente"><ArrowRight className="h-4 w-4" aria-hidden="true" /></Button></nav></div>
          </div>
        </div>

        <footer className="flex flex-col gap-3 border-t border-border bg-surface px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted" aria-live="polite">{!canEdit ? "Este investigador no tiene autorización para nuevas asignaciones." : additions || removals ? `Se asignarán ${additions} y se retirarán ${removals}.` : "No hay cambios pendientes."}</p>
          <div className="flex gap-2"><Button variant="outline" className="flex-1 sm:flex-none" onClick={() => onOpenChange(false)}>Cancelar</Button><Button className="flex-1 sm:flex-none" disabled={!canEdit || (!additions && !removals) || saving || isLoading} onClick={() => void save()}>{saving ? "Guardando…" : "Guardar cambios"}</Button></div>
        </footer>
        {error && <p role="alert" className="px-5 pb-3 text-sm text-danger">{error}</p>}
        {confirmRemoval && <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/50 p-5"><div role="alertdialog" aria-modal="true" aria-labelledby="confirm-removal-title" className="w-full max-w-sm rounded-xl border border-border bg-surface p-5 shadow-xl"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 text-warning" aria-hidden="true" /><div><h3 id="confirm-removal-title" className="text-base font-semibold">Confirmar cambios</h3><p className="mt-2 text-sm leading-5 text-muted">Se retirarán {removals} casos de {student.fullName}. ¿Quieres continuar?</p></div></div><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={() => setConfirmRemoval(false)}>Volver</Button><Button onClick={() => void save()} disabled={saving}>{saving ? "Guardando…" : "Confirmar"}</Button></div></div></div>}
      </section>
    </div>,
    document.body,
  );
}
