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
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";

export const SettingsPage: React.FC<{ embedded?: boolean }> = ({
  embedded = false,
}) => {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Perfil y seguridad</h1>
        <p className="mt-1 text-sm text-slate-500">
          Administra tu información básica, acceso y preferencias de seguridad.
        </p>
      </div>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(340px,1fr)]">
        <div className="min-w-0 space-y-5">
          <Card>
            <CardContent className="p-card">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-400">
                    <UserRound className="h-7 w-7" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold">
                      María Fernanda Torres
                    </h2>
                    <p className="text-sm text-muted">
                      paciente@healthdocs.local
                    </p>
                    <div className="mt-2 flex gap-2">
                      <Badge variant="success">PACIENTE</Badge>
                      <Badge variant="success">● Cuenta activa</Badge>
                    </div>
                  </div>
                </div>
                <Button variant="default" size="sm">
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  Editar perfil
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <CardTitle>
                    <UserRound
                      className="mr-2 inline h-4 w-4 text-primary"
                      aria-hidden="true"
                    />
                    Información personal
                  </CardTitle>
                  <p className="mt-1 max-w-xl text-xs leading-5 text-muted">
                    Tu información básica se utiliza para identificarte y
                    personalizar tu experiencia.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full shrink-0 sm:w-auto"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  Actualizar información
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-slate-200/80 rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-800/50">
                {[
                  ["Nombre completo", "María Fernanda Torres"],
                  ["Correo electrónico", "paciente@healthdocs.local"],
                  ["Tipo de usuario", "Paciente"],
                  ["Documento de identificación", "CC · 12345678"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="grid gap-1 py-3 text-sm sm:grid-cols-[180px_1fr] sm:gap-4"
                  >
                    <span className="text-muted">{label}</span>
                    <span className="break-words font-medium text-content">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <LockKeyhole
                  className="mr-2 inline h-4 w-4 text-primary"
                  aria-hidden="true"
                />
                Seguridad de la cuenta
              </CardTitle>
              <p className="text-xs text-muted">
                Gestiona tus opciones de acceso y mantén tu cuenta protegida.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                [
                  KeyRound,
                  "Contraseña",
                  "Última actualización: 15/9/2026, 10:24",
                  "Cambiar contraseña",
                ],
                [
                  ShieldCheck,
                  "Verificación de acceso",
                  "Aumenta la seguridad de tu cuenta con un segundo factor de verificación.",
                  "Gestionar seguridad",
                ],
                [
                  Mail,
                  "Recuperación de cuenta",
                  "Configura un correo de recuperación para facilitar el acceso a tu cuenta.",
                  "Configurar",
                ],
              ].map(([Icon, title, description, action]) => (
                <div
                  key={title as string}
                  className="flex flex-col items-stretch gap-3 rounded-xl border border-slate-200/80 bg-slate-50/40 p-3.5 sm:flex-row sm:items-center dark:border-slate-700 dark:bg-slate-800/40"
                >
                  <Icon
                    className="h-5 w-5 shrink-0 text-primary dark:text-indigo-300"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-content">
                      {title as string}
                    </p>
                    <p className="text-xs leading-5 text-muted">
                      {description as string}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full shrink-0 sm:w-auto"
                  >
                    {action as string}
                  </Button>
                </div>
              ))}
              <div className="rounded-xl border border-indigo-200/80 bg-indigo-50 p-3 text-xs leading-5 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200">
                <strong>Próximamente: seguridad avanzada</strong>
                <br />
                Estamos trabajando en la integración con Amazon Cognito para
                ofrecer autenticación de dos factores y más opciones de
                seguridad.
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>
                <Monitor
                  className="mr-2 inline h-4 w-4 text-primary"
                  aria-hidden="true"
                />
                Sesiones activas
              </CardTitle>
              <p className="text-xs text-muted">
                Revisa los dispositivos donde has iniciado sesión.
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                [
                  Monitor,
                  "Windows · Chrome",
                  "Bogotá, Colombia · IP 181.48.12.203",
                  "Sesión actual",
                ],
                [
                  Smartphone,
                  "iPhone · Safari",
                  "Bogotá, Colombia · IP 181.48.12.203",
                  "19/9/2026, 16:42",
                ],
                [
                  Monitor,
                  "macOS · Chrome",
                  "Medellín, Colombia · IP 190.145.33.87",
                  "12/9/2026, 09:15",
                ],
              ].map(([Icon, title, location, date], index) => (
                <div
                  key={title as string}
                  className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3.5 transition-colors dark:border-slate-700 dark:bg-slate-800/60"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-muted shadow-sm dark:bg-slate-700 dark:text-slate-300">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-content">
                      {title as string}
                    </p>
                    <p className="text-xs text-muted">{location as string}</p>
                  </div>
                  <span className="shrink-0 text-right text-xs text-muted">
                    {index === 0 ? (
                      <Badge variant="success">{date as string}</Badge>
                    ) : (
                      (date as string)
                    )}
                  </span>
                </div>
              ))}
              <Button variant="outline" className="mt-1 w-full">
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Cerrar todas las sesiones
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <Settings
                  className="mr-2 inline h-4 w-4 text-primary"
                  aria-hidden="true"
                />
                Preferencias
              </CardTitle>
              <p className="text-xs text-muted">
                Configura tus comunicaciones y notificaciones.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                [
                  Mail,
                  "Notificaciones por correo",
                  "Recibe actualizaciones importantes sobre tu cuenta.",
                ],
                [
                  FileText,
                  "Recordatorios de resultados",
                  "Recibe un correo cuando tus resultados estén listos.",
                ],
                [
                  ShieldCheck,
                  "Alertas de seguridad",
                  "Recibe notificaciones sobre accesos y cambios en tu cuenta.",
                ],
              ].map(([Icon, title, description]) => (
                <div key={title as string} className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{title as string}</p>
                    <p className="text-xs text-muted">
                      {description as string}
                    </p>
                  </div>
                  <div className="h-5 w-9 rounded-full bg-primary p-0.5">
                    <div className="ml-4 h-4 w-4 rounded-full bg-white" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <LogOut
                  className="mr-2 inline h-4 w-4 text-danger"
                  aria-hidden="true"
                />
                Acciones de la cuenta
              </CardTitle>
              <p className="text-xs text-muted">
                Gestiona tu sesión y la seguridad de tu cuenta.
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                className="flex-1 border-red-200 text-red-600 hover:border-red-300"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Cerrar sesión
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-red-200 text-red-600 hover:border-red-300"
              >
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Cerrar todas las sesiones
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};
