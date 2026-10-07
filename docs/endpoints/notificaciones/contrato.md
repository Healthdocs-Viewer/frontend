# Contrato inicial: notificaciones

Documento de trabajo para la bandeja general de notificaciones. Es transversal a los roles que tengan acceso a ella; la vista actual corresponde al paciente (`/notificaciones`). Las propuestas deben incorporarse al OpenAPI canónico cuando se acuerden.

## Categorías

`category` agrupa notificaciones para los filtros de la interfaz:

| Categoría | Uso |
| --- | --- |
| `CASES` | Cambios de casos y recepción o solicitud de archivos. |
| `RESULTS` | Publicación, actualización o corrección de resultados. |
| `SYSTEM` | Bienvenida, seguridad y avisos generales de la plataforma. |

Estas categorías corresponden a los filtros actuales. Se pueden agregar otras cuando existan funciones que las necesiten; no se agregan de antemano categorías como citas, pagos o mensajes.

## Tipos de notificación iniciales

`type` identifica el evento concreto. El backend persiste el código y los datos asociados; el frontend lo traduce a título, descripción, icono y estilo en el idioma de la interfaz.

| Tipo | Categoría | Uso |
| --- | --- | --- |
| `CASE_CREATED` | `CASES` | Se creó un caso. |
| `CASE_STATUS_CHANGED` | `CASES` | El caso cambió de estado; incluir el estado nuevo como dato asociado. |
| `FILE_RECEIVED` | `CASES` | Se recibió un archivo enviado por el paciente. |
| `FILE_REQUIRED` | `CASES` | Hace falta cargar un archivo o documento. |
| `RESULT_AVAILABLE` | `RESULTS` | Se publicó el resultado inicial. |
| `RESULT_CORRECTION_REQUIRED` | `RESULTS` | Se solicitó corregir un resultado ya publicado; aviso para el investigador asignado. Propuesto, aún sin evento persistido. |
| `RESULT_CORRECTED` | `RESULTS` | Se publicó el archivo corregido; el paciente puede volver a descargar el resultado vigente. Propuesto, requiere historial de publicaciones. |
| `RESULT_VIEWED` | `RESULTS` | El usuario consultó un resultado; aparece como ejemplo en la interfaz actual. |
| `WELCOME` | `SYSTEM` | La cuenta está lista para usarse. |
| `SECURITY_ALERT` | `SYSTEM` | Ocurrió un evento importante de seguridad. |
| `ACCOUNT_NOTICE` | `SYSTEM` | Hay un aviso administrativo sobre la cuenta. |

