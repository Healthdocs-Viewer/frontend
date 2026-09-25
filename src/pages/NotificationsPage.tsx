import React from "react";
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
} from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { cn } from "../components/ui/cn";

type NotificationCategory = "Todas" | "Nuevas" | "Casos" | "Resultados" | "Sistema";

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
  { id: "result", title: "Tu resultado ya está disponible", description: "El resultado de tu caso CAS-20260921-0001 ya se encuentra disponible.", caseId: "CAS-20260921-0001", date: "Hoy, 14:22", category: "Resultados", unread: true, tone: "success", icon: FileCheck2 },
  { id: "processing", title: "Tu caso está siendo procesado", description: "El equipo académico ya está trabajando en tu caso. Te notificaremos cuando el resultado esté disponible.", caseId: "CAS-20260921-0002", date: "Hoy, 10:15", category: "Casos", unread: true, tone: "info", icon: Bell },
  { id: "upload", title: "Archivo recibido correctamente", description: "El archivo de tu caso CAS-20260921-0002 se cargó exitosamente.", caseId: "CAS-20260921-0002", date: "Ayer, 20:45", category: "Casos", unread: true, tone: "primary", icon: CloudUpload },
  { id: "created", title: "Caso creado", description: "Tu caso CAS-20260921-0002 ha sido creado. Ahora puedes cargar el archivo de tu estudio.", caseId: "CAS-20260921-0002", date: "Ayer, 20:41", category: "Casos", tone: "warning", icon: FileText },
  { id: "viewed", title: "Resultado consultado", description: "Has consultado el resultado de tu caso CAS-20260921-0001.", caseId: "CAS-20260921-0001", date: "20 sep. 2026, 16:30", category: "Resultados", tone: "success", icon: FileCheck2 },
  { id: "welcome", title: "Bienvenido a Healthdocs", description: "Tu cuenta ha sido creada correctamente. Ya puedes comenzar a usar la plataforma.", date: "20 sep. 2026, 12:10", category: "Sistema", tone: "neutral", icon: Info },
];

const iconStyles = {
  success: "bg-emerald-100 text-emerald-600",
  info: "bg-blue-100 text-blue-600",
  primary: "bg-indigo-100 text-indigo-600",
  warning: "bg-amber-100 text-amber-600",
  neutral: "bg-slate-100 text-slate-500",
};

