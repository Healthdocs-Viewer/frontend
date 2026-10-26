# Contrato de respuesta: Mis casos propios

Contrato de la vista `/mis_casos` para todos los roles. El contrato HTTP canónico está en [`backend/openapi/openapi.yaml`](../../../../backend/openapi/openapi.yaml).

## Qué necesita la interfaz

La vista actual contiene:

- búsqueda por código del caso o nombre del estudio;
- filtros: Todos, Pendientes, En procesamiento y Resultado disponible, cada uno con su contador;
- orden por fecha de creación, más recientes o más antiguos;
- tabla con columnas separadas para identificador del caso y estudio, además de fecha, estado, última actualización y acción;
- columna “Última actualización” para mostrar cuándo cambió por última vez el caso;
- paginación y texto “Mostrando X de Y casos”;
- botón para crear un caso nuevo.

El backend obtiene el usuario del token. El frontend nunca envía un `patientId` ni un `userId` para seleccionar los casos.

## Casos visibles por rol

| Rol | Conjunto que devuelve `GET /api/v1/cases` |
| --- | --- |
| `PATIENT`, `RESEARCHER`, `COORDINATOR`, `ADMIN` | Casos cuyo propietario es el usuario autenticado, desde que se crea en `CONSENT_PENDING` hasta que termina el ciclo operativo. |

Los casos asignados a investigadores y los casos de la cola de coordinación se consultan desde sus pantallas operativas, no desde “Mis casos”. El backend no acepta un ID de usuario del cliente para cambiar el propietario consultado.

## Endpoint

Ampliar el listado existente para que admita búsqueda, filtro, orden y paginación:

```http
GET /api/v1/cases?q=torax&status=IN_PROGRESS&sort=createdAt:desc&page=0&size=10
Authorization: Bearer <token>
```

Todos los parámetros son opcionales. Sin parámetros, devolver la primera página de los casos visibles para el rol autenticado, ordenada por fecha de creación descendente.

| Parámetro | Significado |
| --- | --- |
| `q` | Búsqueda parcial por código (`referenceCode`) o nombre del estudio (`studyName`). Recortar espacios y buscar sin distinguir mayúsculas, minúsculas ni tildes. |
| `status` | Filtro de grupo: `PENDING`, `IN_PROGRESS` o `RESULT_AVAILABLE`. Omitido significa todos. `RESULT_AVAILABLE` es el estado final del flujo actual. |
| `sort` | Orden permitido: `createdAt:desc` o `createdAt:asc`. |
| `page` | Índice de página, empezando en 0. |
| `size` | Cantidad por página; predeterminado: 10, máximo aceptado por backend: 100. La interfaz solicita 10. |

El backend valida `page` y `size`. Cada respuesta contiene los casos de la página solicitada. `totalItems` y `totalPages` describen el conjunto visible para el rol que coincide con la búsqueda y el filtro. Al cambiar búsqueda o filtro, el frontend reinicia `page` a 0. La interfaz oculta los controles de paginación cuando `totalPages` es 0 o 1.

## Respuesta

```json
{
  "items": [
    {
      "id": "caso-uuid-1",
      "referenceCode": "CAS-20260921-0002",
      "studyName": "Radiografía de tórax",
      "status": "ENABLED_FOR_PROCESSING",
      "createdAt": "2026-09-20T20:45:00Z",
      "updatedAt": "2026-09-23T14:10:00Z",
      "availableResultId": null
    },
    {
      "id": "caso-uuid-2",
      "referenceCode": "CAS-20260910-0005",
      "studyName": "TAC de abdomen",
      "status": "RESULT_AVAILABLE",
      "createdAt": "2026-09-10T11:32:00Z",
      "updatedAt": "2026-09-20T20:17:00Z",
      "availableResultId": "resultado-uuid-2"
    }
  ],
  "page": 0,
  "size": 10,
  "totalItems": 24,
  "totalPages": 3,
  "statusCounts": {
    "ALL": 24,
    "PENDING": 5,
    "IN_PROGRESS": 12,
    "RESULT_AVAILABLE": 7
  },
  "appliedFilters": {
    "q": "torax",
    "status": "IN_PROGRESS",
    "sort": "createdAt:desc"
  }
}
```

Ejemplo ilustrativo: reemplazar UUID, fechas y conteos por datos reales. Cuando no haya resultados, `items` será `[]`, `totalItems` y `totalPages` serán 0; `statusCounts` seguirá mostrando los totales de los grupos para la búsqueda actual.

## Comportamiento de búsqueda

