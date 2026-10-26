import React from "react";
import { Link } from "react-router-dom";
import { CheckCheck, ChevronRight, FileCheck2 } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { cn } from "../../components/ui/cn";
import {
  getNotifications,
  isNotificationUnread,
  markNotificationRead,
} from "../../services/notifications";
import type {
  NotificationItem,
  NotificationType,
  NotificationsResponse,
} from "../../types/notifications";

const PAGE_SIZE = 20;

const notificationPresentation: Record<NotificationType, { title: string }> = {
  RESULT_AVAILABLE: { title: "Resultado disponible" },
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

function getDescription(item: NotificationItem): string {
  return `Hay un resultado disponible para el caso ${item.caseReferenceCode}.`;
}

export const NotificationsPage: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const [page, setPage] = React.useState(0);
  const [reloadKey, setReloadKey] = React.useState(0);
  const [response, setResponse] = React.useState<NotificationsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [actionError, setActionError] = React.useState("");
  const [markingReadId, setMarkingReadId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setResponse(null);

    getNotifications({ page, size: PAGE_SIZE })
      .then((data) => {
        if (active) setResponse(data);
      })
      .catch(() => {
        if (active) setError("No se pudieron cargar las notificaciones.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [page, reloadKey]);

  const markRead = async (item: NotificationItem) => {
    if (!isNotificationUnread(item)) return;
    setActionError("");
    setMarkingReadId(item.id);
    try {
      const updated = await markNotificationRead(item.id);
      setResponse((current) => current && ({
        ...current,
        items: current.items.map((entry) => entry.id === updated.id ? updated : entry),
      }));
    } catch {
      setActionError("No se pudo marcar el aviso como leído. Inténtalo de nuevo.");
    } finally {
      setMarkingReadId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        {embedded
          ? <h2 className="text-xl font-semibold text-content">Notificaciones</h2>
          : <h1 className="text-2xl font-semibold text-content">Notificaciones</h1>}
        <p className="mt-1 text-sm text-muted">Novedades importantes sobre tus casos.</p>
      </div>

      <Card className="min-w-0 overflow-hidden">
        <CardContent className="space-y-3 p-3 sm:p-4">
          {loading && <p role="status" className="py-8 text-center text-sm text-muted">Cargando notificaciones…</p>}

          {!loading && error && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <p role="alert" className="text-sm text-red-600">{error}</p>
              <Button size="sm" variant="outline" onClick={() => setReloadKey((key) => key + 1)}>
                Reintentar
              </Button>
            </div>
          )}

          {!loading && !error && response?.items.length === 0 && (
            <p className="py-10 text-center text-sm text-muted">
              No tienes notificaciones por ahora. Cuando haya novedades sobre tus casos, aparecerán aquí.
            </p>
          )}

          {actionError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</p>}

          {!loading && !error && response?.items.map((notification) => {
            const unread = isNotificationUnread(notification);
            return (
              <article
                key={notification.id}
                className={cn(
                  "flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-start sm:p-4",
                  unread
                    ? "border-indigo-200 bg-indigo-50/50 dark:border-indigo-800 dark:bg-slate-800/80"
                    : "border-border bg-surface",
                )}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <FileCheck2 className="h-4 w-4" aria-hidden="true" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-sm text-content">
                      {notificationPresentation[notification.type].title}
                    </strong>
                    <Badge variant="neutral">{notification.caseReferenceCode}</Badge>
                    <span className="text-xs text-muted">{formatDate(notification.createdAt)}</span>
                    <span className="text-xs text-muted">{unread ? "Sin leer" : "Leída"}</span>
                  </div>
                  <p className="mt-1 text-sm leading-5 text-muted">{getDescription(notification)}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <Link
                      to={`/mis_casos/${encodeURIComponent(notification.caseReferenceCode)}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 hover:text-indigo-800 dark:text-indigo-300"
                    >
                      Ver caso<ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                    {unread && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={markingReadId === notification.id}
                        onClick={() => void markRead(notification)}
                      >
                        <CheckCheck className="h-4 w-4" aria-hidden="true" />
                        {markingReadId === notification.id ? "Guardando…" : "Marcar como leída"}
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </CardContent>

        {!loading && !error && response && response.totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-muted">
            <span>Mostrando {response.items.length} de {response.totalElements} notificaciones</span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page === 0}
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                aria-label="Página anterior"
              >
                Anterior
              </Button>
              <span>Página {page + 1} de {response.totalPages}</span>
              <Button
                size="sm"
                variant="outline"
                disabled={page + 1 >= response.totalPages}
                onClick={() => setPage((current) => Math.min(response.totalPages - 1, current + 1))}
                aria-label="Página siguiente"
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
