import React from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, FileText, FolderOpen, Search, UsersRound } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { academicCaseOptions, StudentCasesDrawer } from "../../components/cases/StudentCasesDrawer";

type AuthorizationStatus = "Autorizado" | "Pendiente" | "Restringido";
type AcademicStudent = {
  name: string;
  id: string;
  email: string;
  status: AuthorizationStatus;
  assignedCases: number;
};
type SortKey = "name" | "id" | "email" | "status" | "assignedCases";

// Datos de presentación; la lista se reemplazará cuando exista la consulta de API.
const students: AcademicStudent[] = [
  { name: "Ana Ruiz", id: "EST-1187", email: "aruiz@unal.edu.co", status: "Autorizado", assignedCases: 5 },
  { name: "Laura Gómez", id: "EST-1042", email: "lgomez@unal.edu.co", status: "Autorizado", assignedCases: 3 },
  { name: "Mateo Sánchez", id: "EST-1205", email: "msanchez@unal.edu.co", status: "Autorizado", assignedCases: 4 },
  { name: "Camila Vega", id: "EST-0998", email: "cvega@unal.edu.co", status: "Autorizado", assignedCases: 2 },
  { name: "Daniel Ramírez", id: "EST-1076", email: "dramirez@unal.edu.co", status: "Pendiente", assignedCases: 0 },
  { name: "Paula Torres", id: "EST-1033", email: "ptorres@unal.edu.co", status: "Autorizado", assignedCases: 6 },
  { name: "Sofía Herrera", id: "EST-1101", email: "sherrera@unal.edu.co", status: "Restringido", assignedCases: 1 },
  { name: "Juan Castillo", id: "EST-1250", email: "jcastillo@unal.edu.co", status: "Autorizado", assignedCases: 4 },
  { name: "Mariana León", id: "EST-1190", email: "mleon@unal.edu.co", status: "Autorizado", assignedCases: 2 },
  { name: "Felipe Moreno", id: "EST-1021", email: "fmoreno@unal.edu.co", status: "Autorizado", assignedCases: 1 },
  { name: "Valentina Díaz", id: "EST-1114", email: "vdiaz@unal.edu.co", status: "Autorizado", assignedCases: 3 },
  { name: "Andrés Castro", id: "EST-1128", email: "acastro@unal.edu.co", status: "Autorizado", assignedCases: 2 },
  { name: "Sara Rojas", id: "EST-1136", email: "srojas@unal.edu.co", status: "Autorizado", assignedCases: 2 },
  { name: "Nicolás Molina", id: "EST-1144", email: "nmolina@unal.edu.co", status: "Autorizado", assignedCases: 1 },
  { name: "Elena Navarro", id: "EST-1152", email: "enavarro@unal.edu.co", status: "Autorizado", assignedCases: 2 },
  { name: "Tomás Salazar", id: "EST-1160", email: "tsalazar@unal.edu.co", status: "Autorizado", assignedCases: 1 },
  { name: "Isabel Méndez", id: "EST-1168", email: "imendez@unal.edu.co", status: "Autorizado", assignedCases: 2 },
  { name: "Óscar Pardo", id: "EST-1176", email: "opardo@unal.edu.co", status: "Autorizado", assignedCases: 1 },
];

const pageSize = 8;
const initialAssignments = Object.fromEntries(students.map((student) => [
  student.id,
  academicCaseOptions.slice(0, student.assignedCases).map((item) => item.id),
])) as Record<string, string[]>;

