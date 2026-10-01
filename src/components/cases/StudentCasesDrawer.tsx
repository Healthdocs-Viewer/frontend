import React from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Clock3, FileText, Search, UserRound, UsersRound, X } from "lucide-react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

export type AcademicCaseStatus = "Asignado" | "En procesamiento" | "Corrección requerida" | "Resultado cargado" | "Disponible para el paciente";
export type AcademicCaseOption = { id: string; receivedAt: string; status: AcademicCaseStatus };

// Casos de demostración para la interfaz de asignación.
export const academicCaseOptions: AcademicCaseOption[] = [
  { id: "CAS-20260921-0042", receivedAt: "2026-09-21T14:32:00", status: "En procesamiento" },
  { id: "CAS-20260919-0031", receivedAt: "2026-09-19T09:48:00", status: "Corrección requerida" },
  { id: "CAS-20260915-0013", receivedAt: "2026-09-15T09:26:00", status: "Asignado" },
  { id: "CAS-20260910-0027", receivedAt: "2026-09-10T11:20:00", status: "Resultado cargado" },
  { id: "CAS-20260905-0018", receivedAt: "2026-09-05T16:14:00", status: "Disponible para el paciente" },
  { id: "CAS-20260904-0016", receivedAt: "2026-09-04T10:10:00", status: "Asignado" },
  { id: "CAS-20260903-0015", receivedAt: "2026-09-03T12:40:00", status: "En procesamiento" },
  { id: "CAS-20260902-0014", receivedAt: "2026-09-02T08:35:00", status: "Asignado" },
  { id: "CAS-20260830-0012", receivedAt: "2026-08-30T15:08:00", status: "Resultado cargado" },
  { id: "CAS-20260828-0011", receivedAt: "2026-08-28T09:15:00", status: "Asignado" },
  { id: "CAS-20260825-0010", receivedAt: "2026-08-25T13:05:00", status: "Corrección requerida" },
  { id: "CAS-20260823-0009", receivedAt: "2026-08-23T11:32:00", status: "Asignado" },
  { id: "CAS-20260820-0008", receivedAt: "2026-08-20T14:45:00", status: "En procesamiento" },
  { id: "CAS-20260818-0007", receivedAt: "2026-08-18T10:12:00", status: "Asignado" },
  { id: "CAS-20260815-0006", receivedAt: "2026-08-15T16:20:00", status: "Resultado cargado" },
  { id: "CAS-20260812-0005", receivedAt: "2026-08-12T08:50:00", status: "Asignado" },
  { id: "CAS-20260810-0004", receivedAt: "2026-08-10T09:40:00", status: "Asignado" },
];

const formatDate = (value: string) => new Intl.DateTimeFormat("es-CO", {
  day: "numeric", month: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
}).format(new Date(value));

const statusConfig: Record<AcademicCaseStatus, { variant: "default" | "info" | "warning" | "success"; icon: typeof FileText }> = {
  Asignado: { variant: "default", icon: UserRound },
  "En procesamiento": { variant: "info", icon: Clock3 },
  "Corrección requerida": { variant: "warning", icon: AlertTriangle },
  "Resultado cargado": { variant: "success", icon: CheckCircle2 },
  "Disponible para el paciente": { variant: "success", icon: FileText },
};

type StudentCasesDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: { id: string; name: string; status: "Autorizado" | "Pendiente" | "Restringido" } | null;
  assignedCaseIds: string[];
  onSave: (studentId: string, caseIds: string[]) => void;
};

const drawerMotionStyles = `
  @keyframes student-cases-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
  @keyframes student-cases-backdrop-in { from { opacity: 0; } to { opacity: 1; } }
  @media (prefers-reduced-motion: no-preference) {
    .student-cases-drawer { animation: student-cases-in 280ms cubic-bezier(0.22, 1, 0.36, 1) both; }
    .student-cases-backdrop { animation: student-cases-backdrop-in 200ms ease-out both; }
  }
`;