- La búsqueda empieza mientras el usuario escribe; no requiere pulsar Enter.
- El frontend espera 300 ms desde la última modificación antes de solicitar resultados. Cada nueva tecla reinicia ese tiempo, evitando una solicitud por carácter.
- El frontend recorta los espacios al inicio y al final. Si el valor queda vacío, omite `q` y solicita los casos sin búsqueda textual.
- El backend busca coincidencias parciales en `referenceCode` o `studyName`, sin distinguir mayúsculas/minúsculas ni tildes. Para lograrlo, comparar los textos normalizados con Unicode NFD, removiendo marcas diacríticas y usando comparación insensible a mayúsculas.
- Al cambiar `q`, el frontend vuelve a `page=0`. Una respuesta de una consulta anterior que llegue tarde no debe reemplazar los resultados de la consulta más reciente.
- `statusCounts` corresponde a los casos que coinciden con `q`, sin aplicar el grupo `status`; `totalItems` aplica ambos.
- Por ejemplo, `q=torax` debe encontrar `Radiografía de tórax`.

## Datos de cada caso

| Campo | Uso en la pantalla |
| --- | --- |
| `id` | UUID interno para consultas y operaciones del API. |
| `referenceCode` | Código legible mostrado en la columna “Identificador del caso” y usado en la dirección de detalle. |
| `studyName` | Nombre del estudio mostrado en su propia columna “Estudio”. |
| `status` | Estado de dominio; el frontend lo traduce a una etiqueta/estilo. |
| `createdAt` | Fecha de creación del caso, mostrada en la columna “Fecha”; enviar ISO 8601 UTC y formatear en el cliente. |
| `updatedAt` | Último cambio relevante del caso, mostrado en “Última actualización”; enviar ISO 8601 UTC y formatear en el cliente. Actualizarlo cuando cambie el estado o se registre una acción/archivo/resultado que afecte al caso. |
| `availableResultId` | Identificador del resultado vigente solo cuando su estado es `AVAILABLE`; si está `UPLOADED`, `CORRECTION_REQUIRED` o `DELETED`, devolver `null`. Permite enlazar a la descarga segura del resultado. |

`status` es la fuente contractual para decidir la etapa y la navegación. `creationStage` no forma parte del esquema OpenAPI de `CaseSummary`; cualquier valor con ese nombre en fixtures o mocks es solo una ayuda local y el backend no debe necesitarlo. `INFORMATION_PENDING` describe el formulario aún no enviado y no es un estado persistido del caso.

### Flujo de estados del caso

El contrato usa un único campo `status` para representar tanto el paso pendiente del registro como el ciclo operativo. El caso se crea cuando el usuario pulsa «Continuar» en Información; los datos obligatorios ya deben estar completos y validados. Si falta alguno, el frontend muestra el error y no llama a `POST /cases`.

| Estado | Etiqueta en el espacio personal | Acción/condición para avanzar |
| --- | --- | --- |
| `CONSENT_PENDING` | Consentimiento pendiente | El caso acaba de crearse. Avanza cuando el propietario acepta el consentimiento. |
| `FILE_PENDING` | Archivo pendiente | El consentimiento fue aceptado. Avanza cuando se completa la carga del primer archivo INPUT. |
| `CONFIRMATION_PENDING` | Confirmación pendiente | Ya hay al menos un archivo INPUT; el propietario puede agregar más y luego confirmar el envío. |
| `FILES_RECEIVED` | Archivos recibidos | El propietario confirmó el envío. El detalle permite iniciar una solicitud de cambio si aún no hay resultado. |
| `INPUT_CHANGE_DRAFT` | Solicitud de cambio en edición | El propietario puede editar la propuesta de archivos antes de enviarla a coordinación. |
| `INPUT_CHANGE_REVIEW` | Solicitud de cambio en revisión | La propuesta está bloqueada mientras coordinación la aprueba o rechaza. |
| `ENABLED_FOR_PROCESSING` | En estudio | Coordinación asignó el caso a un investigador habilitado y autorizado. |
| `RESULT_UPLOADED` | Resultado en revisión | El investigador cargó el resultado; el propietario aún no puede verlo. Coordinación debe publicarlo. |
| `RESULT_AVAILABLE` | Resultado disponible | Coordinación publicó el resultado; el propietario puede consultarlo y descargarlo. |

Cada etapa solo avanza después de que el backend confirme correctamente su operación. Cancelar antes de pulsar «Continuar» en Información no crea un caso. La interfaz presenta el mismo estado con etiquetas distintas según el rol: `FILES_RECEIVED` se muestra al propietario como «Archivos recibidos» y en coordinación como «Pendiente de asignación».

### Recorrido de API para crear y enviar

