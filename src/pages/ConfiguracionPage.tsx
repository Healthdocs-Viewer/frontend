import React from "react";
import {
  Activity,
  Bell,
  BriefcaseBusiness,
  CircleHelp,
  FileText,
  Home,
  Menu,
  Plus,
  Settings,
  UserRound,
  LockKeyhole,
  Monitor,
  Smartphone,
  Mail,
  ShieldCheck,
  KeyRound,
  LogOut,
  Pencil,
} from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";

export const ConfiguracionPage: React.FC = () => {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside
        className={`${collapsed ? "w-20" : "w-72"} fixed inset-y-0 left-0 z-10 hidden border-r border-slate-200 bg-white transition-all lg:block`}
      >
        <div className="flex h-full flex-col p-4">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="grid h-7 w-7 place-items-center rounded-full border-2 border-slate-900">
              <Activity className="h-4 w-4" aria-hidden="true" />
            </div>
            {!collapsed && <span className="text-base font-semibold">Healthdocs</span>}
          </div>

          <button
            type="button"
            aria-label="Crear nuevo caso"
            className="mt-7 flex items-center gap-3 rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {!collapsed && "Crear nuevo"}
          </button>

          <nav aria-label="Navegación principal" className="mt-5 space-y-1 text-sm text-slate-600">
            {[
              ["Inicio", Home, "/dashboard"],
              ["Mis casos", BriefcaseBusiness, "/dashboard/mis-casos"],
              ["Resultados", FileText, "/dashboard/resultados"],
              ["Notificaciones", Bell, "/notificaciones"],
            ].map(([label, Icon, href]) => (
              <a key={label as string} href={href as string} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-100">
                <Icon className="h-4 w-4" aria-hidden="true" />
                {!collapsed && (label as string)}
              </a>
            ))}
          </nav>

          <div className="mt-auto">
            {!collapsed && <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Sistema</p>}
            <a href="/dashboard/ayuda" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100">
              <CircleHelp className="h-4 w-4" aria-hidden="true" />
              {!collapsed && "Ayuda"}
            </a>
            <a href="/dashboard/Configuracion" aria-current="page" className="flex items-center gap-3 rounded-lg bg-slate-100 px-3 py-2.5 text-sm font-medium text-slate-900">
              <Settings className="h-4 w-4" aria-hidden="true" />
              {!collapsed && "Configuración"}
            </a>
            <button type="button" onClick={() => setCollapsed(!collapsed)} className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-500 hover:bg-slate-100">
              <Menu className="h-4 w-4" aria-hidden="true" />
              {!collapsed && "Contraer menú"}
            </button>
          </div>
        </div>
      </aside>

      <main className={`${collapsed ? "lg:pl-20" : "lg:pl-72"} transition-all`}>
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5 lg:px-8">
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Abrir menú de navegación" className="rounded-lg p-1 text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 lg:hidden">
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <span className="text-sm text-slate-400">Workspace /</span>
            <span className="font-medium">Configuración</span>
          </div>
          <div role="img" aria-label="Avatar del usuario" className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500" />
        </header>

        <div className="space-y-6 p-5 lg:p-8">
          <div>
            <h1 className="text-2xl font-semibold">Perfil y seguridad</h1>
            <p className="mt-1 text-sm text-slate-500">Administra tu información básica, acceso y preferencias de seguridad.</p>
          </div>

          <section className="grid gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(340px,1fr)]">
            <div className="min-w-0 space-y-5">
              <Card>
                <CardContent className="p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-400"><UserRound className="h-7 w-7" aria-hidden="true" /></div>
                      <div><h2 className="text-base font-semibold">María Fernanda Torres</h2><p className="text-sm text-muted">paciente@healthdocs.local</p><div className="mt-2 flex gap-2"><Badge variant="success">PACIENTE</Badge><Badge variant="success">● Cuenta activa</Badge></div></div>
                    </div>
                    <Button variant="default" size="sm"><Pencil className="h-4 w-4" aria-hidden="true" />Editar perfil</Button>
                  </div>
                </CardContent>
              </Card>

              <Card><CardHeader><div className="flex items-center justify-between"><div><CardTitle><UserRound className="mr-2 inline h-4 w-4 text-primary" aria-hidden="true" />Información personal</CardTitle><p className="mt-1 text-xs text-muted">Tu información básica se utiliza para identificarte y personalizar tu experiencia.</p></div><Button variant="outline" size="sm"><Pencil className="h-3.5 w-3.5" aria-hidden="true" />Actualizar información</Button></div></CardHeader><CardContent><div className="divide-y divide-slate-100 rounded-lg border border-slate-100 bg-slate-50/50 px-4">{[["Nombre completo","María Fernanda Torres"],["Correo electrónico","paciente@healthdocs.local"],["Tipo de usuario","Paciente"],["Documento de identificación","CC · 12345678"]].map(([label,value])=><div key={label} className="grid gap-1 py-2.5 text-sm sm:grid-cols-[180px_1fr]"><span className="text-muted">{label}</span><span className="font-medium">{value}</span></div>)}</div></CardContent></Card>

              <Card><CardHeader><CardTitle><LockKeyhole className="mr-2 inline h-4 w-4 text-primary" aria-hidden="true" />Seguridad de la cuenta</CardTitle><p className="text-xs text-muted">Gestiona tus opciones de acceso y mantén tu cuenta protegida.</p></CardHeader><CardContent className="space-y-2">{[[KeyRound,"Contraseña","Última actualización: 15 sep. 2026, 10:24","Cambiar contraseña"],[ShieldCheck,"Verificación de acceso","Aumenta la seguridad de tu cuenta con un segundo factor de verificación.","Gestionar seguridad"],[Mail,"Recuperación de cuenta","Configura un correo de recuperación para facilitar el acceso a tu cuenta.","Configurar"]].map(([Icon,title,description,action])=><div key={title as string} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3"><Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" /><div className="min-w-0 flex-1"><p className="text-sm font-medium">{title as string}</p><p className="text-xs text-muted">{description as string}</p></div><Button variant="outline" size="sm">{action as string}</Button></div>)}<div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-xs text-indigo-700"><strong>Próximamente: seguridad avanzada</strong><br />Estamos trabajando en la integración con Amazon Cognito para ofrecer autenticación de dos factores y más opciones de seguridad.</div></CardContent></Card>
            </div>

            <div className="min-w-0 space-y-5">
              <Card><CardHeader><CardTitle><Monitor className="mr-2 inline h-4 w-4 text-primary" aria-hidden="true" />Sesiones activas</CardTitle><p className="text-xs text-muted">Revisa los dispositivos donde has iniciado sesión.</p></CardHeader><CardContent className="space-y-2">{[[Monitor,"Windows · Chrome","Bogotá, Colombia · IP 181.48.12.203","Sesión actual"],[Smartphone,"iPhone · Safari","Bogotá, Colombia · IP 181.48.12.203","19 sep. 2026, 16:42"],[Monitor,"macOS · Chrome","Medellín, Colombia · IP 190.145.33.87","12 sep. 2026, 09:15"]].map(([Icon,title,location,date],index)=><div key={title as string} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3"><Icon className="h-5 w-5 text-muted" aria-hidden="true" /><div className="min-w-0 flex-1"><p className="text-sm font-medium">{title as string}</p><p className="text-xs text-muted">{location as string}</p></div><span className="text-right text-xs text-muted">{index===0?<Badge variant="success">{date as string}</Badge>:date as string}</span></div>)}<Button variant="outline" className="w-full"><LogOut className="h-4 w-4" aria-hidden="true" />Cerrar todas las sesiones</Button></CardContent></Card>

              <Card><CardHeader><CardTitle><Settings className="mr-2 inline h-4 w-4 text-primary" aria-hidden="true" />Preferencias</CardTitle><p className="text-xs text-muted">Configura tus comunicaciones y notificaciones.</p></CardHeader><CardContent className="space-y-4">{[[Mail,"Notificaciones por correo","Recibe actualizaciones importantes sobre tu cuenta."],[FileText,"Recordatorios de resultados","Recibe un correo cuando tus resultados estén listos."],[ShieldCheck,"Alertas de seguridad","Recibe notificaciones sobre accesos y cambios en tu cuenta."]].map(([Icon,title,description])=><div key={title as string} className="flex items-center gap-3"><Icon className="h-5 w-5 text-primary" aria-hidden="true" /><div className="min-w-0 flex-1"><p className="text-sm font-medium">{title as string}</p><p className="text-xs text-muted">{description as string}</p></div><div className="h-5 w-9 rounded-full bg-primary p-0.5"><div className="ml-4 h-4 w-4 rounded-full bg-white" /></div></div>)}</CardContent></Card>

              <Card><CardHeader><CardTitle><LogOut className="mr-2 inline h-4 w-4 text-danger" aria-hidden="true" />Acciones de la cuenta</CardTitle><p className="text-xs text-muted">Gestiona tu sesión y la seguridad de tu cuenta.</p></CardHeader><CardContent className="flex flex-col gap-2 sm:flex-row"><Button variant="outline" className="flex-1 border-red-200 text-red-600 hover:border-red-300"><LogOut className="h-4 w-4" aria-hidden="true" />Cerrar sesión</Button><Button variant="outline" className="flex-1 border-red-200 text-red-600 hover:border-red-300"><ShieldCheck className="h-4 w-4" aria-hidden="true" />Cerrar todas las sesiones</Button></CardContent></Card>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