export const NotificationsPage: React.FC = () => {
  const [collapsed, setCollapsed] = React.useState(false);
  const [category, setCategory] = React.useState<NotificationCategory>("Todas");
  const [readIds, setReadIds] = React.useState<string[]>(notifications.filter((item) => !item.unread).map((item) => item.id));
  const [settings, setSettings] = React.useState({ cases: true, results: true, system: true });
  const unreadCount = notifications.filter((item) => !readIds.includes(item.id)).length;
  const visibleNotifications = notifications.filter((item) => category === "Todas" || (category === "Nuevas" ? !readIds.includes(item.id) : item.category === category));

  const markAllRead = () => setReadIds(notifications.map((item) => item.id));
  const markRead = (id: string) => setReadIds((current) => current.includes(id) ? current : [...current, id]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className={cn("fixed inset-y-0 left-0 z-10 hidden border-r border-slate-200 bg-white transition-all lg:block", collapsed ? "w-20" : "w-72")}>
        <div className="flex h-full flex-col p-4">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="grid h-7 w-7 place-items-center rounded-full border-2 border-slate-900"><Activity className="h-4 w-4" /></div>
            {!collapsed && <span className="text-base font-semibold">Healthdocs</span>}
          </div>
          <a href="/dashboard/mis-casos" className="mt-7 flex items-center gap-3 rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"><Plus className="h-4 w-4" />{!collapsed && "Crear nuevo"}</a>
          <nav aria-label="Navegación principal" className="mt-5 space-y-1 text-sm text-slate-600">
            {[["Inicio", Home, "/dashboard"], ["Mis casos", BriefcaseBusiness, "/dashboard/mis-casos"], ["Resultados", FileText, "/dashboard/resultados"], ["Notificaciones", Bell, "/notificaciones"]].map(([label, Icon, href]) => <a key={label as string} href={href as string} aria-current={label === "Notificaciones" ? "page" : undefined} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-100", label === "Notificaciones" && "bg-slate-100 font-medium text-slate-900")}><Icon className="h-4 w-4" />{!collapsed && (label as string)}</a>)}
          </nav>
          <div className="mt-auto">
            {!collapsed && <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Sistema</p>}
            <a href="/dashboard/ayuda" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100"><CircleHelp className="h-4 w-4" />{!collapsed && "Ayuda"}</a>
            <a href="/dashboard/configuracion" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100"><Settings className="h-4 w-4" />{!collapsed && "Configuración"}</a>
            <Button variant="ghost" size="sm" onClick={() => setCollapsed((value) => !value)} className="mt-2 w-full justify-start"><Menu className="h-4 w-4" />{!collapsed && "Contraer menú"}</Button>
          </div>
        </div>
      </aside>
      <main className={cn("transition-all", collapsed ? "lg:pl-20" : "lg:pl-72")}>
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5 lg:px-8">
          <div className="flex items-center gap-3"><Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menú de navegación"><Menu className="h-5 w-5" /></Button><span className="text-sm text-slate-400">Workspace /</span><span className="font-medium">Notificaciones</span></div>
          <div role="img" aria-label="Avatar del usuario" className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500" />
        </header>
        <div className="space-y-5 p-5 lg:p-8">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div><h1 className="text-2xl font-semibold">Notificaciones</h1><p className="mt-1 text-sm text-slate-500">Mantente al día con el estado de tus casos y resultados.</p></div>
          <Button variant="ghost" size="sm" onClick={markAllRead} disabled={!unreadCount}><CheckCheck className="h-4 w-4" />Marcar todas como leídas</Button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,1fr)]">
          <Card className="min-w-0 overflow-hidden">
            <div className="flex flex-wrap gap-2 border-b border-border p-4">
              {(["Todas", "Nuevas", "Casos", "Resultados", "Sistema"] as NotificationCategory[]).map((item) => (
                <Button key={item} size="sm" variant={category === item ? "outline" : "secondary"} onClick={() => setCategory(item)} className={cn(category === item && "border-indigo-300 bg-indigo-50 text-indigo-700")}>
                  {item}{item === "Todas" ? ` (${notifications.length})` : item === "Nuevas" ? ` (${unreadCount})` : ` (${notifications.filter((notification) => notification.category === item).length})`}
                </Button>
              ))}
            </div>
            <CardContent className="space-y-2 p-3 sm:p-4">
              {visibleNotifications.map((notification) => {
                const Icon = notification.icon;
                const isUnread = !readIds.includes(notification.id);
                return <button type="button" key={notification.id} onClick={() => markRead(notification.id)} className={cn("group flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors hover:border-indigo-200 hover:bg-indigo-50/30 sm:p-4", isUnread ? "border-indigo-100 bg-indigo-50/30" : "border-border bg-surface")}>
                  <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full", iconStyles[notification.tone])}><Icon className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><strong className="text-sm text-content">{notification.title}</strong>{isUnread && <span className="h-2 w-2 rounded-full bg-indigo-600" />}</span><span className="mt-1 block text-xs leading-5 text-muted">{notification.description}</span></span>
                  <span className="hidden shrink-0 items-end gap-2 sm:flex sm:flex-col"><span className="flex items-center gap-2 text-xs text-muted">{notification.caseId && <Badge variant="neutral">{notification.caseId}</Badge>}{notification.date}</span><ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" /></span>
                </button>;
              })}
            </CardContent>
          </Card>

          <div className="space-y-5">
            <Card><CardHeader><div className="flex items-center gap-2"><Settings className="h-4 w-4 text-muted" /><CardTitle>Configuración de notificaciones</CardTitle></div><CardDescription>Elige qué tipo de notificaciones deseas recibir.</CardDescription></CardHeader><CardContent className="space-y-1">
              {[{ key: "cases", title: "Actualizaciones de casos", detail: "Estado, carga de archivos, asignación" }, { key: "results", title: "Resultados disponibles", detail: "Cuando un resultado esté listo" }, { key: "system", title: "Notificaciones del sistema", detail: "Avisos importantes y seguridad" }].map((item) => <label key={item.key} className="flex cursor-pointer items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-0"><span className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600"><FolderOpen className="h-4 w-4" /></span><span><span className="block text-sm font-semibold">{item.title}</span><span className="block text-xs text-muted">{item.detail}</span></span></span><input type="checkbox" checked={settings[item.key as keyof typeof settings]} onChange={() => setSettings((current) => ({ ...current, [item.key]: !current[item.key as keyof typeof settings] }))} className="h-4 w-4 accent-indigo-600" aria-label={item.title} /></label>)}
            </CardContent></Card>
            <Card><CardHeader><div className="flex items-center gap-2"><CircleHelp className="h-4 w-4 text-primary" /><CardTitle>¿No recibes notificaciones?</CardTitle></div></CardHeader><CardContent><p className="text-xs leading-5 text-muted">Revisa tu correo no deseado o verifica la configuración de tu cuenta. Si el problema persiste, contacta al equipo de soporte.</p><Button variant="outline" size="sm" className="mt-4 w-full"><Mail className="h-3.5 w-3.5" />Contactar soporte</Button></CardContent></Card>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
};
