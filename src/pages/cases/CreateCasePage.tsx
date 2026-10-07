import React from "react";
import {
  ArrowRight,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  CloudUpload,
  FileText,
  Info,
  Paperclip,
  Send,
  ShieldCheck,
  Stethoscope,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

const steps = ["Información", "Consentimiento", "Archivo", "Confirmación"];
const inputClassName =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

export const CreateCasePage = () => {
  const navigate = useNavigate();
  const [studyName, setStudyName] = React.useState("");
  const [reference, setReference] = React.useState("Control anual 2026");
  const [institution, setInstitution] = React.useState("Clínica Salud Total");
  const [date, setDate] = React.useState("2026-09-20");
  const [notes, setNotes] = React.useState("Control de rutina. Sin síntomas.");
  const [currentStep, setCurrentStep] = React.useState(1);
  const [accepted, setAccepted] = React.useState(false);

  const goToConsent = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCurrentStep(2);
  };

  return (
    <div className="space-y-4 pb-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 lg:p-6">
        <div className="border-l-4 border-indigo-600 pl-4">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Crear nuevo caso
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Completa la información inicial para registrar tu estudio y
            continuar con el proceso.
          </p>
        </div>
      </section>
      <section
        aria-label="Progreso del caso"
        className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 lg:px-16"
      >
        <div className="relative grid grid-cols-4 gap-2">
          <div className="absolute left-[12.5%] right-[12.5%] top-4 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div
            className="absolute left-[12.5%] top-4 h-1 rounded-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${Math.min(75, currentStep * 25 - 12.5)}%` }}
          />
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const complete = stepNumber < currentStep;
            const active = stepNumber === currentStep;
            return (
              <div
                key={step}
                className="relative z-10 flex flex-col items-center gap-2 text-center"
              >
                <span
                  className={`grid h-8 w-8 place-items-center rounded-full text-sm font-semibold ${active || complete ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}
                >
                  {complete ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    stepNumber
                  )}
                </span>
                <span
                  className={`text-xs font-medium ${active ? "text-slate-800 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"}`}
                >
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </section>
      {currentStep === 1 ? (
        <section className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.75fr)]">
          <Card className="min-w-0 p-5 lg:p-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">
                <FileText className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-base font-semibold">
                  Información del estudio
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Ingresa los datos básicos de tu estudio médico.
                </p>
              </div>
            </div>
            <form onSubmit={goToConsent} className="mt-5 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nombre del estudio <span className="text-rose-500">*</span>
                  <span className="relative block">
                    <Stethoscope
                      className="absolute left-3 top-3 h-4 w-4 text-indigo-500"
                      aria-hidden="true"
                    />
                    <input
                      required
                      maxLength={200}
                      placeholder="Escríbelo como aparece en tu orden médica"
                      value={studyName}
                      onChange={(e) => setStudyName(e.target.value)}
                      className={`${inputClassName} pl-10`}
                    />
                  </span>
                </label>
                <label className="space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Referencia adicional (opcional)
                  <input
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className={inputClassName}
                  />
                  <span className="block text-xs font-normal text-slate-400">
                    Agrega un dato opcional que te ayude a reconocer este caso.
                  </span>
                </label>
                <label className="space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Institución o centro de origen{" "}
                  <span className="text-rose-500">*</span>
                  <input
                    required
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className={inputClassName}
                  />
                  <span className="block text-xs font-normal text-slate-400">
                    Nombre del hospital, clínica o centro donde se realizó el
                    estudio.
                  </span>
                </label>
                <label className="space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Fecha del estudio <span className="text-rose-500">*</span>
                  <span className="relative block">
                    <CalendarDays
                      className="absolute left-3 top-3 h-4 w-4 text-slate-500"
                      aria-hidden="true"
                    />
                    <input
                      required
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className={`${inputClassName} pl-10`}
                    />
                  </span>
                  <span className="block text-xs font-normal text-slate-400">
                    Selecciona la fecha en que se realizó el estudio.
                  </span>
                </label>
              </div>
              <label className="block space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                Notas adicionales (opcional)
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={500}
                  rows={3}
                  className={`${inputClassName} h-auto resize-y py-2`}
                />
                <span className="flex justify-between text-xs font-normal text-slate-400">
                  <span>
                    Agrega cualquier información relevante sobre tu estudio
                    (opcional).
                  </span>
                  <span>{notes.length}/500</span>
                </span>
              </label>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                <Button
                  variant="secondary"
                  onClick={() => navigate("/mis_casos")}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  Continuar{" "}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </form>
          </Card>
          <Card className="p-5 lg:p-6">
            <div className="mb-6 flex h-24 items-center justify-center rounded-xl bg-indigo-50 text-indigo-300 dark:bg-indigo-950/40">
              <FileText className="h-14 w-14" aria-hidden="true" />
            </div>
            <div className="flex items-start gap-3">
              <Info
                className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600"
                aria-hidden="true"
              />
              <div>
                <h2 className="text-base font-semibold">Antes de continuar</h2>
                <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
                  Ten en cuenta las siguientes recomendaciones para un proceso
                  exitoso.
                </p>
              </div>
            </div>
            <div className="mt-6 space-y-5">
              <Tip icon={FileText} title="Escribe el nombre del estudio">
                Si tienes una orden médica, usa el nombre tal como aparece allí.
              </Tip>
              <Tip icon={CalendarDays} title="Revisa la información">
                Asegúrate de que la fecha y los datos del centro de origen sean
                correctos.
              </Tip>
              <Tip icon={CloudUpload} title="Ten listo tu archivo">
                En el siguiente paso podrás cargar las imágenes o documentos de
                tu estudio.
              </Tip>
            </div>
          </Card>
        </section>
      ) : currentStep === 2 ? (
        <ConsentStep
          accepted={accepted}
          setAccepted={setAccepted}
          onBack={() => setCurrentStep(1)}
          onContinue={() => setCurrentStep(3)}
        />
      ) : currentStep === 3 ? (
        <FileUploadStep
          studyName={studyName}
          onBack={() => setCurrentStep(2)}
          onContinue={() => setCurrentStep(4)}
        />
      ) : (
        <ConfirmationStep
          studyName={studyName}
          reference={reference}
          institution={institution}
          date={date}
          notes={notes}
          onBack={() => setCurrentStep(3)}
        />
      )}
    </div>
  );
};

const ConsentStep = ({
  accepted,
  setAccepted,
  onBack,
  onContinue,
}: {
  accepted: boolean;
  setAccepted: (value: boolean) => void;
  onBack: () => void;
  onContinue: () => void;
}) => (
  <section className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.75fr)]">
    <Card className="min-w-0 p-5 lg:p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">
          <FileText className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-semibold">Consentimiento informado</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Lee la información y confirma tu aceptación para continuar.
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-800 sm:grid-cols-2">
        <div>
          <p className="text-slate-500 dark:text-slate-400">
            Caso provisional:
          </p>
          <p className="font-semibold">CAS-20260921-0003</p>
        </div>
        <div className="border-slate-200 sm:border-l sm:pl-4 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400">
            Versión del documento:
          </p>
          <p className="font-semibold">1.0</p>
        </div>
      </div>
      <div className="mt-3 space-y-3 rounded-lg border border-slate-200 p-3 text-sm leading-5 text-slate-600 dark:border-slate-700 dark:text-slate-300">
        <p>
          Autorizo a Healthdocs para el tratamiento de la información médica que
          cargue en esta plataforma, con el fin de gestionar el estudio de mi
          caso con fines de apoyo académico y diagnóstico, dentro del marco de
          la prestación de servicios de salud.
        </p>
        <p>
          La información será tratada de forma confidencial, de acuerdo con la
          normativa aplicable en materia de protección de datos personales y
          secreto médico.
        </p>
        <p>
          Declaro que he sido informado(a) de que el resultado del estudio podrá
          ser publicado en la plataforma cuando esté disponible.
        </p>
      </div>
      <div className="mt-3 flex gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
        <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
        <p>
          <strong>
            Este consentimiento no reemplaza la atención médica ni modifica el
            resultado del estudio.
          </strong>
          <br />
          Ante cualquier duda sobre tu situación de salud, consulta directamente
          con tu médico tratante.
        </p>
      </div>
      <label className="mt-4 flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
        He leído y acepto los términos del consentimiento informado para este
        caso.
      </label>
      <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
        <Button variant="secondary" onClick={onBack}>
          Volver
        </Button>
        <Button disabled={!accepted} onClick={onContinue}>
          Aceptar y continuar{" "}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </Card>
    <Card className="p-5 lg:p-6">
      <div className="mb-6 flex h-24 items-center justify-center rounded-xl bg-indigo-50 text-indigo-300 dark:bg-indigo-950/40">
        <FileText className="h-14 w-14" aria-hidden="true" />
      </div>
      <div className="flex items-start gap-3">
        <Info
          className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600"
          aria-hidden="true"
        />
        <div>
          <h2 className="text-base font-semibold">Puntos clave</h2>
          <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
            Ten en cuenta la siguiente información antes de aceptar el
            consentimiento.
          </p>
        </div>
      </div>
      <div className="mt-6 space-y-5">
        <Tip icon={FileText} title="Uso de la información">
          Los archivos que cargues serán utilizados únicamente dentro del
          proceso autorizado de estudio de tu caso.
        </Tip>
        <Tip icon={CalendarDays} title="Registro de aceptación">
          La fecha y hora de tu aceptación quedarán registradas en la
          plataforma.
        </Tip>
        <Tip icon={ShieldCheck} title="Próximo paso">
          Una vez que aceptes, podrás cargar las imágenes o documentos de tu
          estudio médico.
        </Tip>
      </div>
    </Card>
  </section>
);

type UploadedFile = { name: string; size: string; type: "image" | "pdf" };

const FileUploadStep = ({
  studyName,
  onBack,
  onContinue,
}: {
  studyName: string;
  onBack: () => void;
  onContinue: () => void;
}) => {
  const [files, setFiles] = React.useState<UploadedFile[]>([
    { name: "radiografia_torax_frontal.dcm", size: "18.2 MB", type: "image" },
    { name: "orden_medica.pdf", size: "1.4 MB", type: "pdf" },
  ]);
  const addFiles = (selected: FileList | null) => {
    if (!selected) return;
    setFiles((current) => [
      ...current,
      ...Array.from(selected).map((file) => ({
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        type: file.type.includes("pdf") ? ("pdf" as const) : ("image" as const),
      })),
    ]);
  };
  return (
    <section className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.75fr)]">
      <Card className="min-w-0 p-5 lg:p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-semibold">
              Cargar archivo del estudio
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Adjunta las imágenes o documentos solicitados para este caso.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-800 sm:grid-cols-2">
          <div>
            <p className="text-slate-500 dark:text-slate-400">
              Caso provisional:
            </p>
            <p className="font-semibold">CAS-20260921-0003</p>
          </div>
          <div className="border-slate-200 sm:border-l sm:pl-4 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400">
              Nombre del estudio:
            </p>
            <p className="font-semibold">{studyName}</p>
          </div>
        </div>
        <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-indigo-300 bg-indigo-50/30 px-4 py-5 text-center transition hover:bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40">
          <UploadCloud
            className="h-10 w-10 text-indigo-600"
            aria-hidden="true"
          />
          <span className="mt-2 text-sm font-semibold">
            Arrastra y suelta tus archivos aquí
          </span>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            o selecciona archivos desde tu dispositivo
          </span>
          <span className="mt-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white">
            Seleccionar archivo
          </span>
          <span className="mt-2 text-xs text-slate-400">
            Formatos permitidos: PDF, JPG, PNG, DICOM
            <br />
            Tamaño máximo por archivo: 50 MB
          </span>
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.dcm"
            className="sr-only"
            onChange={(e) => addFiles(e.target.files)}
          />
        </label>
        <h3 className="mt-3 text-sm font-semibold">
          Archivos cargados ({files.length})
        </h3>
        <div className="mt-2 space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center gap-3 rounded-lg border border-slate-200 p-2 dark:border-slate-700"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-50 text-indigo-600 dark:bg-slate-800 dark:text-indigo-300">
                <FileText className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">{file.name}</p>
                <p className="text-xs text-slate-400">{file.size}</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                <Check className="h-3 w-3" aria-hidden="true" />
                Cargado
              </span>
              <button
                type="button"
                aria-label={`Eliminar ${file.name}`}
                onClick={() =>
                  setFiles((current) =>
                    current.filter((_, itemIndex) => itemIndex !== index),
                  )
                }
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
          <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            <strong>
              Podrás revisar esta información antes de finalizar el envío.
            </strong>
            <br />
            En el siguiente paso podrás ver un resumen de los archivos cargados
            y confirmar el envío de tu caso.
          </p>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="secondary" onClick={onBack}>
            Volver
          </Button>
          <Button disabled={files.length === 0} onClick={onContinue}>
            Continuar <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </Card>
      <Card className="p-5 lg:p-6">
        <div className="mb-6 flex h-24 items-center justify-center rounded-xl bg-indigo-50 text-indigo-300 dark:bg-indigo-950/40">
          <FileText className="h-14 w-14" aria-hidden="true" />
        </div>
        <div className="flex items-start gap-3">
          <Info
            className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600"
            aria-hidden="true"
          />
          <div>
            <h2 className="text-base font-semibold">
              Recomendaciones de carga
            </h2>
            <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
              Ten en cuenta las siguientes recomendaciones para un proceso
              exitoso.
            </p>
          </div>
        </div>
        <div className="mt-6 space-y-5">
          <Tip icon={FileText} title="Verifica la legibilidad">
            Asegúrate de que las imágenes o documentos sean claros y de buena
            calidad, sin cortes ni información borrosa.
          </Tip>
          <Tip icon={CalendarDays} title="Incluye todos los archivos">
            Carga el estudio principal y los documentos de soporte que apliquen.
          </Tip>
          <Tip icon={ShieldCheck} title="Protección de datos">
            Tus archivos serán tratados de forma confidencial y segura.
          </Tip>
        </div>
      </Card>
    </section>
  );
};

const ConfirmationStep = ({
  studyName,
  reference,
  institution,
  date,
  notes,
  onBack,
}: {
  studyName: string;
  reference: string;
  institution: string;
  date: string;
  notes: string;
  onBack: () => void;
}) => (
  <section className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.75fr)]">
    <Card className="min-w-0 p-5 lg:p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">
          <FileText className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-semibold">Confirmación del caso</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Verifica los datos antes de finalizar el envío.
          </p>
        </div>
      </div>
      <div className="mt-5 flex items-center gap-4 rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
        <ShieldCheck className="h-8 w-8 text-indigo-600" aria-hidden="true" />
        <div className="flex-1">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Caso provisional:
          </p>
          <p className="font-semibold">CAS-20260921-0003</p>
        </div>
        <div className="hidden border-l border-slate-200 pl-4 sm:block dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400">Estado</p>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            <Check className="h-3 w-3" aria-hidden="true" />
            Listo para enviar
          </span>
        </div>
      </div>
      <Summary title="Información del estudio" icon={Stethoscope}>
        <div className="grid gap-3 sm:grid-cols-2">
          <SummaryItem label="Nombre del estudio" value={studyName} />
          <SummaryItem
            label="Nombre o referencia del estudio"
            value={reference}
          />
          <SummaryItem
            label="Institución o centro de origen"
            value={institution}
          />
          <SummaryItem
            label="Fecha del estudio"
            value={new Date(`${date}T00:00:00`).toLocaleDateString("es-CO")}
          />
          <SummaryItem label="Notas adicionales" value={notes} />
        </div>
      </Summary>
      <Summary title="Consentimiento" icon={FileText}>
        <div className="flex items-center gap-2 text-sm">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300">
            <Check className="h-4 w-4" aria-hidden="true" />
          </span>
          Consentimiento informado aceptado{" "}
          <span className="ml-auto text-xs text-slate-500">Versión 1.0</span>
        </div>
      </Summary>
      <Summary title="Archivos adjuntos (2)" icon={Paperclip}>
        <div className="space-y-2">
          <AttachedFile name="radiografia_torax_frontal.dcm" size="18.2 MB" />
          <AttachedFile name="orden_medica.pdf" size="1.4 MB" />
        </div>
      </Summary>
      <div className="mt-4 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
        <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
        <p>
          <strong>
            Al confirmar, tu caso será enviado para su procesamiento.
          </strong>
          <br />
          Podrás consultar el estado del caso desde tu panel de paciente en
          cualquier momento.
        </p>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="secondary" onClick={onBack}>
          Volver
        </Button>
        <Button>
          <Send className="h-4 w-4" aria-hidden="true" />
          Confirmar y enviar{" "}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </Card>
    <Card className="p-5 lg:p-6">
      <div className="mb-6 flex h-24 items-center justify-center rounded-xl bg-indigo-50 text-indigo-300 dark:bg-indigo-950/40">
        <FileText className="h-14 w-14" aria-hidden="true" />
      </div>
      <h2 className="text-base font-semibold">Qué sucede después</h2>
      <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
        Una vez que confirmes el envío, tu caso será registrado en la plataforma
        y podrás hacer seguimiento desde tu panel.
      </p>
      <div className="mt-6 space-y-5">
        <Tip icon={FileText} title="Recepción del caso">
          Tu información y archivos serán registrados en la plataforma.
        </Tip>
        <Tip icon={BarChart3} title="Seguimiento del estado">
          Podrás consultar el avance del caso desde tu panel de paciente.
        </Tip>
        <Tip icon={Bell} title="Notificación de resultado">
          Recibirás un aviso cuando el resultado esté disponible.
        </Tip>
      </div>
    </Card>
  </section>
);

const Summary = ({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) => (
  <section className="mt-3 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
    <div className="mb-3 flex items-center gap-2">
      <Icon className="h-5 w-5 text-indigo-600" aria-hidden="true" />
      <h3 className="text-base font-semibold">{title}</h3>
    </div>
    {children}
  </section>
);
const SummaryItem = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    <p className="text-sm font-semibold">{value}</p>
  </div>
);
const AttachedFile = ({ name, size }: { name: string; size: string }) => (
  <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-2 dark:border-slate-700">
    <FileText className="h-5 w-5 text-indigo-600" aria-hidden="true" />
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium">{name}</p>
      <p className="text-xs text-slate-400">{size}</p>
    </div>
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
      <Check className="h-3 w-3" aria-hidden="true" />
      Cargado
    </span>
  </div>
);

const Tip = ({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="flex gap-3">
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">
      <Icon className="h-5 w-5" aria-hidden="true" />
    </span>
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
        {children}
      </p>
    </div>
  </div>
);
