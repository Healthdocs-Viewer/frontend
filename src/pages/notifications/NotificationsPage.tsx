import React from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  ChevronRight,
  CircleHelp,
  CloudUpload,
  FileCheck2,
  FileText,
  FolderOpen,
  Info,
  Mail,
  Settings,
  type LucideIcon,
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
import {
  getNotificationPreferences,
  getNotifications,
  isNotificationUnread,
  markAllNotificationsRead,
  markNotificationRead,
  updateNotificationPreference,
} from "../../services/notifications";
import type {
  NotificationCategory,
  NotificationItem,
  NotificationPreferences,
  NotificationType,
  NotificationsResponse,
} from "../../types/notifications";

type NotificationTab = "ALL" | "UNREAD" | NotificationCategory;

const categoryLabels: Record<NotificationCategory, string> = {
  CASES: "Casos",
  RESULTS: "Resultados",
  SYSTEM: "Sistema",
};

const notificationPresentation: Record<
  NotificationType,
  { title: string; icon: LucideIcon; tone: "success" | "info" | "primary" | "warning" | "neutral" }
> = {
  CASE_CREATED: { title: "Caso creado", icon: FileText, tone: "warning" },
  CASE_STATUS_CHANGED: { title: "Tu caso está siendo procesado", icon: Bell, tone: "info" },
  FILE_RECEIVED: { title: "Archivo recibido correctamente", icon: CloudUpload, tone: "primary" },
  FILE_REQUIRED: { title: "Hace falta un archivo", icon: CloudUpload, tone: "warning" },
  RESULT_AVAILABLE: { title: "Tu resultado ya está disponible", icon: FileCheck2, tone: "success" },
  RESULT_CORRECTION_REQUIRED: { title: "Se solicitó corregir un resultado", icon: FileCheck2, tone: "warning" },
  RESULT_CORRECTED: { title: "Tu resultado corregido está disponible", icon: FileCheck2, tone: "success" },
  RESULT_VIEWED: { title: "Resultado consultado", icon: FileCheck2, tone: "success" },
  WELCOME: { title: "Bienvenido a Healthdocs", icon: Info, tone: "neutral" },
  SECURITY_ALERT: { title: "Alerta de seguridad", icon: Info, tone: "warning" },
  ACCOUNT_NOTICE: { title: "Aviso de tu cuenta", icon: Info, tone: "neutral" },
};

const toneStyles = {
  success: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300",
  info: "bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300",
  primary: "bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300",
  warning: "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300",
  neutral: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300",
};

const statusLabels: Record<string, string> = {
  CREATED: "creado",
  FILES_RECEIVED: "archivos recibidos",
  ENABLED_FOR_PROCESSING: "en procesamiento",
  RESULT_UPLOADED: "resultado cargado",
  RESULT_AVAILABLE: "resultado disponible",
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
}

function getDescription(item: NotificationItem): string {
  const reference = item.caseReferenceCode;
  const study = item.data.studyName;
  switch (item.type) {
    case "RESULT_AVAILABLE":
      return `El resultado${study ? ` de ${study}` : ""}${reference ? ` del caso ${reference}` : ""} ya se encuentra disponible.`;
    case "RESULT_CORRECTED":
      return `El resultado corregido${study ? ` de ${study}` : ""}${reference ? ` del caso ${reference}` : ""} ya está disponible para descargar.`;
    case "RESULT_CORRECTION_REQUIRED":
      return `Se solicitó corregir el resultado${study ? ` de ${study}` : ""}${reference ? ` del caso ${reference}` : ""}.`;
    case "CASE_STATUS_CHANGED": {
      const status = item.data.status;
      return `El estado${reference ? ` del caso ${reference}` : " de tu caso"} cambió${status ? ` a ${statusLabels[status] ?? status}` : ""}.`;
    }
    case "FILE_RECEIVED":
      return `El archivo de${reference ? ` tu caso ${reference}` : " tu caso"} se cargó exitosamente.`;
    case "FILE_REQUIRED":
      return `Hace falta cargar un archivo${reference ? ` para el caso ${reference}` : ""}.`;
    case "CASE_CREATED":
      return `Tu caso${reference ? ` ${reference}` : ""} ha sido creado.`;
    case "RESULT_VIEWED":
      return `Has consultado el resultado${reference ? ` de tu caso ${reference}` : ""}.`;
    case "WELCOME":
      return "Tu cuenta ha sido creada correctamente. Ya puedes comenzar a usar la plataforma.";
    case "SECURITY_ALERT":
      return "Hay una alerta de seguridad importante para tu cuenta.";
    case "ACCOUNT_NOTICE":
      return "Tienes un aviso administrativo sobre tu cuenta.";
  }
}

