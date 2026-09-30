import React from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Check,
  CheckCheck,
  ChevronRight,
  CircleHelp,
  CloudUpload,
  FileCheck2,
  FileText,
  FolderOpen,
  Info,
  Activity,
  BriefcaseBusiness,
  Home,
  Mail,
  Menu,
  Plus,
  Settings,
  CalendarClock,
  Folder,
} from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import { cn } from "../../components/ui/cn";

type NotificationCategory =
  | "Todas"
  | "Nuevas"
  | "Casos"
  | "Resultados"
  | "Sistema";

type Notification = {
  id: string;
  title: string;
  description: string;
  caseId?: string;
  date: string;
  category: Exclude<NotificationCategory, "Todas" | "Nuevas">;
  unread?: boolean;
  tone: "success" | "info" | "primary" | "warning" | "neutral";
  icon: typeof FileText;
};

const notifications: Notification[] = [
  {
    id: "result",
    title: "Tu resultado ya está disponible",
    description:
      "El resultado de tu caso CAS-20260921-0001 ya se encuentra disponible.",
    caseId: "CAS-20260921-0001",
    date: "Hoy, 14:22",
    category: "Resultados",
    unread: true,
    tone: "success",
    icon: FileCheck2,
  },
  {
    id: "processing",
    title: "Tu caso está siendo procesado",
    description:
      "El equipo académico ya está trabajando en tu caso. Te notificaremos cuando el resultado esté disponible.",
    caseId: "CAS-20260921-0002",
    date: "Hoy, 10:15",
    category: "Casos",
    unread: true,
    tone: "info",
    icon: Bell,
  },
  {
    id: "upload",
    title: "Archivo recibido correctamente",
    description:
      "El archivo de tu caso CAS-20260921-0002 se cargó exitosamente.",
    caseId: "CAS-20260921-0002",
    date: "Ayer, 20:45",
    category: "Casos",
    unread: true,
    tone: "primary",
    icon: CloudUpload,
  },
  {
    id: "created",
    title: "Caso creado",
    description:
      "Tu caso CAS-20260921-0002 ha sido creado. Ahora puedes cargar el archivo de tu estudio.",
    caseId: "CAS-20260921-0002",
    date: "Ayer, 20:41",
    category: "Casos",
    tone: "warning",
    icon: FileText,
  },
  {
    id: "viewed",
    title: "Resultado consultado",
    description: "Has consultado el resultado de tu caso CAS-20260921-0001.",
    caseId: "CAS-20260921-0001",
    date: "20 sep. 2026, 16:30",
    category: "Resultados",
    tone: "success",
    icon: FileCheck2,
  },
  {
    id: "welcome",
    title: "Bienvenido a Healthdocs",
    description:
      "Tu cuenta ha sido creada correctamente. Ya puedes comenzar a usar la plataforma.",
    date: "20 sep. 2026, 12:10",
    category: "Sistema",
    tone: "neutral",
    icon: Info,
  },
];

const iconStyles = {
  success:
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300",
  info: "bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300",
  primary:
    "bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300",
  warning:
    "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300",
  neutral: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300",
};