export function AcademicStudentsPage() {
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<{ key: SortKey; ascending: boolean } | null>(null);
  const [page, setPage] = React.useState(1);
  const [selectedStudent, setSelectedStudent] = React.useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [assignmentsByStudent, setAssignmentsByStudent] = React.useState(initialAssignments);
  const [feedback, setFeedback] = React.useState("");

  const authorizedCount = students.filter((student) => student.status === "Autorizado").length;
  const assignedCount = Object.values(assignmentsByStudent).reduce((total, ids) => total + ids.length, 0);
  const filtered = students.filter((student) =>
    `${student.name} ${student.id} ${student.email}`.toLocaleLowerCase("es").includes(query.trim().toLocaleLowerCase("es")),
  );
  const collator = new Intl.Collator("es", { sensitivity: "base", numeric: true });
  const ordered = sort ? [...filtered].sort((a, b) => {
    const result = sort.key === "assignedCases"
      ? a.assignedCases - b.assignedCases
      : collator.compare(String(a[sort.key]), String(b[sort.key]));
    return sort.ascending ? result : -result;
  }) : filtered;
  const pageCount = Math.max(1, Math.ceil(ordered.length / pageSize));
  const visible = ordered.slice((page - 1) * pageSize, page * pageSize);

  const changeSort = (key: SortKey) => {
    setSort((current) => ({ key, ascending: current?.key === key ? !current.ascending : true }));
    setPage(1);
  };
  const header = (label: string, key: SortKey) => (
    <button type="button" onClick={() => changeSort(key)} className="inline-flex items-center gap-1.5 hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label={`Ordenar por ${label}`}>
      {label}{sort?.key === key ? (sort.ascending ? <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" /> : <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />) : <ArrowDown className="h-3.5 w-3.5 opacity-50" aria-hidden="true" />}
    </button>
  );
  const status = (student: AcademicStudent) => (
    <Badge variant={student.status === "Autorizado" ? "success" : student.status === "Pendiente" ? "warning" : "destructive"} className="gap-2 whitespace-nowrap">
      <span className={`h-2 w-2 rounded-full ${student.status === "Autorizado" ? "bg-success" : student.status === "Pendiente" ? "bg-warning" : "bg-danger"}`} aria-hidden="true" />
      {student.status}
    </Badge>
  );
  const action = (student: AcademicStudent) => (
    <Button variant="outline" size="sm" disabled={student.status === "Restringido"} onClick={() => { setSelectedStudent(student.id); setDrawerOpen(true); }} className="whitespace-nowrap text-content">
      <FolderOpen className="h-4 w-4" aria-hidden="true" />{student.status === "Restringido" ? "Ver casos" : "Gestionar casos"}
    </Button>
  );

  return (
    <div className="space-y-4">
      <Card><CardContent className="flex gap-5 p-5 sm:p-6">
        <div className="w-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
        <div><h1 className="text-2xl font-semibold text-content">Estudiantes</h1><p className="mt-1 text-sm leading-5 text-muted">Consulta estudiantes autorizados y gestiona sus casos académicos.</p></div>
      </CardContent></Card>

      <Card><CardContent className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative block w-full lg:max-w-lg">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Buscar por nombre, ID o correo" aria-label="Buscar estudiantes por nombre, identificador o correo" className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-content outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-primary/30" />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="shadow-none"><CardContent className="flex items-center gap-3 p-3 sm:min-w-56"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary dark:bg-primary/20"><UsersRound className="h-5 w-5" aria-hidden="true" /></span><div><p className="text-xs text-muted">Estudiantes autorizados</p><p className="text-2xl font-bold text-content">{authorizedCount}</p></div></CardContent></Card>
          <Card className="shadow-none"><CardContent className="flex items-center gap-3 p-3 sm:min-w-56"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-info/10 text-info"><FileText className="h-5 w-5" aria-hidden="true" /></span><div><p className="text-xs text-muted">Casos asignados</p><p className="text-2xl font-bold text-content">{assignedCount}</p></div></CardContent></Card>
        </div>
      </CardContent></Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-muted dark:bg-slate-800">
              <tr>
                <th scope="col" className="px-5 py-3">{header("Nombre", "name")}</th>
                <th scope="col" className="px-5 py-3">{header("Identificador", "id")}</th>
                <th scope="col" className="px-5 py-3">{header("Correo", "email")}</th>
                <th scope="col" className="px-5 py-3">{header("Estado de autorización", "status")}</th>
                <th scope="col" className="px-5 py-3">{header("Casos asignados", "assignedCases")}</th>
                <th scope="col" className="px-5 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((student) => <tr key={student.id} className="border-t border-slate-100 text-content hover:bg-slate-50/70 dark:border-slate-700 dark:hover:bg-slate-800/60">
                <td className="whitespace-nowrap px-5 py-2.5 font-medium">{student.name}</td>
                <td className="whitespace-nowrap px-5 py-2.5 text-muted">{student.id}</td>
                <td className="whitespace-nowrap px-5 py-2.5 text-muted">{student.email}</td>
                <td className="px-5 py-2.5">{status(student)}</td>
                <td className="px-5 py-2.5 text-muted">{assignmentsByStudent[student.id]?.length ?? 0}</td>
                <td className="px-5 py-2.5">{action(student)}</td>
              </tr>)}
              {visible.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-muted">No hay estudiantes que coincidan con la búsqueda.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-border px-5 py-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>Mostrando {visible.length} de {ordered.length} estudiantes</span>
          <nav aria-label="Paginación de estudiantes" className="flex items-center gap-1">
            <Button size="icon" variant="outline" disabled={page === 1} onClick={() => setPage((value) => value - 1)} aria-label="Página anterior"><ArrowLeft className="h-4 w-4" aria-hidden="true" /></Button>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => <Button key={number} size="icon" variant={number === page ? "default" : "outline"} onClick={() => setPage(number)} aria-label={`Página ${number}`} aria-current={number === page ? "page" : undefined}>{number}</Button>)}
            <Button size="icon" variant="outline" disabled={page === pageCount} onClick={() => setPage((value) => value + 1)} aria-label="Página siguiente"><ArrowRight className="h-4 w-4" aria-hidden="true" /></Button>
          </nav>
        </div>
      </Card>
      {feedback && <p role="status" className="rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary-strong">{feedback}</p>}
      <StudentCasesDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        student={students.find((student) => student.id === selectedStudent) ?? null}
        assignedCaseIds={selectedStudent ? assignmentsByStudent[selectedStudent] ?? [] : []}
        onSave={(studentId, caseIds) => {
          setAssignmentsByStudent((current) => ({ ...current, [studentId]: caseIds }));
          setFeedback(`Casos de ${students.find((student) => student.id === studentId)?.name ?? studentId} actualizados en esta vista de demostración.`);
        }}
      />
    </div>
  );
}