export const NotificationsPage: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const [tab, setTab] = React.useState<NotificationTab>("ALL");
  const [page, setPage] = React.useState(0);
  const [response, setResponse] = React.useState<NotificationsResponse | null>(null);
  const [preferences, setPreferences] = React.useState<NotificationPreferences | null>(null);
  const [error, setError] = React.useState("");

  const category = tab === "CASES" || tab === "RESULTS" || tab === "SYSTEM" ? tab : undefined;
  const unreadOnly = tab === "UNREAD";

  const loadNotifications = React.useCallback(() => {
    let active = true;
    setError("");
    getNotifications({ category, unreadOnly, page, size: 20 })
      .then((data) => { if (active) setResponse(data); })
      .catch(() => { if (active) setError("No se pudieron cargar las notificaciones."); });
    return () => { active = false; };
  }, [category, unreadOnly, page]);

  React.useEffect(() => loadNotifications(), [loadNotifications]);

  React.useEffect(() => {
    let active = true;
    getNotificationPreferences()
      .then((data) => { if (active) setPreferences(data); })
      .catch(() => { if (active) setError("No se pudieron cargar las preferencias."); });
    return () => { active = false; };
  }, []);

  const chooseTab = (nextTab: NotificationTab) => {
    setTab(nextTab);
    setPage(0);
  };

  const markRead = async (id: string) => {
    await markNotificationRead(id);
    loadNotifications();
  };

  const markAllRead = async () => {
    await markAllNotificationsRead();
    loadNotifications();
  };

  const changePreference = async (categoryKey: NotificationCategory, enabled: boolean) => {
    const updated = await updateNotificationPreference(categoryKey, enabled);
    setPreferences(updated);
  };

  const tabs: { id: NotificationTab; label: string; count: number }[] = [
    { id: "ALL", label: "Todas", count: response?.summary.totalCount ?? 0 },
    { id: "UNREAD", label: "Nuevas", count: response?.summary.unreadCount ?? 0 },
    ...(["CASES", "RESULTS", "SYSTEM"] as const).map((item) => ({
      id: item,
      label: categoryLabels[item],
      count: response?.categoryCounts[item] ?? 0,
    })),
  ];

  return (
    <div className="space-y-6">
      {!embedded && <div>
        <h1 className="text-2xl font-semibold">Notificaciones</h1>
        <p className="mt-1 text-sm text-slate-500">Consulta las novedades de tus estudios y casos.</p>
      </div>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] lg:items-start">
        <Card className="min-w-0 overflow-hidden lg:row-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-4">
            <div className="flex flex-wrap gap-2">
              {tabs.map((item) => (
                <Button key={item.id} size="sm" variant={tab === item.id ? "outline" : "secondary"}
                  onClick={() => chooseTab(item.id)}
                  className={cn(tab === item.id && "border-indigo-300 bg-indigo-50 text-indigo-700")}>
                  {item.label} ({item.count})
                </Button>
              ))}
            </div>
            {!!response?.summary.unreadCount && (
              <Button size="sm" variant="outline" onClick={markAllRead}>
                <CheckCheck className="h-4 w-4" />Marcar todas como leídas
              </Button>
            )}
          </div>
          <CardContent className="space-y-2 p-3 sm:p-4">
            {response?.items.map((notification) => {
              const presentation = notificationPresentation[notification.type];
              const Icon = presentation.icon;
              const isUnread = isNotificationUnread(notification);
              return (
                <div key={notification.id} className={cn(
                  "group flex items-start gap-3 rounded-xl border p-3 transition-colors sm:p-4",
                  isUnread ? "border-indigo-200/80 bg-indigo-50/50 dark:border-indigo-800/80 dark:bg-slate-800/80" : "border-border bg-surface",
                )}>
                  <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full", toneStyles[presentation.tone])}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <button type="button" onClick={() => void markRead(notification.id)} className="min-w-0 flex-1 text-left">
                    <span className="flex flex-wrap items-center gap-2">
                      <strong className="text-sm text-content">{presentation.title}</strong>
                      {isUnread && <span className="h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400" aria-label="Sin leer" />}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-muted">{getDescription(notification)}</span>
                  </button>
                  <span className="hidden shrink-0 items-end gap-2 sm:flex sm:flex-col">
                    <span className="flex items-center gap-2 text-xs text-muted">
                      {notification.caseReferenceCode && <Badge variant="neutral">{notification.caseReferenceCode}</Badge>}
                      {formatDate(notification.createdAt)}
                    </span>
                    {notification.caseReferenceCode ? (
                      <Link to={`/mis_casos/${notification.caseReferenceCode}`} className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-300">
                        Ver caso<ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    ) : <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />}
                  </span>
                </div>
              );
            })}
            {!response && !error && <p role="status" className="py-8 text-center text-sm text-slate-500">Cargando notificaciones…</p>}
            {response?.items.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No hay notificaciones para este filtro.</p>}
            {error && <p role="alert" className="py-4 text-center text-sm text-red-600">{error}</p>}
          </CardContent>
          {response && response.totalPages > 1 && <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted">
            <span>Mostrando {response.items.length} de {response.totalItems} notificaciones</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))} aria-label="Página anterior">Anterior</Button>
              <span>Página {page + 1} de {response.totalPages}</span>
              <Button size="sm" variant="outline" disabled={page + 1 >= response.totalPages} onClick={() => setPage((current) => Math.min(response.totalPages - 1, current + 1))} aria-label="Página siguiente">Siguiente</Button>
            </div>
          </div>}
        </Card>

        <div className="min-w-0 space-y-5">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2"><Settings className="h-4 w-4 text-muted" /><CardTitle>Configuración de notificaciones</CardTitle></div>
              <CardDescription>Elige qué tipo de notificaciones deseas recibir.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {(["CASES", "RESULTS", "SYSTEM"] as const).map((item) => (
                <label key={item} className="flex cursor-pointer items-center justify-between gap-3 border-b border-slate-200/80 py-3 last:border-0 dark:border-slate-700">
                  <span className="flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600"><FolderOpen className="h-4 w-4" /></span>
                    <span><span className="block text-sm font-semibold">{item === "CASES" ? "Actualizaciones de casos" : item === "RESULTS" ? "Resultados disponibles" : "Notificaciones del sistema"}</span>
                      <span className="block text-xs text-muted">{item === "CASES" ? "Estado, carga de archivos, asignación" : item === "RESULTS" ? "Cuando un resultado esté listo" : "Avisos importantes y seguridad"}</span>
                    </span>
                  </span>
                  <input type="checkbox" checked={preferences?.categories[item] ?? false}
                    onChange={(event) => void changePreference(item, event.target.checked)}
                    className="h-4 w-4 accent-indigo-600" aria-label={categoryLabels[item]} disabled={!preferences} />
                </label>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><div className="flex items-center gap-2"><CircleHelp className="h-4 w-4 text-primary" /><CardTitle>¿No recibes notificaciones?</CardTitle></div></CardHeader>
            <CardContent>
              <p className="text-xs leading-5 text-muted">Revisa tu correo no deseado o verifica la configuración de tu cuenta. Si el problema persiste, contacta al equipo de soporte.</p>
              <Button variant="outline" size="sm" className="mt-4 w-full"><Mail className="h-3.5 w-3.5" />Contactar soporte</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
