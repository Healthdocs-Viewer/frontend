import React from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, FileText, Search, X } from "lucide-react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { getAcademicStudents, getStudentAssignmentsForCase } from "../../services/academicStudents";
import type { AcademicStudent } from "../../types/academicStudents";

const drawerMotionStyles = `
  @keyframes student-drawer-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
  @keyframes student-drawer-backdrop-in { from { opacity: 0; } to { opacity: 1; } }
  @media (prefers-reduced-motion: no-preference) {
    .student-access-drawer { animation: student-drawer-in 280ms cubic-bezier(0.22, 1, 0.36, 1) both; }
    .student-access-backdrop { animation: student-drawer-backdrop-in 200ms ease-out both; }
  }
`;

type StudentAccessDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
  caseUuid: string;
  caseStatus: string;
  onSave: (selectedIds: string[], expectedVersion: number) => Promise<void>;
};

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
}

export function StudentAccessDrawer({
  open,
  onOpenChange,
  caseId,
  caseUuid,
  caseStatus,
  onSave,
}: StudentAccessDrawerProps) {
  const [query, setQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [students, setStudents] = React.useState<AcademicStudent[]>([]);
  const [directoryPage, setDirectoryPage] = React.useState(0);
  const [directoryTotalPages, setDirectoryTotalPages] = React.useState(1);
  const [knownStudentsById, setKnownStudentsById] = React.useState<Record<string, AcademicStudent>>({});
  const [studentsLoading, setStudentsLoading] = React.useState(false);
  const [studentsError, setStudentsError] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [initialIds, setInitialIds] = React.useState<string[]>([]);
  const [assignmentVersion, setAssignmentVersion] = React.useState<number | null>(null);
  const [assignmentsLoading, setAssignmentsLoading] = React.useState(false);
  const [assignmentsError, setAssignmentsError] = React.useState("");
  const [discardConfirmationOpen, setDiscardConfirmationOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState("");
  const [reloadToken, setReloadToken] = React.useState(0);
  const dialogRef = React.useRef<HTMLElement>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const keepEditingRef = React.useRef<HTMLButtonElement>(null);
  const onOpenChangeRef = React.useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  const currentSet = new Set(selectedIds);
  const initialSet = new Set(initialIds);
  const additions = selectedIds.filter((id) => !initialSet.has(id)).length;
  const removals = initialIds.filter((id) => !currentSet.has(id)).length;
  const hasChanges = additions > 0 || removals > 0;
  const visibleStudents = React.useMemo(() => {
    const selectedStudents = selectedIds.map((id) => knownStudentsById[id]).filter((student): student is AcademicStudent => Boolean(student));
    return [...new Map([...selectedStudents, ...students].map((student) => [student.userId, student])).values()];
  }, [selectedIds, knownStudentsById, students]);

  React.useEffect(() => {
    if (!open) return;
    setQuery("");
    setDebouncedQuery("");
    setStudents([]);
    setDirectoryPage(0);
    setDirectoryTotalPages(1);
    setKnownStudentsById({});
    setSelectedIds([]);
    setInitialIds([]);
    setAssignmentVersion(null);
    setStudentsError("");
    setAssignmentsError("");
    setSaveError("");
    setDiscardConfirmationOpen(false);
    setStudentsLoading(true);
    setAssignmentsLoading(true);
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open, caseUuid]);

  React.useEffect(() => {
    if (!open) return;
    let active = true;
    setAssignmentsLoading(true);
    setAssignmentsError("");
    getStudentAssignmentsForCase(caseUuid)
      .then((assignment) => {
        if (!active) return;
        setInitialIds(assignment.studentIds);
        setSelectedIds(assignment.studentIds);
        setKnownStudentsById(Object.fromEntries(assignment.students.map((student) => [student.userId, student])));
        setAssignmentVersion(assignment.assignmentVersion);
      })
      .catch(() => { if (active) setAssignmentsError("No se pudieron cargar los accesos actuales."); })
      .finally(() => { if (active) setAssignmentsLoading(false); });
    return () => { active = false; };
  }, [open, caseUuid, reloadToken]);

  React.useEffect(() => {
    if (!open) return;
    let active = true;
    setStudentsLoading(true);
    if (directoryPage === 0) setStudents([]);
    getAcademicStudents(debouncedQuery, directoryPage, 100)
      .then((response) => { if (active) { setStudents((current) => directoryPage === 0 ? response.items : [...new Map([...current, ...response.items].map((student) => [student.userId, student])).values()]); setDirectoryTotalPages(response.totalPages); setKnownStudentsById((current) => ({ ...current, ...Object.fromEntries(response.items.map((student) => [student.userId, student])) })); setStudentsError(""); } })
      .catch(() => { if (active) setStudentsError("No se pudo cargar el directorio de investigadores."); })
      .finally(() => { if (active) setStudentsLoading(false); });
    return () => { active = false; };
  }, [open, caseUuid, debouncedQuery, directoryPage, reloadToken]);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      const nextQuery = query.trim();
      if (nextQuery !== debouncedQuery) {
        setStudents([]);
        setDirectoryPage(0);
      }
      setDebouncedQuery(nextQuery);
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [query, debouncedQuery]);

  React.useEffect(() => {
    if (discardConfirmationOpen) keepEditingRef.current?.focus();
  }, [discardConfirmationOpen]);

  const requestClose = () => {
    if (isSaving) return;
    if (hasChanges) setDiscardConfirmationOpen(true);
    else onOpenChangeRef.current(false);
  };

  const discardAndClose = () => {
    setSelectedIds(initialIds);
    setDiscardConfirmationOpen(false);
    onOpenChangeRef.current(false);
  };

  const saveChanges = async () => {
    if (assignmentVersion === null || isSaving) return;
    setIsSaving(true);
    setSaveError("");
    try {
      await onSave(selectedIds, assignmentVersion);
      setInitialIds(selectedIds);
      setDiscardConfirmationOpen(false);
      onOpenChangeRef.current(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "No se pudieron guardar los cambios. Inténtalo de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  const reloadAssignments = async () => {
    setAssignmentsLoading(true);
    setSaveError("");
    try {
      const assignment = await getStudentAssignmentsForCase(caseUuid);
      setInitialIds(assignment.studentIds);
      setSelectedIds(assignment.studentIds);
      setKnownStudentsById((current) => ({
        ...current,
        ...Object.fromEntries(assignment.students.map((student) => [student.userId, student])),
      }));
      setAssignmentVersion(assignment.assignmentVersion);
    } catch {
      setSaveError("No se pudieron recargar las asignaciones. Inténtalo de nuevo.");
    } finally {
      setAssignmentsLoading(false);
    }
  };

  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (discardConfirmationOpen) {
          setDiscardConfirmationOpen(false);
          closeButtonRef.current?.focus();
        }
        else requestClose();
      }
      if (event.key === "Tab") {
        const focusScope = discardConfirmationOpen
          ? dialogRef.current?.querySelector('[role="alertdialog"]')
          : dialogRef.current;
        const focusable = focusScope?.querySelectorAll<HTMLElement>(
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
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, discardConfirmationOpen, hasChanges, isSaving]);

  if (!open) return null;

  const content = (
    <div className="fixed inset-0 z-50" onMouseDown={(event) => {
      if (event.target === event.currentTarget) requestClose();
    }}>
      <style>{drawerMotionStyles}</style>
      <div className="student-access-backdrop absolute inset-0 bg-slate-950/40" aria-hidden="true" onMouseDown={requestClose} />
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
            <h2 id="student-access-title" className="text-xl font-semibold leading-6">Gestionar acceso de investigadores</h2>
            <p id="student-access-description" className="mt-1 text-sm leading-5 text-muted">Agrega o retira investigadores autorizados.</p>
          </div>
          <Button ref={closeButtonRef} variant="secondary" size="icon" onClick={requestClose} aria-label="Cerrar panel" className="h-8 w-8 shrink-0">
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </header>

        <div className="mx-5 flex items-center justify-between gap-3 rounded-lg border border-border p-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary dark:bg-primary/20"><FileText className="h-5 w-5" aria-hidden="true" /></span>
            <span className="truncate text-sm font-semibold">{caseId}</span>
          </div>
          <Badge variant="success" className="shrink-0 whitespace-nowrap"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />{caseStatus}</Badge>
        </div>

        <label className="relative mx-5 mt-4 block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre, correo o código"
            aria-label="Buscar investigadores por nombre, correo o código"
            className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-content outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-primary/30"
          />
        </label>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-2" role="group" aria-label="Investigadores con acceso al caso">
          {assignmentsLoading && <p role="status" className="py-8 text-center text-sm text-muted">Cargando accesos actuales…</p>}
          {!assignmentsLoading && studentsLoading && <p role="status" className="py-2 text-center text-xs text-muted">Buscando investigadores…</p>}
          {!assignmentsLoading && (studentsError || assignmentsError) && <div className="py-6 text-center"><p role="alert" className="text-sm text-danger">{studentsError || assignmentsError}</p><Button variant="outline" className="mt-3" onClick={() => setReloadToken((value) => value + 1)}>Reintentar</Button></div>}
          {!assignmentsLoading && !studentsError && !assignmentsError && visibleStudents.map((student) => {
            const checked = selectedIds.includes(student.userId);
            const eligible = student.authorizationStatus === "AUTHORIZED";
            const disabled = !eligible && !checked;
            return (
              <label key={student.userId} className={`flex min-h-[66px] items-center gap-4 border-b border-slate-100 dark:border-slate-700 ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled || assignmentsLoading || isSaving}
                  onChange={() => setSelectedIds((current) => checked ? current.filter((id) => id !== student.userId) : [...current, student.userId])}
                  className="h-5 w-5 shrink-0 cursor-pointer accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  aria-label={`${checked ? "Quitar acceso de" : "Dar acceso a"} ${student.fullName}`}
                />
                <span className="min-w-0 flex-1 py-2">
                  <span className="block truncate text-sm font-medium text-content">{student.fullName}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted">{student.studentCode} · {student.email}</span>
                </span>
                {!eligible && <span className="shrink-0 text-[11px] text-muted">{student.authorizationStatus === "PENDING" ? "Pendiente" : "Restringido"}</span>}
              </label>
            );
          })}
          {!assignmentsLoading && !studentsError && !assignmentsError && directoryPage + 1 < directoryTotalPages && <div className="py-3 text-center"><Button variant="outline" size="sm" disabled={studentsLoading} onClick={() => setDirectoryPage((current) => current + 1)}>Cargar más investigadores</Button></div>}
          {!assignmentsLoading && !studentsLoading && !studentsError && !assignmentsError && query && students.length === 0 && visibleStudents.length > 0 && (
            <p className="py-3 text-center text-xs text-muted">Sin coincidencias nuevas. Conservamos visibles tus investigadores seleccionados.</p>
          )}
          {!assignmentsLoading && !studentsLoading && !studentsError && !assignmentsError && visibleStudents.length === 0 && (
            <div className="py-8 text-center text-sm text-muted"><p>No hay investigadores que coincidan con la búsqueda.</p>{query && <Button variant="ghost" className="mt-2" onClick={() => setQuery("")}>Limpiar búsqueda</Button>}</div>
          )}
        </div>

        <footer className="flex flex-col gap-3 border-t border-border bg-surface px-5 py-4 shadow-[0_-8px_20px_-16px_rgba(15,23,42,0.35)] sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted" aria-live="polite">{additions === 0 && removals === 0 ? "No hay cambios pendientes." : `Se agregarán ${additions} y se quitarán ${removals}.`}</p>
          <div className="flex shrink-0 justify-end gap-2">
            <Button variant="outline" onClick={requestClose} disabled={isSaving}>Cancelar</Button>
            <Button onClick={saveChanges} disabled={!hasChanges || assignmentsLoading || assignmentVersion === null || Boolean(studentsError || assignmentsError)} loading={isSaving}>Guardar cambios</Button>
          </div>
        </footer>

        {discardConfirmationOpen && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/35 p-5">
            <section role="alertdialog" aria-modal="true" aria-labelledby="discard-title" aria-describedby="discard-description" className="w-full max-w-sm rounded-xl border border-border bg-surface p-5 text-content shadow-2xl">
              <h3 id="discard-title" className="text-base font-semibold">¿Descartar los cambios?</h3>
              <p id="discard-description" className="mt-2 text-sm leading-5 text-muted">Tienes cambios sin guardar. Si sales, se perderán.</p>
              <footer className="mt-5 flex justify-end gap-2">
                <Button ref={keepEditingRef} variant="outline" onClick={() => { setDiscardConfirmationOpen(false); closeButtonRef.current?.focus(); }}>Seguir editando</Button>
                <Button variant="destructive" onClick={discardAndClose}>Descartar cambios</Button>
              </footer>
            </section>
          </div>
        )}
        {saveError && <div className="absolute bottom-20 left-5 right-5 flex items-center justify-between gap-3 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger"><p role="alert">{saveError}</p>{saveError.includes("cambiaron") && <Button size="sm" variant="outline" onClick={reloadAssignments} disabled={assignmentsLoading}>Recargar</Button>}</div>}
      </section>
    </div>
  );

  return createPortal(content, document.body);
}
