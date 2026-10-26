# Notificaciones — contrato vigente y matriz inicial

Actualizado el 2026-10-24. Este documento describe el contrato vigente del backend y la conexión de `/notificaciones` para el alcance inicial del paso 5.

## Matriz de avisos

| Evento de negocio | Destinatario | Motivo | Canales | Deduplicación | Estado |
|---|---|---|---|---|---|
| `RESULT_PUBLISHED` | Paciente dueño del caso. | Informar que se publicó un resultado disponible. | `IN_APP` siempre; `EMAIL` si el paciente activó `RESULT_AVAILABLE` y el envío está habilitado. | Clave estable `RESULT_PUBLISHED:<resultId>:<versionNumber>`; única en outbox, inbox por destinatario y entrega por canal. | Activo; se representa como tipo de aviso `RESULT_AVAILABLE`. |
| `INPUT_CHANGE_OPENED` | — | El paciente abre su propio borrador de cambio de insumos. No requiere que el paciente responda a una solicitud ajena. | — | Clave de actividad `INPUT_CHANGE_OPENED:<requestId>`. | No genera notificación. |
| `INPUT_CHANGE_RESPONSE_REQUESTED` (propuesto) | Paciente dueño del caso. | Una solicitud futura de coordinación que requiera una respuesta del paciente. | Por definir cuando exista el flujo; comenzar por `IN_APP`. | Solicitud + identificador de transición/versión. | No existe hoy como evento fuente ni genera avisos. |

Los demás eventos de actividad no generan avisos en el alcance inicial. La actividad y las notificaciones son registros separados: una fila `activity_event` no es una notificación ni tiene estado de lectura.

## Endpoints implementados

Todas las rutas requieren una cuenta habilitada con rol `PATIENT`. El backend deriva el destinatario de la sesión autenticada; el cliente no puede consultar ni modificar la bandeja de otra persona.

```http
GET /api/v1/notifications?page=0&size=20
POST /api/v1/notifications/{notificationId}/read
GET /api/v1/notifications/preferences
PUT /api/v1/notifications/preferences/email
```

El listado se ordena por `created_at DESC, id DESC`, usa página base cero, tamaño por defecto 20 y máximo 100. El marcado como leído es idempotente; una notificación que no pertenece al paciente se devuelve como no encontrada.

Ejemplo de listado:

```json
{
  "items": [
    {
      "id": "notification-uuid",
      "type": "RESULT_AVAILABLE",
      "caseReferenceCode": "CAS-20261024-0001",
      "createdAt": "2026-10-24T14:30:00Z",
      "readAt": null
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "totalPages": 1
}
```

`readAt: null` indica que el aviso aún no se ha leído. El tipo, no metadatos libres, permite al frontend producir un texto neutral. `caseReferenceCode` permite navegar a `/mis_casos/{caseReferenceCode}`; el backend filtra la fila por propietario del caso antes de devolverla. La respuesta omite el ID interno del caso y el identificador del resultado porque la interfaz no los necesita.

Preferencia de email:

```json
// GET /api/v1/notifications/preferences
{ "emailForResultsEnabled": false }

// PUT /api/v1/notifications/preferences/email
{ "enabled": true }
```

La bandeja `IN_APP` siempre se crea para un resultado publicado. La preferencia solo controla EMAIL y no borra el aviso del inbox. No hay filtros por categoría, filtro `unreadOnly`, marcado masivo ni preferencias para otros tipos/canales en el API actual.

## Modelo y significado de estados

