# Contrato de datos: Resultados cargados

Documento de trabajo para la vista `/resultados_cargados`, dentro del espacio de trabajo del investigador. Describe la lista de resultados asociados a los casos asignados, el endpoint existente y una propuesta de endpoint de consulta para alimentar la tabla. Las propuestas no sustituyen el OpenAPI canónico hasta que se acuerden e incorporen allí.

## Qué muestra la interfaz

- Buscador por resultado, caso o investigador.
- Filtros: todos, cargado, corrección requerida, disponible para el paciente y eliminado; cada filtro muestra su contador.
- Tabla con resultado y metadatos de archivo, caso y `studyName`, fecha de carga, estado, última actualización y acción «Ver caso».
- Orden por resultado, caso, fecha de carga, estado y última actualización. También hay un selector para más reciente, más antiguo o resultado A–Z.
- Paginación de ocho filas por página.
- «Ver caso» abre el detalle académico del caso.

La interfaz usa datos locales de demostración. El propósito del endpoint es listar los resultados que el investigador autenticado puede consultar en sus casos asignados, no devolver resultados de otros investigadores. Si el rol coordinador también va a usar esta vista para revisar resultados de sus investigadores, debe usar un alcance y endpoint de docencia separados.

## Fuente de datos existente

El backend ya entrega resultados dentro de cada caso asignado:

```http
GET /api/v1/internal/cases
Authorization: Bearer <token>
```

La respuesta es una lista de casos y cada caso puede incluir `result` con `id`, `originalFilename`, `status`, `uploadedBy`, `uploadedAt` y `availableAt`. El cliente podría aplanar los casos que tengan `result`, pero este endpoint no devuelve filas de resultado paginadas, ni búsqueda/orden/filtros de servidor, ni `updatedAt` del resultado. La lista de resultados como vista independiente se recomienda como endpoint propio.

## Endpoint recomendado para esta vista

```http
GET /api/v1/internal/results?q=informe&status=UPLOADED&sort=uploadedAt,desc&page=0&size=8
Authorization: Bearer <token>
```

El servidor obtiene el usuario desde el token y limita la consulta a resultados de sus casos asignados. Parámetros propuestos:

| Parámetro | Significado |
| --- | --- |
| `q` | Búsqueda por nombre de archivo, código de caso o nombre de estudio. |
| `status` | Filtro opcional por `UPLOADED`, `AVAILABLE`, `CORRECTION_REQUIRED` o `DELETED`. Sin valor incluye los cuatro estados. |
| `sort` | Orden por `originalFilename`, `referenceCode`, `uploadedAt`, `status` o `updatedAt`, con `asc`/`desc`. |
| `page` | Índice de página empezando en 0. |
| `size` | Resultados por página; valor inicial 8 y máximo sugerido 100. |

### Respuesta propuesta

```json
{
  "items": [
    {
      "id": "result-uuid",
      "originalFilename": "informe-radiologico.pdf",
      "contentType": "application/pdf",
      "sizeBytes": 1258291,
      "case": {
        "id": "case-uuid",
        "referenceCode": "CAS-20260921-0042",
        "studyName": "Radiografía de tórax"
      },
      "status": "UPLOADED",
      "uploadedAt": "2026-09-21T14:32:00Z",
      "updatedAt": "2026-09-21T14:32:00Z",
      "availableAt": null,
      "deletedAt": null,
      "deletedBy": null,
      "deletionReason": null
    }
  ],
  "summary": {
    "total": 12,
    "uploaded": 5,
    "available": 4,
    "correctionRequired": 2,
    "deleted": 1
  },
  "page": 0,
  "size": 8,
  "totalItems": 12,
  "totalPages": 2,
  "appliedFilters": {
    "q": "informe",
    "status": "UPLOADED",
    "sort": "uploadedAt,desc"
  }
}
```

`id` es el UUID técnico del resultado. `case.referenceCode` se usa en la dirección de detalle; `case.id` es el UUID para las llamadas al API. `case.studyName` es el nombre del estudio. La UI de demostración muestra un nombre genérico y un código `RES-...`, pero el backend actualmente solo tiene UUID y nombre original del archivo; no hay `displayName` ni código público de resultado. Se recomienda mostrar `originalFilename` como nombre del archivo y no inventar un identificador `RES-...` hasta que exista una necesidad de negocio.

Cuando `status=DELETED`, `deletedAt`, `deletedBy` y `deletionReason` son obligatorios; en los demás estados son `null`. El investigador ve esos metadatos, además de la fila eliminada. La pantalla de demostración todavía no tiene el filtro «Eliminados» ni muestra estos datos; ambos forman parte del contrato de interfaz.

