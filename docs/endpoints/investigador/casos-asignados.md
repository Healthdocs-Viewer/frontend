# Contrato de datos: Casos asignados

Contrato de integración de la vista `/casos_asignados`, usada por investigadores. La vista obtiene el listado del endpoint interno y realiza en el navegador la búsqueda, los filtros, el orden y la paginación.

## Qué muestra la interfaz

- Título «Casos Académicos» y una tabla de casos asignados.
- Búsqueda por identificador de caso (`referenceCode`).
- Filtros por los estados del listado. Cada filtro tiene contador.
- Columnas: identificador del caso, fecha de recepción, estado, última actualización y acciones.
- Orden ascendente/descendente por fecha de recepción.
- Paginación de ocho casos por página.
- Acción «Ver detalle», que abre `/casos_asignados/:referenceCode`.

La ruta obtiene todos los casos asignados al usuario autenticado. La búsqueda, los contadores, los filtros, el orden por fecha de recepción y las páginas de ocho elementos se calculan localmente sobre esa lista completa.

## Endpoint existente

El endpoint que corresponde a los casos del usuario interno autenticado ya existe:

```http
GET /api/v1/internal/cases
Authorization: Bearer <token>
```

El backend restringe este endpoint al rol `RESEARCHER`, valida que la cuenta esté habilitada y determina el usuario desde el token. Devuelve una lista JSON de todos los casos asignados al investigador en los estados `FILES_RECEIVED`, `INPUT_CHANGE_DRAFT`, `INPUT_CHANGE_REVIEW`, `ENABLED_FOR_PROCESSING`, `RESULT_UPLOADED` y `RESULT_AVAILABLE`. El endpoint no recibe parámetros de búsqueda, filtros, orden ni paginación; esas operaciones se hacen localmente en el frontend.

### Respuesta actual del backend

```json
[
  {
    "id": "case-uuid",
    "referenceCode": "CAS-20260921-0042",
    "studyName": "Radiografía de tórax",
    "status": "ENABLED_FOR_PROCESSING",
    "createdAt": "2026-09-21T14:32:00Z",
    "files": [
      {
        "id": "file-uuid",
        "originalFilename": "radiografia-torax.dcm",
        "contentType": "application/dicom",
        "sizeBytes": 1258291,
        "fileKind": "INPUT"
      }
    ],
    "result": null
  }
]
```

Cuando el caso tenga un resultado cargado, `result` puede ser:

```json
{
  "id": "result-uuid",
  "originalFilename": "informe.pdf",
  "status": "UPLOADED",
  "uploadedBy": "researcher-uuid",
  "uploadedAt": "2026-09-22T10:15:00Z",
  "availableAt": null
}
```

`id` es el UUID técnico del caso y debe usarse en las operaciones de API; `referenceCode` es el identificador legible que se muestra en la tabla y se usa en la dirección de detalle. `studyName` es el nombre de estudio libre compartido por las vistas. `createdAt` es el instante de creación/recepción del caso; el frontend lo formatea en hora local, por ejemplo `21/9/2026, 14:32`.

## Campos de la tabla

La respuesta alimenta el identificador (`referenceCode`), la fecha de recepción (`createdAt`), el estado y la última actualización (`updatedAt`). Ambas fechas se envían como instantes ISO 8601 en UTC; el frontend las presenta en hora local. Si `updatedAt` es nulo o no está disponible en una respuesta antigua, la tabla muestra «—».

```json
{
  "id": "case-uuid",
  "referenceCode": "CAS-20260921-0042",
  "studyName": "Radiografía de tórax",
  "status": "ENABLED_FOR_PROCESSING",
  "createdAt": "2026-09-21T14:32:00Z",
  "updatedAt": "2026-09-22T10:15:00Z",
  "files": [],
  "result": null
}
```

Las fechas deben seguir siendo ISO 8601 en UTC en el API; no enviar el texto localizado ya formateado. El listado no entrega datos del investigador asignado y la vista actual no busca por investigador. Si ese requisito se incorpora, habrá que añadir al contrato los datos de asignación que correspondan al alcance del usuario, por ejemplo:

```json
"assignees": [
  {
    "userId": "researcher-uuid",
    "researcherCode": "EST-1187",
    "fullName": "Ana Ruiz"
  }
]
```

Para una vista de investigador, el usuario actual ya es el asignado y no haría falta incluir una lista de compañeros. Si coordinadores también usan esta pantalla y necesitan ver responsables, definir si se muestra un responsable principal o todas las asignaciones.

## Estados

| Estado de API | Etiqueta de interfaz | Situación |
| --- | --- | --- |
| `FILES_RECEIVED` | Archivos recibidos | Archivos del caso recibidos; aún no habilitado para procesamiento. |
| `INPUT_CHANGE_DRAFT` | Cambio en edición | Solicitud de cambio de archivos en edición. |
| `INPUT_CHANGE_REVIEW` | Cambio pendiente de revisión | Solicitud de cambio de archivos enviada para revisión. |
| `ENABLED_FOR_PROCESSING` | En procesamiento | Caso asignado y habilitado para trabajo interno. |
| `RESULT_UPLOADED` | Resultado en revisión | Se cargó un resultado, pendiente de publicación por coordinación al propietario del caso. |
| `RESULT_AVAILABLE` | Disponible para el propietario | El resultado ya fue publicado. |