- `activity_event` conserva el hecho `RESULT_PUBLISHED` con su actor, fecha, caso, resultado y clave de deduplicación.
- `notification_outbox` conserva la intención durable de crear el aviso. Sus estados `PENDING`, `PROCESSING`, `COMPLETED` y `FAILED` describen el procesamiento del outbox, no la lectura ni el envío.
- `notification_inbox` guarda un aviso por destinatario. La restricción por `source_event_key` y destinatario evita duplicados; `read_at` representa la lectura.
- `notification_channel_delivery` guarda un estado independiente por aviso y canal. `IN_APP` pasa a `DELIVERED` cuando se materializa en la bandeja. EMAIL en el backend puede estar `PENDING`, `PROCESSING`, `SENT`, `FAILED` o `SKIPPED`.
- Para EMAIL, `SENT` significa únicamente que SQS aceptó el mensaje; no confirma que Lambda lo procesó ni que SES lo entregó. `FAILED` refleja un fallo al publicar a SQS desde el worker, no errores posteriores del consumidor/SES. `DELIVERED` requiere un acuse verificable del proveedor; aún no está conectado. `SKIPPED` indica canal deshabilitado o no aplicable, no un error.
- `technical_operation_event` registra fallos/reintentos del worker de forma técnica y separada; no es un estado de notificación visible al paciente.

## Reintentos y límites pendientes

- El worker backend reintenta la publicación a SQS ante timeout/fallo temporal hasta cinco intentos lógicos, con pausas de 30, 60, 120 y 240 segundos. Errores permanentes, de configuración o serialización terminan sin reintento; el quinto error temporal deja EMAIL en `FAILED`.
- Tras la aceptación por SQS, Lambda devuelve fallos por mensaje para redelivery; al capturar un error del sender libera el `eventId`, de modo que un nuevo intento puede volver a procesarse. Un procesamiento ya reclamado se reconoce como duplicado. Si Lambda se interrumpe abruptamente entre reclamar y liberar/completar, la fila DynamoDB carece de lease/TTL y el redelivery podría descartarse; está pendiente corregir esa ventana.
- El handler no define el agotamiento de SQS. La DLQ, `maxReceiveCount`, `ReportBatchItemFailures` y `visibilityTimeout` deben configurarse en la cola desplegada. El repositorio no tiene IaC para confirmar esos valores. `HEALTHDOCS_EMAIL_MAX_RETRIES` figura en la configuración Lambda, pero no se consume por el sender.
- No se recibe acuse final de SES/proveedor y los errores posteriores a la aceptación no vuelven al backend. Por eso un aviso puede seguir mostrando `SENT` aunque falle el envío final; no se debe interpretar como `DELIVERED`.

No incluir en la notificación nombres de archivo, contenido clínico, motivos libres ni cuerpos de email. La pantalla debe traducir `type` a etiquetas neutrales y mantener lectura separada del estado de entrega por canal.

## Comportamiento de la interfaz

- La lista consulta el API real, muestra carga, error con reintento y un estado vacío cuando no hay avisos.
- Cada aviso muestra un texto neutral derivado del tipo y una acción individual para marcarlo como leído. La fecha `readAt` del API actualiza el estado en la fila.
- El enlace usa `caseReferenceCode` y abre `/mis_casos/{caseReferenceCode}`. El listado y el detalle verifican acceso del paciente al caso.
- La pantalla no ofrece filtros no soportados, marcado masivo ni preferencias por categoría/canal. “Actividad reciente” sigue siendo una sección separada.

## Próximos trabajos

- Añadir el acuse final de email antes de mostrar o reportar `DELIVERED` para ese canal.
- Diseñar un evento fuente real antes de enviar un aviso de respuesta requerida por cambio de insumos.
- Corregir la deduplicación de Lambda para recuperar reclamos abandonados y versionar/verificar la política SQS/DLQ en el despliegue.

## Verificación de interfaz y contrato

- Pruebas focalizadas de `NotificationsPage`: carga, error/reintento, lista vacía, navegación a `/mis_casos/{caseReferenceCode}`, marcado de lectura y error de marcado. **5 pruebas pasaron** el 2026-10-24.
- `npm run build` (TypeScript y Vite) pasó el 2026-10-24. TypeScript excluye `src/__tests__` y `src/pages/xlegacy`, que contienen pruebas/componentes antiguos con imports obsoletos; los wrappers del dashboard usan ahora las páginas vigentes.
- El contrato OpenAPI describe las rutas, permisos de paciente habilitado, payload mínimo y semántica de `SENT`/`DELIVERED`; YAML parseado correctamente el 2026-10-24.
- En la verificación del 2026-10-24, la suite enfocada a notificaciones pasó; la suite frontend completa aún tenía fallos en pruebas heredadas.