1. Al pulsar «Continuar» en Información, validar los datos y llamar a `POST /api/v1/cases`. La respuesta crea el caso en `CONSENT_PENDING` y entrega su `id`.
2. Al aceptar el consentimiento, llamar a `POST /api/v1/cases/{caseId}/consent`. Solo tras una respuesta exitosa se avanza a `FILE_PENDING`.
3. La selección de un archivo permanece en el navegador y no llama a la API. Al pulsar «Subir y confirmar archivos», para cada archivo crear una intención con `POST /api/v1/cases/{caseId}/uploads`, transferirlo a la URL temporal y confirmar con `POST /api/v1/files/{fileId}/complete`. El frontend procesa los archivos secuencialmente. Tras completar el primero, el caso queda en `CONFIRMATION_PENDING`; se pueden agregar más archivos independientes.
4. En la etapa Confirmación, al pulsar «Enviar caso», llamar a `POST /api/v1/cases/{caseId}/submission`. Solo tras la respuesta exitosa se muestra `FILES_RECEIVED` / «Archivos recibidos» y el caso queda disponible en la cola de coordinación.

Si cualquiera de estas operaciones falla, no mostrar la siguiente etapa como completada; mantener el caso en su estado anterior y permitir reintentar.

### Corregir archivos antes del envío

Mientras el caso siga en `CONFIRMATION_PENDING`, el propietario puede cargar un reemplazo y eliminar lógicamente el archivo incorrecto mediante `DELETE /api/v1/cases/{caseId}/uploads/{fileId}?reason=...`. La operación de eliminación requiere que el archivo pertenezca al caso y que permanezca al menos un archivo INPUT completo para enviar. Si se elimina el último, el caso vuelve a `FILE_PENDING`. Cada archivo INPUT es independiente; reemplazar uno no crea una versión de resultado.

Al confirmar `POST /api/v1/cases/{caseId}/submission`, los archivos vigentes quedan congelados para edición directa. Si aún no existe un resultado y el caso está en `FILES_RECEIVED` o `ENABLED_FOR_PROCESSING`, el propietario puede solicitar un cambio mediante `POST /api/v1/cases/{caseId}/input-change-requests`. El caso pasa a `INPUT_CHANGE_DRAFT` y el backend guarda `resumeCaseStatus`.

En el borrador, el propietario puede conservar archivos originales, agregar archivos y retirar del conjunto propuesto los que desea reemplazar o eliminar. Debe indicar un motivo breve de hasta 250 caracteres y dejar al menos un INPUT completo antes de enviar. Al enviar la solicitud, el caso pasa a `INPUT_CHANGE_REVIEW` y la propuesta queda bloqueada. Coordinación revisa los archivos originales y propuestos, y aprueba o rechaza; el rechazo exige un motivo. Al aprobar, el conjunto propuesto pasa a ser el único conjunto vigente: los originales que se retiraron de la propuesta se eliminan del almacenamiento y dejan de estar disponibles, mientras se conserva la auditoría de la solicitud. Al rechazar, los archivos originales permanecen vigentes y los nuevos archivos de la propuesta se programan para limpieza. Al cancelar un borrador, se descarta la propuesta y se restaura `resumeCaseStatus`. En todos los desenlaces, el caso vuelve al estado guardado al iniciar la solicitud.

## Estados y grupos de filtro

El backend hoy define estos estados de caso:

```text
CONSENT_PENDING
FILE_PENDING
CONFIRMATION_PENDING
FILES_RECEIVED
INPUT_CHANGE_DRAFT
INPUT_CHANGE_REVIEW
ENABLED_FOR_PROCESSING
RESULT_UPLOADED
RESULT_AVAILABLE
```

La interfaz usa etiquetas agrupadas que no coinciden uno a uno con el enum operativo:

| Filtro de la interfaz/API | Estados incluidos | Etiqueta que puede mostrar la fila |
| --- | --- | --- |
| `PENDING` | `CONSENT_PENDING`, `FILE_PENDING`, `CONFIRMATION_PENDING`, `FILES_RECEIVED`, `INPUT_CHANGE_DRAFT`, `INPUT_CHANGE_REVIEW` | Consentimiento pendiente, Archivo pendiente, Confirmación pendiente, Archivos recibidos, Solicitud de cambio en edición o Solicitud de cambio en revisión |
| `IN_PROGRESS` | `ENABLED_FOR_PROCESSING`, `RESULT_UPLOADED` | En estudio o Resultado en revisión |
| `RESULT_AVAILABLE` | `RESULT_AVAILABLE` con resultado vigente en `AVAILABLE` | Resultado disponible |