Las fechas deben transmitirse como ISO 8601 UTC; el frontend las presenta en formato local, por ejemplo `20/9/2026, 16:20`. El tamaño debe venir como `sizeBytes` numérico y la UI lo convierte a KB/MB. No incluir una URL permanente de descarga en el listado.

## Estados

| Estado de API | Etiqueta en pantalla |
| --- | --- |
| `UPLOADED` | Cargado |
| `AVAILABLE` | Disponible para el paciente |
| `CORRECTION_REQUIRED` | Corrección requerida |
| `DELETED` | Eliminado |

El flujo es `UPLOADED → AVAILABLE → CORRECTION_REQUIRED → UPLOADED → AVAILABLE`. La corrección se solicita sobre un resultado ya publicado; el investigador carga el reemplazo y un coordinador debe revisarlo y publicarlo de nuevo. `CORRECTION_REQUIRED` no significa que el archivo ya esté corregido. Desde cualquiera de esos tres estados, coordinación puede marcar el resultado `DELETED`. El investigador sigue viendo su fila, estado, fecha y motivo de eliminación en el listado y el detalle, pero no puede descargar el archivo eliminado ni eliminarlo desde esta vista. `DELETED` no tiene transición de salida. Véase [el flujo completo](../coordinador/resultados.md#estados-y-acciones).

## Acciones y descarga

La acción visible «Ver caso» debe navegar a `/casos_academicos/{case.referenceCode}`. El UUID `case.id` se usa para las llamadas al API; una dirección directa se resuelve según [la decisión de identificadores](../casos/identificadores-y-rutas.md).

Si el investigador necesita descargar el resultado desde esta tabla, ya existe:

```http
POST /api/v1/internal/cases/{caseId}/results/{resultId}/download
Authorization: Bearer <token>
```

Respuesta:

```json
{
  "downloadUrl": "https://storage.example/temporary-signed-url",
  "expiresAt": "2026-09-21T15:02:00Z"
}
```

La URL de descarga es temporal. El endpoint valida el acceso interno al caso y al resultado. Por ahora los resultados solo se descargan; no se ofrece vista previa o visualización integrada. La acción de descarga no se muestra cuando `status=DELETED`. La interfaz actual no tiene acción directa de descarga y puede conducir al detalle académico para obtenerla.

## Estado actual y brechas

- `GET /api/v1/internal/cases` es el endpoint existente más cercano; incluye `result` anidado y entrega solo casos visibles para el usuario interno autenticado.
- El frontend de `/resultados_cargados` aún usa datos locales; no está conectado al API.
- El endpoint existente no ofrece el formato plano, búsqueda, filtros, orden ni paginación que necesita una pantalla de tabla independiente.
- `ResultView` no expone `updatedAt`, aunque la entidad de resultado sí lo registra.
- El backend permite un resultado/archivo por caso y no conserva historial de versiones; la columna de versiones presente en la vista equivalente de docencia no debe aparecer como funcional hasta añadir versionado.
- `CORRECTION_REQUIRED` y `DELETED`, nombre de presentación del resultado y código público `RES-...` no existen aún en el backend; siguen siendo parte del contrato de esta interfaz.
- El objeto local usa `study` y presenta `caseId` como código legible; al integrar el contrato común usar `case.studyName`, `case.id` (UUID para API) y `case.referenceCode` (dirección visible) por separado.
- La ruta `/resultados_cargados` está protegida por el guard de rol investigador en `AppRoutes`; el backend debe validar también el rol, la cuenta y el alcance de las asignaciones.
- Para investigadores, el backend devuelve `uploadedBy` como UUID. Esta pantalla no necesita exponer nombres/códigos de otros investigadores; la restricción de alcance debe garantizar que no se filtren resultados de terceros.

## Decisiones pendientes

1. Confirmar que `/resultados_cargados` lista resultados propios del investigador autenticado; si también la usa un coordinador, definir el alcance por separado.
2. Decidir si se implementa `GET /api/v1/internal/results` o se aplana `GET /api/v1/internal/cases` en frontend mientras el volumen sea pequeño.
3. Confirmar si la pantalla debe ofrecer descarga directa o mantener únicamente «Ver caso».
4. Adaptar el backend a los cuatro estados del resultado, con eliminación lógica visible internamente y sincronización de la descarga del paciente.
5. Mantener el UUID de caso separado de `referenceCode` en los tipos del frontend y usar `referenceCode` en la ruta SPA.