Los filtros y etiquetas de la vista corresponden a los estados de caso enumerados arriba. «Sin asignar» no forma parte del listado personal del investigador. «Corrección requerida» es un estado de resultado, no uno de los estados de caso que devuelve este endpoint.

## Paginación, búsqueda y orden

El contrato devuelve la lista completa y la vista resuelve búsqueda, filtro, orden y paginación en el frontend. Si el volumen requiere paginación de servidor, se debe cambiar el contrato y la vista para usarla de extremo a extremo; el cliente no debe combinar una página del servidor con una segunda paginación local. Una posible evolución sería:

```http
GET /api/v1/internal/cases?q=CAS-2026&status=RESULT_UPLOADED&sort=createdAt,desc&page=0&size=8
```

Y devolver un sobre paginado:

```json
{
  "items": [],
  "page": 0,
  "size": 8,
  "totalItems": 24,
  "totalPages": 3,
  "appliedFilters": {
    "q": "CAS-2026",
    "status": "RESULT_UPLOADED",
    "sort": "createdAt,desc"
  }
}
```

Por ahora no se envían esos parámetros y el frontend conserva las operaciones locales.

## Navegación al detalle

El detalle del investigador se abre con `/casos_asignados/{referenceCode}`. El frontend resuelve el UUID desde la lista asignada y carga los metadatos, archivos, resultados y personas asignadas con `GET /api/v1/internal/cases/{caseId}`. Este endpoint solo permite consultar los casos asignados al investigador; la vista informa quiénes están asignados, pero no permite gestionarlos. La vista de coordinación continúa usando `/casos_academicos/{referenceCode}`.

El detalle incluye `researchers`, la lista de investigadores habilitados asignados al mismo caso, con nombre, código, estado de autorización y fecha de asignación. Se presenta como información de acceso; esta vista no permite modificar las asignaciones.

La carga de resultados solo se habilita cuando el estado es `ENABLED_FOR_PROCESSING`. Se bloquea mientras una solicitud de cambio está en edición o revisión, mientras un resultado espera revisión (`RESULT_UPLOADED`) y cuando ya está publicado (`RESULT_AVAILABLE`). Las decisiones de solicitudes de cambio, publicación y gestión de investigadores siguen siendo acciones de coordinación.

## Ciclo del resultado desde el detalle

El investigador asignado inicia la carga desde el detalle. El frontend crea una intención con `POST /api/v1/internal/cases/{caseId}/result-uploads`, sube el archivo a la URL temporal y completa la carga mediante `POST /api/v1/files/{fileId}/complete`. El resultado confirmado queda `UPLOADED` y el caso `RESULT_UPLOADED`; coordinación decide si lo publica o solicita corrección.

Si el resultado `UPLOADED` requiere reemplazo o retiro, el investigador debe enviar un motivo a `DELETE /api/v1/internal/cases/{caseId}/results/{resultId}?reason=...`. La operación es una baja lógica: conserva auditoría e historial, y devuelve el caso a `ENABLED_FOR_PROCESSING`. Para reemplazarlo, luego se inicia una nueva carga; no existe reemplazo directo en una sola llamada. Un resultado `AVAILABLE` no se elimina desde el investigador.

Cuando coordinación solicita corrección de un resultado publicado, el resultado pasa a `CORRECTION_REQUIRED`, el caso vuelve a `ENABLED_FOR_PROCESSING` y el propietario deja de tener acceso al resultado. El detalle del investigador muestra el motivo y permite cargar una nueva versión. La nueva versión vuelve a `UPLOADED`/`RESULT_UPLOADED` y requiere publicación de coordinación como `CORRECTED`.

El backend también ofrece `GET /api/v1/internal/cases/{caseId}/results/history` para consultar el historial. La lista plana `GET /api/v1/internal/results` devuelve todos los resultados permitidos al investigador autenticado; actualmente no pagina en servidor.

### Limitaciones de implementación conocidas

- Aunque la intención devuelve `expiresAt`, el backend no persiste ni valida el vencimiento al completar la carga. El contrato requiere rechazar una confirmación vencida; falta implementar esa validación.
- El tipo `INITIAL` o `CORRECTED` no debe inferirse solo del número de versión. Hoy, tras borrar una primera carga aún no publicada, una nueva versión puede clasificarse como `CORRECTED` sin que haya existido publicación previa.
- Si el navegador no informa el MIME del archivo, el formulario solo reconoce como fallback PDF y MP4. Otros formatos admitidos, como DICOM o ZIP, pueden recibir un MIME erróneo y ser rechazados.
- El mock de resultados no reproduce de forma completa las restricciones por rol, asignación y estado del backend; su eliminación física tampoco conserva el historial auditable.

## Brechas actuales

- La vista consume `GET /api/v1/internal/cases`; búsqueda, filtros, orden y paginación operan sobre la lista completa en el frontend.
- El endpoint entrega `updatedAt`; la tabla lo muestra y conserva «—» como respaldo si viene nulo.
- La búsqueda se limita a `referenceCode`; la respuesta no incluye investigadores asignados.
- El control de orden cambia el orden por fecha de recepción.
- La ruta y el endpoint están restringidos al rol investigador; el backend también valida que la cuenta esté habilitada y aplica el alcance de asignaciones del usuario autenticado.

## Decisión pendiente

Si se requiere buscar por investigador, acordar qué datos de asignación debe devolver el endpoint.
