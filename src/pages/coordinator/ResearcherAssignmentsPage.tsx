import React from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  FileText,
  FolderOpen,
  Search,
  UsersRound,
} from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { StudentCasesDrawer } from "../../components/cases/StudentCasesDrawer";
import {
  getAcademicStudents,
  getCasesForStudent,
  saveCasesForStudent,
} from "../../services/academicStudents";
import type {
  AcademicStudent,
  AcademicStudentCase,
  AcademicStudentsResponse,
  StudentAuthorizationStatus,
  StudentSortField,
} from "../../types/academicStudents";

type SortKey = StudentSortField;

const statusLabels: Record<StudentAuthorizationStatus, string> = {
  AUTHORIZED: "Autorizado",
  RESTRICTED: "Restringido",
};

const pageSize = 8;

export function ResearcherAssignmentsPage() {
  const [response, setResponse] = React.useState<AcademicStudentsResponse | null>(null);
  const [query, setQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [sort, setSort] = React.useState<{ key: SortKey; ascending: boolean } | null>(null);
  const [page, setPage] = React.useState(1);
  const [selectedStudent, setSelectedStudent] = React.useState<AcademicStudent | null>(null);
  const [studentCases, setStudentCases] = React.useState<AcademicStudentCase[]>([]);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [casesLoading, setCasesLoading] = React.useState(false);
  const [feedback, setFeedback] = React.useState("");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let active = true;
    getAcademicStudents()
      .then((data) => { if (active) setResponse(data); })
      .catch(() => { if (active) setError("No se pudieron cargar los investigadores."); });
    return () => { active = false; };
  }, []);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query), 300);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const students = response?.items ?? [];
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
  const filtered = students.filter((student) =>
    `${student.fullName} ${student.studentCode} ${student.email}`
      .split(" ")
      .map(normalize)
      .join(" ")
      .includes(normalize(debouncedQuery.trim())),
  );
  const collator = new Intl.Collator("es", { sensitivity: "base", numeric: true });
  const ordered = sort
    ? [...filtered].sort((a, b) => {
        const left = sort.key === "name" ? a.fullName
          : sort.key === "studentCode" ? a.studentCode
            : sort.key === "authorizationStatus" ? statusLabels[a.authorizationStatus]
              : sort.key === "assignedCaseCount" ? a.assignedCaseCount
                : a.email;
        const right = sort.key === "name" ? b.fullName
          : sort.key === "studentCode" ? b.studentCode
            : sort.key === "authorizationStatus" ? statusLabels[b.authorizationStatus]
              : sort.key === "assignedCaseCount" ? b.assignedCaseCount
                : b.email;
        const result = typeof left === "number" && typeof right === "number"
          ? left - right
          : collator.compare(String(left), String(right));
        return sort.ascending ? result : -result;
      })
    : [...filtered].sort((a, b) => collator.compare(a.fullName, b.fullName));
  const pageCount = Math.max(1, Math.ceil(ordered.length / pageSize));
  const visible = ordered.slice((page - 1) * pageSize, page * pageSize);

  const changeSort = (key: SortKey) => {
    setSort((current) => ({ key, ascending: current?.key === key ? !current.ascending : true }));
    setPage(1);
  };
  const header = (label: string, key: SortKey) => (
    <button type="button" onClick={() => changeSort(key)} className="inline-flex items-center gap-1.5 hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label={`Ordenar por ${label}`}>
      {label}
      {sort?.key === key ? sort.ascending ? <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" /> : <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" /> : <ArrowDown className="h-3.5 w-3.5 opacity-50" aria-hidden="true" />}
    </button>
  );
  const statusBadge = (student: AcademicStudent) => (
    <Badge variant={student.authorizationStatus === "AUTHORIZED" ? "success" : "destructive"} className="gap-2 whitespace-nowrap">
      <span className={`h-2 w-2 rounded-full ${student.authorizationStatus === "AUTHORIZED" ? "bg-success" : "bg-danger"}`} aria-hidden="true" />
      {statusLabels[student.authorizationStatus]}
    </Badge>
  );
  const openStudentCases = async (student: AcademicStudent) => {
    setSelectedStudent(student);
    setStudentCases([]);
    setCasesLoading(true);
    setDrawerOpen(true);
    try {
      const data = await getCasesForStudent(student.userId);
      setStudentCases(data.items);
    } catch {
      setError("No se pudieron cargar los casos del investigador.");
    } finally {
      setCasesLoading(false);
    }
  };
  const saveAssignments = async (studentId: string, caseIds: string[]) => {
    try {
      await saveCasesForStudent(studentId, { caseIds });
      setResponse(await getAcademicStudents());
      setFeedback("Los casos asignados se actualizaron en esta vista de demostración.");
    } catch {
      setError("No se pudieron guardar las asignaciones.");
      throw new Error("No se pudieron guardar las asignaciones.");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex gap-5 p-5 sm:p-6">
          <div className="w-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
          <div>
            <h1 className="text-2xl font-semibold text-content">Investigadores</h1>
            <p className="mt-1 text-sm leading-5 text-muted">Consulta investigadores autorizados y gestiona sus casos.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block w-full lg:max-w-lg">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Buscar por nombre, ID o correo" aria-label="Buscar investigadores por nombre, identificador o correo" className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-content outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-primary/30" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="shadow-none"><CardContent className="flex items-center gap-3 p-3 sm:min-w-56"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary dark:bg-primary/20"><UsersRound className="h-5 w-5" aria-hidden="true" /></span><div><p className="text-xs text-muted">Investigadores autorizados</p><p className="text-2xl font-bold text-content">{response?.summary.authorizedStudents ?? 0}</p></div></CardContent></Card>
            <Card className="shadow-none"><CardContent className="flex items-center gap-3 p-3 sm:min-w-56"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-info/10 text-info"><FileText className="h-5 w-5" aria-hidden="true" /></span><div><p className="text-xs text-muted">Casos asignados</p><p className="text-2xl font-bold text-content">{response?.summary.totalAssignedCases ?? 0}</p></div></CardContent></Card>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-muted dark:bg-slate-800"><tr>
              <th scope="col" className="px-5 py-3">{header("Nombre", "name")}</th>
              <th scope="col" className="px-5 py-3">{header("Identificador", "studentCode")}</th>
              <th scope="col" className="px-5 py-3">{header("Correo", "email")}</th>
              <th scope="col" className="px-5 py-3">{header("Estado de autorización", "authorizationStatus")}</th>
              <th scope="col" className="px-5 py-3">{header("Casos asignados", "assignedCaseCount")}</th>
              <th scope="col" className="px-5 py-3">Acciones</th>
            </tr></thead>
            <tbody>
              {visible.map((student) => (
                <tr key={student.userId} className="border-t border-slate-100 text-content hover:bg-slate-50/70 dark:border-slate-700 dark:hover:bg-slate-800/60">
                  <td className="whitespace-nowrap px-5 py-2.5 font-medium">{student.fullName}</td>
                  <td className="whitespace-nowrap px-5 py-2.5 text-muted">{student.studentCode}</td>
                  <td className="whitespace-nowrap px-5 py-2.5 text-muted">{student.email}</td>
                  <td className="px-5 py-2.5">{statusBadge(student)}</td>
                  <td className="px-5 py-2.5 text-muted">{student.assignedCaseCount}</td>
                  <td className="px-5 py-2.5"><Button variant="outline" size="sm" onClick={() => void openStudentCases(student)} className="whitespace-nowrap text-content"><FolderOpen className="h-4 w-4" aria-hidden="true" />{student.authorizationStatus === "RESTRICTED" ? "Ver casos" : "Gestionar casos"}</Button></td>
                </tr>
              ))}
              {visible.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-muted">No hay investigadores que coincidan con la búsqueda.</td></tr>}
            </tbody>
          </table>
        </div>
        {!response && !error && <p role="status" className="px-5 py-3 text-sm text-muted">Cargando investigadores…</p>}
        {error && <p role="alert" className="px-5 py-3 text-sm text-danger">{error}</p>}
        <div className="flex flex-col gap-3 border-t border-border px-5 py-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>Mostrando {visible.length} de {ordered.length} investigadores</span>
          <nav aria-label="Paginación de investigadores" className="flex items-center gap-1">
            <Button size="icon" variant="outline" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} aria-label="Página anterior"><ArrowLeft className="h-4 w-4" aria-hidden="true" /></Button>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => <Button key={number} size="icon" variant={number === page ? "default" : "outline"} onClick={() => setPage(number)} aria-label={`Página ${number}`} aria-current={number === page ? "page" : undefined}>{number}</Button>)}
            <Button size="icon" variant="outline" disabled={page === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} aria-label="Página siguiente"><ArrowRight className="h-4 w-4" aria-hidden="true" /></Button>
          </nav>
        </div>
      </Card>
      {feedback && <p role="status" className="rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary-strong">{feedback}</p>}
      <StudentCasesDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        student={selectedStudent}
        cases={studentCases}
        isLoading={casesLoading}
        onSave={saveAssignments}
      />
    </div>
  );
}