No crear un tipo distinto por cada frase o transición menor. Por ejemplo, “tu caso está siendo procesado” puede ser `CASE_STATUS_CHANGED` con el nuevo estado como dato asociado. `RESULT_CORRECTION_REQUIRED` indica que falta corregir; `RESULT_CORRECTED` indica que la nueva carga ya se publicó. La actualización sin solicitud de corrección queda fuera del flujo actual. Véase [el ciclo del resultado](../coordinador/resultados.md#estados-y-acciones).

## Endpoints propuestos

Todas las operaciones requieren autenticación. El backend deriva el usuario destinatario de la identidad autenticada; el cliente no envía un `userId` para leer o modificar su bandeja.

```http
GET  /api/v1/notifications?category=CASES&unreadOnly=true&page=0&size=20
POST /api/v1/notifications/{notificationId}/read
POST /api/v1/notifications/read-all
GET  /api/v1/notification-preferences
PUT  /api/v1/notification-preferences
```

Parámetros de `GET /notifications`:

| Parámetro | Significado |
| --- | --- |
| `category` | `CASES`, `RESULTS` o `SYSTEM`; opcional. |
| `unreadOnly` | Si es `true`, solo notificaciones sin leer. La pestaña “Nuevas” puede usarlo. |
| `page`, `size` | Paginación; por defecto página `0` y tamaño `20`. |

Marcar como leída es idempotente: volver a marcar una notificación ya leída no cambia su fecha inicial de lectura. Marcar todas como leídas afecta únicamente las notificaciones del usuario autenticado.

## Respuesta propuesta para el listado

```json
{
  "summary": {
    "unreadCount": 3,
    "totalCount": 6
  },
  "categoryCounts": {
    "CASES": 3,
    "RESULTS": 2,
    "SYSTEM": 1
  },
  "items": [
    {
      "id": "notification-uuid",
      "type": "RESULT_AVAILABLE",
      "category": "RESULTS",
      "caseId": "case-uuid",
      "caseReferenceCode": "CAS-20260921-0001",
      "createdAt": "2026-09-21T19:22:00Z",
      "readAt": null,
      "data": {
        "studyName": "Radiografía de tórax"
      }
    },
    {
      "id": "notification-uuid-2",
      "type": "CASE_STATUS_CHANGED",
      "category": "CASES",
      "caseId": "case-uuid-2",
      "caseReferenceCode": "CAS-20260921-0002",
      "createdAt": "2026-09-20T15:15:00Z",
      "readAt": "2026-09-20T16:00:00Z",
      "data": {
        "studyName": "Resonancia de rodilla",
        "status": "ENABLED_FOR_PROCESSING"
      }
    }
  ],
  "page": 0,
  "size": 20,
  "totalItems": 6,
  "totalPages": 1,
  "appliedFilters": {
    "category": null,
    "unreadOnly": false
  }
}
```

`readAt: null` indica que la notificación está sin leer. `data` contiene solo los datos necesarios para presentar el evento. `caseReferenceCode` sirve para navegar al caso (`/mis_casos/{caseReferenceCode}`); `caseId` es el UUID para las llamadas al API. Una dirección directa debe resolverse según [la decisión de identificadores](../casos/identificadores-y-rutas.md). El frontend resuelve título, descripción, icono y color a partir de `type` y `data`.

Todos los conteos deben corresponder al usuario autenticado y respetar los filtros acordados. Se recomienda que `categoryCounts` cuente las categorías sobre la bandeja completa, sin aplicar el filtro actual, mientras `totalItems` refleja el listado filtrado y paginado.

## Preferencias

La pantalla actual ofrece preferencias por categoría. Propuesta inicial:

```json
{
  "categories": {
    "CASES": true,
    "RESULTS": true,
    "SYSTEM": true
  }
}
```

Hay que definir qué canales controlan estas preferencias: la bandeja interna, el correo electrónico u otros canales. Una preferencia de categoría no debe borrar notificaciones ya persistidas; determina qué avisos generar o por qué canal enviarlos según la regla que se acuerde.

La vista `/configuracion` también muestra preferencias de correo (`emailNotifications`, `resultReminders`, `securityAlerts`), mientras esta vista muestra preferencias por categoría (`CASES`, `RESULTS`, `SYSTEM`). Son dos modelos distintos en la interfaz; decidir si se unifican en una sola configuración por canal/categoría o se mantienen separados para que el usuario no vea opciones contradictorias.

## Requisitos para el backend

- Persistir destinatario, tipo, categoría, datos del evento, `createdAt` y `readAt`.
- Crear notificaciones a partir de eventos de casos y resultados. El envío actual de un evento de resultado a SQS no crea por sí mismo una notificación consultable.
- Deduplicar la creación ante reintentos de eventos, usando un identificador idempotente del evento de origen.
- Autorizar todas las lecturas y cambios por el usuario autenticado.
- Definir retención y paginación de notificaciones.
- Persistir las preferencias del usuario y aclarar su alcance por canal.

## Estado actual del proyecto

- La pantalla `/notificaciones` usa datos y estado local de ejemplo; al pulsar una tarjeta solo cambia la lectura en memoria.
- La interfaz incluye el ejemplo “Resultado consultado” (`RESULT_VIEWED`), además de eventos `CASE_CREATED`, `CASE_STATUS_CHANGED`, archivo recibido y `WELCOME`; esos tipos son de presentación y todavía no están asociados a eventos persistidos.
- No hay endpoint de listado de bandeja, marcado de lectura ni preferencias persistentes.
- El backend publica un evento de disponibilidad de resultado, pero no mantiene una bandeja de notificaciones del paciente.
