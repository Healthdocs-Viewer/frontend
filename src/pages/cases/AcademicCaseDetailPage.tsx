import React from "react";
import {
  ArrowDown, BarChart3, CalendarDays, CheckCircle2, Clock3, Download,
  FileArchive, FileText, GraduationCap, Info, RefreshCw, Settings, UserRound,
} from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { StudentAccessDrawer } from "../../components/cases/StudentAccessDrawer";
import { useParams } from "react-router-dom";

type CaseFile = {
  name: string;
  date: string;
  size: string;
  kind: "archive" | "dicom" | "pdf";
};

type CaseResult = {
  id: string;
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
  { id: "RES-20260918-0027-01", type: "Video explicativo", uploadedAt: "19/9/2026, 08:45", version: "v1.0" },
  { id: "RES-20260918-0027-02", type: "Resumen visual", uploadedAt: "19/9/2026, 09:12", version: "v1.0" },
];

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

export const CaseDetailPage: React.FC = () => {
  const [feedback, setFeedback] = React.useState("");
  const [sortAscending, setSortAscending] = React.useState(true);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const { caseId } = useParams<{ caseId: string }>();
  const resolvedCaseId = caseId ?? "CAS-20260918-0027";
  const [authorizedStudentIds, setAuthorizedStudentIds] = React.useState(["EST-1033", "EST-1042", "EST-0998", "EST-1076"]);
  const sortedFiles = [...caseFiles].sort((a, b) => sortAscending ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));

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
                    </tr>
                  </thead>
                  <tbody>
                    {caseResults.map((result) => (
                      <tr key={result.id} className="border-t border-slate-100 text-content dark:border-slate-700">
                        <td className="whitespace-nowrap px-4 py-3"><span className="inline-flex items-center gap-3"><FileText className="h-5 w-5 text-muted" aria-hidden="true" />{result.id}</span></td>
                        <td className="whitespace-nowrap px-4 py-3 text-muted">{result.type}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-muted">{result.uploadedAt}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-muted">{result.version}</td>
                        <td className="px-4 py-3"><Badge variant="success" className="whitespace-nowrap"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />Cargado</Badge></td>
                      </tr>
                    ))}
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
                <DetailRow icon={UserRound} label="Estudiante asignado">EST-1033 · P. Torres</DetailRow>
                <DetailRow icon={CalendarDays} label="Fecha de asignación">18/9/2026, 17:05</DetailRow>
                <DetailRow icon={Settings} label="Estado del procesamiento"><Badge variant="success" className="whitespace-nowrap"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />Resultado cargado</Badge></DetailRow>
                <div className="border-t border-border pt-4">
                  <Button variant="outline" className="w-full border-primary/50 text-primary hover:bg-primary/5" onClick={() => setDrawerOpen(true)}><RefreshCw className="h-4 w-4" aria-hidden="true" />Gestionar acceso</Button>
                  <p className="mt-2 text-xs leading-5 text-muted">Administra qué estudiantes pueden acceder a este caso.</p>
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
      <StudentAccessDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        caseId={resolvedCaseId}
        caseStatus="Resultado cargado"
        initialSelectedIds={authorizedStudentIds}
        onSave={(selectedIds) => {
          setAuthorizedStudentIds(selectedIds);
          setFeedback(`Acceso de estudiantes actualizado para ${resolvedCaseId}.`);
        }}
      />
    </div>
  );
};

export const AcademicCaseDetailPage = CaseDetailPage;
