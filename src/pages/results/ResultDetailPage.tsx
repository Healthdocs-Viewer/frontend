import React from "react";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  Info,
  Paperclip,
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

export const ResultDetailPage: React.FC = () => (
  <div className="space-y-3 pb-6">
    <Card className="overflow-hidden bg-gradient-to-r from-white via-white to-indigo-50/60">
      <CardContent className="flex flex-wrap items-center gap-4 p-5 sm:p-6">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-indigo-50 text-indigo-600">
          <FileText className="h-7 w-7" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Caso
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-950">
              CAS-20260921-0002
            </h1>
            <Badge
              variant="neutral"
              className="border-0 bg-blue-50 text-blue-700"
            >
              <span className="mr-1.5 h-2.5 w-2.5 rounded-full border-2 border-blue-500" />
              En procesamiento
            </Badge>
          </div>
          <p className="font-medium text-slate-800">Radiografía de tórax</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <Calendar className="h-3.5 w-3.5" />
            Creado el 20 de septiembre de 2026, 20:45
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Tu estudio ha sido recibido correctamente y se encuentra en proceso
            de análisis por nuestro equipo médico.
          </p>
        </div>
        <div className="hidden h-24 w-40 items-center justify-center rounded-full bg-indigo-50/70 text-indigo-200 md:flex">
          <FileCheck2 className="h-16 w-16" />
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="grid gap-4 p-5 md:grid-cols-4 md:gap-3">
        {steps.map(([title, date, state], index) => (
          <div key={title} className="relative flex gap-3 md:block md:pr-3">
            {index < steps.length - 1 && (
              <span
                className={cn(
                  "absolute left-3.5 top-7 hidden h-0.5 w-[calc(100%-1.5rem)] md:block",
                  state === "done" ? "bg-emerald-500" : "bg-slate-200",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full border-2",
                state === "done" &&
                  "border-emerald-500 bg-emerald-500 text-white",
                state === "active" &&
                  "border-indigo-500 bg-indigo-600 text-white shadow-[0_0_0_6px_rgb(224_231_255)]",
                state === "pending" &&
                  "border-slate-200 bg-slate-50 text-slate-300",
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
                  state === "active" ? "text-indigo-600" : "text-slate-700",
                )}
              >
                {title}
              </strong>
              <span className="mt-1 block text-[11px] leading-4 text-slate-500">
                {date}
              </span>
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
      <div className="space-y-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileText className="h-5 w-5 text-indigo-600" />
              Información del caso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 rounded-lg bg-slate-50/80 p-4 text-xs sm:grid-cols-3">
              <InfoItem label="ID del caso" value="CAS-20260921-0002" />
              <InfoItem label="Tipo de estudio" value="Radiografía de tórax" />
              <InfoItem label="Fecha de creación" value="20/9/2026, 20:45" />
              <InfoItem label="Centro solicitante" value="Clínica Healthdocs" />
              <InfoItem
                label="Área de solicitud"
                value="Diagnóstico por Imágenes"
              />
              <InfoItem label="Estado actual" value="En procesamiento" status />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Paperclip className="h-5 w-5 text-indigo-600" />
              Archivo enviado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 p-3">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                <FileText className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-800">
                  RX_TORAX_20260921.dcm
                </p>
                <p className="text-[11px] text-slate-500">
                  Archivo DICOM · 12.4 MB · 3 imágenes
                </p>
              </div>
              <div className="text-xs text-slate-500">
                <span className="block">Fecha de carga</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  20/9/2026, 20:46
                </span>
              </div>
              <Badge
                variant="neutral"
                className="border-0 bg-emerald-50 text-emerald-700"
              >
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                Archivo recibido
              </Badge>
              <Button size="sm" variant="outline">
                <Info className="h-3.5 w-3.5" />
                Ver información
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Clock3 className="h-5 w-5 text-indigo-600" />
              Historial del caso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {history.map(([title, detail, date, state], index) => (
                <div key={title} className="relative flex gap-3 pb-3 last:pb-0">
                  <div className="flex w-7 shrink-0 justify-center">
                    <span
                      className={cn(
                        "relative z-10 grid h-5 w-5 place-items-center rounded-full",
                        state === "done" && "bg-emerald-500 text-white",
                        state === "active" &&
                          "bg-indigo-600 text-white shadow-[0_0_0_5px_rgb(224_231_255)]",
                        state === "pending" && "bg-slate-300",
                      )}
                    >
                      {state === "done" ? (
                        <Check className="h-3 w-3" />
                      ) : state === "active" ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      ) : null}
                    </span>
                    {index < history.length - 1 && (
                      <span className="absolute top-5 h-full w-px bg-slate-200" />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between gap-3 text-xs">
                    <span>
                      <strong
                        className={cn(
                          "block",
                          state === "active"
                            ? "text-indigo-700"
                            : "text-slate-700",
                        )}
                      >
                        {title}
                      </strong>
                      <span className="text-slate-500">{detail}</span>
                    </span>
                    <span className="shrink-0 text-right text-slate-500">
                      {date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <aside className="space-y-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
              Consentimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-500 text-white">
                  <Check className="h-6 w-6" />
                </span>
                <div>
                  <strong className="block text-xs text-slate-800">
                    Consentimiento aceptado
                  </strong>
                  <span className="block text-[11px] text-slate-500">
                    Versión de términos 1.0
                  </span>
                  <span className="block text-[11px] text-slate-500">
                    Aceptado el 20/9/2026, 20:45
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-auto hidden sm:inline-flex"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Ver documento
                </Button>
              </div>
              <p className="mt-4 text-[11px] leading-4 text-slate-500">
                Has autorizado el tratamiento y gestión de la información
                suministrada para la gestión académica y diagnóstica de este
                caso.
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileCheck2 className="h-5 w-5 text-indigo-600" />
              Resultado del estudio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 rounded-lg bg-indigo-50/70 p-4">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-white text-indigo-400">
                <FileText className="h-8 w-8" />
              </span>
              <div>
                <strong className="block text-sm text-slate-800">
                  Aún en procesamiento
                </strong>
                <p className="mt-1 text-[11px] leading-4 text-slate-500">
                  Tu estudio está siendo revisado por nuestro equipo médico. Te
                  notificaremos cuando el resultado esté disponible.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Settings className="h-5 w-5 text-indigo-600" />
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
                className="w-full justify-between text-xs"
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-indigo-600" />
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
);

const InfoItem = ({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status?: boolean;
}) => (
  <div>
    <span className="block text-[11px] text-slate-500">{label}</span>
    {status ? (
      <Badge
        variant="neutral"
        className="mt-1 border-0 bg-blue-50 text-blue-700"
      >
        <span className="mr-1.5 h-2 w-2 rounded-full border-2 border-blue-500" />
        {value}
      </Badge>
    ) : (
      <strong className="block text-xs font-medium text-slate-800">
        {value}
      </strong>
    )}
  </div>
);