export const NotificationsPage: React.FC<{ embedded?: boolean }> = ({
  embedded = false,
}) => {
  const [collapsed, setCollapsed] = React.useState(false);
  const [category, setCategory] = React.useState<NotificationCategory>("Todas");
  const [readIds, setReadIds] = React.useState<string[]>(
    notifications.filter((item) => !item.unread).map((item) => item.id),
  );
  const [settings, setSettings] = React.useState({
    cases: true,
    results: true,
    system: true,
  });
  const unreadCount = notifications.filter(
    (item) => !readIds.includes(item.id),
  ).length;
  const visibleNotifications = notifications.filter(
    (item) =>
      category === "Todas" ||
      (category === "Nuevas"
        ? !readIds.includes(item.id)
        : item.category === category),
  );

  const markAllRead = () => setReadIds(notifications.map((item) => item.id));
  const markRead = (id: string) =>
    setReadIds((current) =>
      current.includes(id) ? current : [...current, id],
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Resumen general</h1>
        <p className="mt-1 text-sm text-slate-500">
          Una vista rápida de tus estudios y casos médicos.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] lg:items-start">
        <Card className="min-w-0 overflow-hidden lg:row-span-2">
          <div className="flex flex-wrap gap-2 border-b border-border p-4">
            {(
              [
                "Todas",
                "Nuevas",
                "Casos",
                "Resultados",
                "Sistema",
              ] as NotificationCategory[]
            ).map((item) => (
              <Button
                key={item}
                size="sm"
                variant={category === item ? "outline" : "secondary"}
                onClick={() => setCategory(item)}
                className={cn(
                  category === item &&
                    "border-indigo-300 bg-indigo-50 text-indigo-700",
                )}
              >
                {item}
                {item === "Todas"
                  ? ` (${notifications.length})`
                  : item === "Nuevas"
                    ? ` (${unreadCount})`
                    : ` (${notifications.filter((notification) => notification.category === item).length})`}
              </Button>
            ))}
          </div>
          <CardContent className="space-y-2 p-3 sm:p-4">
            {visibleNotifications.map((notification) => {
              const Icon = notification.icon;
              const isUnread = !readIds.includes(notification.id);
              return (
                <button
                  type="button"
                  key={notification.id}
                  onClick={() => markRead(notification.id)}
                  className={cn(
                    "group flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors hover:border-indigo-200 hover:bg-indigo-50/30 dark:hover:border-indigo-800 dark:hover:bg-slate-800 sm:p-4",
                    isUnread
                      ? "border-indigo-200/80 bg-indigo-50/50 dark:border-indigo-800/80 dark:bg-slate-800/80"
                      : "border-border bg-surface",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-full",
                      iconStyles[notification.tone],
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <strong className="text-sm text-content">
                        {notification.title}
                      </strong>
                      {isUnread && (
                        <span className="h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                      )}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-muted">
                      {notification.description}
                    </span>
                  </span>
                  <span className="hidden shrink-0 items-end gap-2 sm:flex sm:flex-col">
                    <span className="flex items-center gap-2 text-xs text-muted">
                      {notification.caseId && (
                        <Badge variant="neutral">{notification.caseId}</Badge>
                      )}
                      {notification.date}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <div className="min-w-0 space-y-5">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted" />
                <CardTitle>Configuración de notificaciones</CardTitle>
              </div>
              <CardDescription>
                Elige qué tipo de notificaciones deseas recibir.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {[
                {
                  key: "cases",
                  title: "Actualizaciones de casos",
                  detail: "Estado, carga de archivos, asignación",
                },
                {
                  key: "results",
                  title: "Resultados disponibles",
                  detail: "Cuando un resultado esté listo",
                },
                {
                  key: "system",
                  title: "Notificaciones del sistema",
                  detail: "Avisos importantes y seguridad",
                },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex cursor-pointer items-center justify-between gap-3 border-b border-slate-200/80 py-3 last:border-0 dark:border-slate-700"
                >
                  <span className="flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                      <FolderOpen className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">
                        {item.title}
                      </span>
                      <span className="block text-xs text-muted">
                        {item.detail}
                      </span>
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={settings[item.key as keyof typeof settings]}
                    onChange={() =>
                      setSettings((current) => ({
                        ...current,
                        [item.key]: !current[item.key as keyof typeof settings],
                      }))
                    }
                    className="h-4 w-4 accent-indigo-600"
                    aria-label={item.title}
                  />
                </label>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CircleHelp className="h-4 w-4 text-primary" />
                <CardTitle>¿No recibes notificaciones?</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs leading-5 text-muted">
                Revisa tu correo no deseado o verifica la configuración de tu
                cuenta. Si el problema persiste, contacta al equipo de soporte.
              </p>
              <Button variant="outline" size="sm" className="mt-4 w-full">
                <Mail className="h-3.5 w-3.5" />
                Contactar soporte
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