`FILES_RECEIVED` indica que los archivos llegaron y el dueño confirmó el envío; el caso queda disponible para asignación. `RESULT_UPLOADED` espera revisión y publicación de coordinación. `RESULT_AVAILABLE` es el estado final porque el resultado ya está disponible para el propietario.

Si el resultado pasa a `CORRECTION_REQUIRED` o `DELETED`, el caso puede seguir siendo visible para su propietario, pero no debe aparecer como «Resultado disponible» ni ofrecer descarga. El frontend no muestra al propietario el registro del resultado eliminado ni su motivo; coordinación e investigación sí lo ven en sus vistas de resultados. El estado de caso que corresponde a estas transiciones debe sincronizarse al adaptar el backend.

Acciones sugeridas según estado:

| Estado | Tipo de acción | Etiqueta de ejemplo |
| --- | --- | --- |
| `CONSENT_PENDING`, `FILE_PENDING`, `CONFIRMATION_PENDING` | `CONTINUE_CASE` | Continuar |
| `INPUT_CHANGE_DRAFT` | `EDIT_INPUT_CHANGE` | Continuar cambio |
| `INPUT_CHANGE_REVIEW` | `WAIT_COORDINATOR_REVIEW` | Ver caso |
| Estados intermedios | `VIEW_CASE` | Ver caso |
| `RESULT_AVAILABLE` | `VIEW_RESULT` | Ver resultado |

Los casos incompletos (`CONSENT_PENDING`, `FILE_PENDING`, `CONFIRMATION_PENDING`) deben abrir el flujo para retomar la creación mediante `/mis_casos/{caseId}/edit`, usando el UUID técnico. Los casos enviados o posteriores abren el detalle mediante `/mis_casos/{referenceCode}`. En `CONFIRMATION_PENDING`, `GET /cases/{caseId}/uploads` es la operación contractual para recuperar los INPUT vigentes; la implementación actual conserva y restaura sus metadatos desde `sessionStorage`, por lo que integrar la consulta al reanudar sigue pendiente. Un borrador de cambio y una solicitud en revisión abren el detalle del caso; el primero permite continuar la propuesta y el segundo es de solo lectura para el propietario. No incluir URL permanente de archivo en esta lista.

## Contadores de filtros

`statusCounts` evita que el frontend cargue todas las páginas solo para mostrar los números de las pestañas. Corresponde a los casos que coinciden con `q`, ignorando el grupo seleccionado. `totalItems` cuenta los elementos que coinciden con `q` y el grupo `status` seleccionado.

## Errores esperados

- `401 Unauthorized`: sesión no válida o ausente.
- `403 Forbidden`: cuenta deshabilitada, rol no autorizado o intento de consultar un recurso fuera del conjunto permitido.
- `400 Bad Request`: parámetros inválidos, como página negativa, orden no permitido o tamaño fuera de rango.

No devolver casos fuera del conjunto autorizado del usuario. Este endpoint personal incluye solo casos propios; los casos asignados se consultan desde endpoints operativos.

## Estado actual del proyecto

- `GET /api/v1/cases` devuelve una respuesta paginada y aplica búsqueda, filtros y orden sobre los casos visibles para todos los roles habilitados.
- Todos los roles consultan únicamente sus casos propios en esta pantalla. Los casos asignados a investigación o visibles para coordinación se consultan en sus espacios operativos. Las cuentas deshabilitadas reciben `403`. La implementación aún conserva autorizaciones restringidas a `PATIENT` en algunas operaciones personales; el contrato objetivo es común a los cuatro roles.
- La vista `/mis_casos` consume el endpoint mediante `apiClient.patient.getCases`; los parámetros y contadores los calcula el backend.
- La vista usa hasta 10 filas por página y presenta los números desde 1; el contrato HTTP usa páginas desde 0. El frontend convierte el índice visual (1-based) al índice del API (0-based) y oculta el paginador si hay como máximo una página.
- El componente de demostración llamaba `study` al campo, aunque el contrato compartido y backend usan `studyName`; el modelo de respuesta conserva `studyName`.
- `POST /api/v1/cases` crea el caso en `CONSENT_PENDING` al continuar desde Información. La aceptación del consentimiento cambia a `FILE_PENDING`; completar el primer INPUT cambia a `CONFIRMATION_PENDING`; `POST /api/v1/cases/{caseId}/submission` confirma el envío y cambia a `FILES_RECEIVED`.
- `RESULT_AVAILABLE` es el estado final del flujo actual. No existe un bucket adicional `COMPLETED`.
- La eliminación de un INPUT previo al envío es lógica y auditable; el endpoint queda descrito en OpenAPI. Después del envío, las modificaciones se hacen mediante solicitud de cambio y confirmación de coordinación.
