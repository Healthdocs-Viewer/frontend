import React from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, FileText, Search, X } from "lucide-react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

export type Student = {
  id: string;
  name: string;
};

const drawerMotionStyles = `
  @keyframes student-drawer-in {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
  @keyframes student-drawer-backdrop-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @media (prefers-reduced-motion: no-preference) {
    .student-access-drawer { animation: student-drawer-in 280ms cubic-bezier(0.22, 1, 0.36, 1) both; }
    .student-access-backdrop { animation: student-drawer-backdrop-in 200ms ease-out both; }
  }
`;

export const academicStudents: Student[] = [
  { id: "EST-1033", name: "P. Torres" },
  { id: "EST-1042", name: "L. Gómez" },
  { id: "EST-1187", name: "A. Ruiz" },
  { id: "EST-1205", name: "M. Sánchez" },
  { id: "EST-0998", name: "C. Vega" },
  { id: "EST-1076", name: "D. Ramírez" },
  { id: "EST-1190", name: "L. Medina" },
  { id: "EST-1021", name: "F. Castillo" },
];

type StudentAccessDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
  caseStatus: string;
  initialSelectedIds: string[];
  onSave: (selectedIds: string[]) => void;
};

export function StudentAccessDrawer({
  open,
  onOpenChange,
  caseId,
  caseStatus,
  initialSelectedIds,
  onSave,
}: StudentAccessDrawerProps) {
  const [query, setQuery] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState(initialSelectedIds);
  const dialogRef = React.useRef<HTMLElement>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!open) return;
    setSelectedIds(initialSelectedIds);
    setQuery("");
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
      if (event.key === "Tab") {
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
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [open, initialSelectedIds, onOpenChange]);

  if (!open) return null;

  const initialSet = new Set(initialSelectedIds);
  const currentSet = new Set(selectedIds);
  const additions = selectedIds.filter((id) => !initialSet.has(id)).length;
  const removals = initialSelectedIds.filter((id) => !currentSet.has(id)).length;
  const visibleStudents = academicStudents.filter((student) =>
    `${student.id} ${student.name}`.toLowerCase().includes(query.toLowerCase()),
  );

  const content = (
    <div className="fixed inset-0 z-50" onMouseDown={(event) => {
      if (!dialogRef.current?.contains(event.target as Node)) onOpenChange(false);
    }}>
      <style>{drawerMotionStyles}</style>
      <div className="student-access-backdrop absolute inset-0 bg-slate-950/40" aria-hidden="true" />
      <section
        role="dialog"
        ref={dialogRef}
        aria-modal="true"
        aria-labelledby="student-access-title"
        aria-describedby="student-access-description"
        className="student-access-drawer absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-border bg-surface text-content shadow-xl"
      >
        <header className="flex items-start justify-between gap-4 px-5 pb-4 pt-5">
          <div className="min-w-0">
            <h2 id="student-access-title" className="text-xl font-semibold leading-6">Gestionar acceso de estudiantes</h2>
            <p id="student-access-description" className="mt-1 text-sm leading-5 text-muted">Agrega o retira estudiantes autorizados.</p>
          </div>
          <Button ref={closeButtonRef} variant="secondary" size="icon" onClick={() => onOpenChange(false)} aria-label="Cerrar panel" className="h-8 w-8 shrink-0">
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </header>

        <div className="mx-5 flex items-center justify-between gap-3 rounded-lg border border-border p-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary dark:bg-primary/20">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="truncate text-sm font-semibold">{caseId}</span>
          </div>
          <Badge variant="success" className="shrink-0 whitespace-nowrap"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />{caseStatus}</Badge>
        </div>

        <label className="relative mx-5 mt-4 block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre o identificador"
            aria-label="Buscar estudiantes por nombre o identificador"
            className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-content outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-primary/30"
          />
        </label>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-2" role="group" aria-label="Estudiantes autorizados">
          {visibleStudents.map((student) => {
            const checked = selectedIds.includes(student.id);
            return (
              <label key={student.id} className="flex min-h-[61px] cursor-pointer items-center gap-4 border-b border-slate-100 dark:border-slate-700">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => setSelectedIds((current) => checked ? current.filter((id) => id !== student.id) : [...current, student.id])}
                  className="h-5 w-5 shrink-0 cursor-pointer accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  aria-label={`${checked ? "Quitar acceso de" : "Dar acceso a"} ${student.id} · ${student.name}`}
                />
                <span className="min-w-0 py-2">
                  <span className="block truncate text-sm font-medium text-content">{student.id} · {student.name}</span>
                  <span className="mt-0.5 block text-xs text-muted">{student.id}</span>
                </span>
              </label>
            );
          })}
          {visibleStudents.length === 0 && (
            <p className="py-8 text-center text-sm text-muted">No hay estudiantes que coincidan con la búsqueda.</p>
          )}
        </div>

        <footer className="flex flex-col gap-3 border-t border-border bg-surface px-5 py-4 shadow-[0_-8px_20px_-16px_rgba(15,23,42,0.35)] sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted" aria-live="polite">
            {additions === 0 && removals === 0 ? "No hay cambios pendientes." : `Se agregarán ${additions} y se quitarán ${removals}.`}
          </p>
          <div className="flex shrink-0 justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={() => { onSave(selectedIds); onOpenChange(false); }} disabled={additions === 0 && removals === 0}>Guardar cambios</Button>
          </div>
        </footer>
      </section>
    </div>
  );

  return createPortal(content, document.body);
}