export function StudentCasesDrawer({ open, onOpenChange, student, assignedCaseIds, onSave }: StudentCasesDrawerProps) {
  const [tab, setTab] = React.useState<"assigned" | "available">("assigned");
  const [query, setQuery] = React.useState("");
  const [order, setOrder] = React.useState("newest");
  const [page, setPage] = React.useState(1);
  const [selectedIds, setSelectedIds] = React.useState<string[]>(assignedCaseIds);
  const [confirmRemoval, setConfirmRemoval] = React.useState(false);
  const dialogRef = React.useRef<HTMLElement>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const confirmRemovalRef = React.useRef(false);

  React.useEffect(() => { confirmRemovalRef.current = confirmRemoval; }, [confirmRemoval]);

  React.useEffect(() => {
    if (!open) return;
    setTab("assigned");
    setQuery("");
    setOrder("newest");
    setPage(1);
    setSelectedIds(assignedCaseIds);
    setConfirmRemoval(false);
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (confirmRemovalRef.current) setConfirmRemoval(false);
        else onOpenChange(false);
      }
      if (event.key !== "Tab") return;
      const focusRoot = confirmRemovalRef.current
        ? dialogRef.current?.querySelector<HTMLElement>('[role="alertdialog"]')
        : dialogRef.current;
      const focusable = focusRoot?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [open, student?.id, onOpenChange]);

  React.useEffect(() => {
    if (confirmRemoval) dialogRef.current?.querySelector<HTMLElement>('[role="alertdialog"] button')?.focus();
  }, [confirmRemoval]);

  if (!open || !student) return null;

  const initialSet = new Set(assignedCaseIds);
  const selectedSet = new Set(selectedIds);
  const additions = selectedIds.filter((id) => !initialSet.has(id)).length;
  const removals = assignedCaseIds.filter((id) => !selectedSet.has(id)).length;
  const assignedCases = academicCaseOptions.filter((item) => initialSet.has(item.id));
  const availableCases = academicCaseOptions.filter((item) => !initialSet.has(item.id));
  const source = tab === "assigned" ? assignedCases : availableCases;
  const filtered = source.filter((item) => item.id.toLowerCase().includes(query.trim().toLowerCase()));
  const ordered = [...filtered].sort((a, b) => order === "oldest"
    ? a.receivedAt.localeCompare(b.receivedAt)
    : order === "id" ? a.id.localeCompare(b.id) : b.receivedAt.localeCompare(a.receivedAt));
  const pageCount = Math.max(1, Math.ceil(ordered.length / 10));
  const visible = ordered.slice((page - 1) * 10, page * 10);
  const canEdit = student.status === "Autorizado";

  const save = () => {
    if (removals && !confirmRemoval) { setConfirmRemoval(true); return; }
    onSave(student.id, selectedIds);
    onOpenChange(false);
  };

  return createPortal(
    <div className="fixed inset-0 z-50" onMouseDown={(event) => {
      if (confirmRemoval) return;
      if (!dialogRef.current?.contains(event.target as Node)) onOpenChange(false);
    }}>
      <style>{drawerMotionStyles}</style>
      <div className="student-cases-backdrop absolute inset-0 bg-slate-950/40" aria-hidden="true" />
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="student-cases-title" aria-describedby="student-cases-description" className="student-cases-drawer absolute inset-y-0 right-0 flex w-full max-w-xl flex-col border-l border-border bg-surface text-content shadow-xl">
        <header className="flex items-start justify-between gap-4 px-5 pb-4 pt-5">
          <div className="min-w-0">
            <h2 id="student-cases-title" className="text-base font-semibold">Gestionar casos de {student.name}</h2>
            <p id="student-cases-description" className="mt-1 text-sm leading-5 text-muted">Consulta, asigna o retira casos académicos de este estudiante.</p>
          </div>
          <Button ref={closeButtonRef} variant="secondary" size="icon" onClick={() => onOpenChange(false)} aria-label="Cerrar panel" className="shrink-0"><X className="h-4 w-4" aria-hidden="true" /></Button>
        </header>

        <div className="mx-5 flex flex-wrap items-center gap-3 rounded-lg border border-border p-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary dark:bg-primary/20"><UsersRound className="h-5 w-5" aria-hidden="true" /></span>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{student.name}</p><p className="text-xs text-muted">{student.id}</p></div>
          <Badge variant={student.status === "Autorizado" ? "success" : student.status === "Pendiente" ? "warning" : "destructive"}>{student.status}</Badge>
          <div className="border-l border-border pl-3"><p className="text-base font-semibold">{assignedCaseIds.length}</p><p className="text-xs text-muted">casos asignados</p></div>
        </div>

        <div className="mx-5 mt-4 grid grid-cols-2 rounded-lg bg-slate-100 p-1 dark:bg-slate-800" role="tablist" aria-label="Casos del estudiante">
          <button type="button" role="tab" aria-selected={tab === "assigned"} onClick={() => { setTab("assigned"); setQuery(""); setPage(1); }} className={`rounded-lg px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${tab === "assigned" ? "border border-primary bg-primary/5 text-primary dark:bg-primary/20" : "text-muted hover:text-content"}`}>Asignados ({assignedCases.length})</button>
          <button type="button" role="tab" aria-selected={tab === "available"} onClick={() => { setTab("available"); setQuery(""); setPage(1); }} className={`rounded-lg px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${tab === "available" ? "border border-primary bg-primary/5 text-primary dark:bg-primary/20" : "text-muted hover:text-content"}`}>Disponibles ({availableCases.length})</button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-5 pt-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative block flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Buscar por identificador del caso" aria-label="Buscar por identificador del caso" className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-content outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-primary/30" />
            </label>
            <select value={order} onChange={(event) => { setOrder(event.target.value); setPage(1); }} aria-label="Ordenar casos" className="h-9 rounded-lg border border-border bg-surface px-3 text-sm text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <option value="newest">Más reciente</option><option value="oldest">Más antiguo</option><option value="id">Identificador A–Z</option>
            </select>
          </div>
          <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[470px] text-left text-xs">
                <thead className="bg-slate-50 text-muted dark:bg-slate-800"><tr><th scope="col" className="w-10 px-3 py-3"><span className="sr-only">Seleccionar</span></th><th scope="col" className="px-2 py-3">Identificador</th><th scope="col" className="px-2 py-3">Fecha de recepción</th><th scope="col" className="px-2 py-3">Estado</th></tr></thead>
                <tbody>{visible.map((item) => {
                  const { icon: Icon, variant } = statusConfig[item.status];
                  const checked = selectedSet.has(item.id);
                  return <tr key={item.id} className="border-t border-slate-100 dark:border-slate-700">
                    <td className="px-3 py-2.5"><input type="checkbox" checked={checked} disabled={!canEdit} onChange={() => setSelectedIds((current) => checked ? current.filter((id) => id !== item.id) : [...current, item.id])} aria-label={`${checked ? "Quitar" : "Asignar"} caso ${item.id}`} className="h-4 w-4 cursor-pointer accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed" /></td>
                    <td className="whitespace-nowrap px-2 py-2.5 font-medium">{item.id}</td>
                    <td className="whitespace-nowrap px-2 py-2.5 text-muted">{formatDate(item.receivedAt)}</td>
                    <td className="px-2 py-2.5"><Badge variant={variant} className="gap-1 whitespace-nowrap"><Icon className="h-3.5 w-3.5" aria-hidden="true" />{item.status}</Badge></td>
                  </tr>;
                })}</tbody>
              </table>
              {visible.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted">{source.length === 0 ? "No hay casos en esta sección." : "No hay casos que coincidan con la búsqueda."}</p>}
            </div>
            <div className="flex items-center justify-between gap-3 py-4 text-xs text-muted"><span>Mostrando {visible.length} de {ordered.length} casos</span><nav aria-label="Paginación de casos" className="flex items-center gap-1"><Button size="icon" variant="outline" disabled={page === 1} onClick={() => setPage((value) => value - 1)} aria-label="Página anterior"><ArrowLeft className="h-4 w-4" aria-hidden="true" /></Button><Button size="icon" aria-current="page" aria-label={`Página ${page}`}>{page}</Button><Button size="icon" variant="outline" disabled={page === pageCount} onClick={() => setPage((value) => value + 1)} aria-label="Página siguiente"><ArrowRight className="h-4 w-4" aria-hidden="true" /></Button></nav></div>
          </div>
        </div>

        <footer className="flex flex-col gap-3 border-t border-border bg-surface px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted" aria-live="polite">{!canEdit ? "Este estudiante no tiene autorización para nuevas asignaciones." : additions || removals ? `Se asignarán ${additions} y se retirarán ${removals}.` : "No hay cambios pendientes."}</p>
          <div className="flex gap-2"><Button variant="outline" className="flex-1 sm:flex-none" onClick={() => onOpenChange(false)}>Cancelar</Button><Button className="flex-1 sm:flex-none" disabled={!canEdit || (!additions && !removals)} onClick={save}>Guardar cambios</Button></div>
        </footer>
        {confirmRemoval && <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/50 p-5"><div role="alertdialog" aria-modal="true" aria-labelledby="confirm-removal-title" className="w-full max-w-sm rounded-xl border border-border bg-surface p-5 shadow-xl"><h3 id="confirm-removal-title" className="text-base font-semibold">Confirmar cambios</h3><p className="mt-2 text-sm leading-5 text-muted">Se retirarán {removals} casos de {student.name}. Los cambios se guardarán en esta vista de demostración.</p><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={() => setConfirmRemoval(false)}>Volver</Button><Button onClick={save}>Confirmar</Button></div></div></div>}
      </section>
    </div>,
    document.body,
  );
}
