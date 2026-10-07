# Contrato de respuesta: Mis casos del paciente

Documento de trabajo para modelar los datos que consume la vista `/mis_casos` desde el rol **paciente**. Esta propuesta describe el contrato deseado; no sustituye el OpenAPI canónico hasta que se acuerde y se incorpore allí.

## Qué necesita la interfaz

La vista actual contiene:

- búsqueda por código del caso o nombre del estudio;
- filtros: Todos, Pendientes, En procesamiento, Resultado disponible y Finalizados, cada uno con su contador;
- orden por fecha de creación, más recientes o más antiguos;
- tabla con columnas separadas para identificador del caso y estudio, además de fecha, estado, última actualización y acción;
- columna “Última actualización” para mostrar cuándo cambió por última vez el caso;
- paginación y texto “Mostrando X de Y casos”;
- botón para crear un caso nuevo.

Los datos de la lista deben pertenecer exclusivamente al paciente autenticado. El identificador del paciente se obtiene del token, no de un parámetro enviado por el frontend.

## Endpoint propuesto

Ampliar el listado existente para que admita búsqueda, filtro, orden y paginación:

```http
GET /api/v1/cases?q=torax&status=IN_PROGRESS&sort=createdAt,desc&page=0&size=10
Authorization: Bearer <token>
```

Todos los parámetros son opcionales. Sin parámetros, devolver la primera página de los casos del paciente, ordenada por fecha de creación descendente.

| Parámetro | Significado |
| --- | --- |
| `q` | Búsqueda parcial por código (`referenceCode`) o nombre del estudio (`studyName`). Recortar espacios y buscar sin distinguir mayúsculas, minúsculas ni tildes. |
| `status` | Filtro de grupo: `PENDING`, `IN_PROGRESS`, `RESULT_AVAILABLE` o `COMPLETED`. Omitido significa todos. |
| `sort` | Orden permitido: `createdAt,desc` o `createdAt,asc`. |
| `page` | Índice de página, empezando en 0. |
| `size` | Cantidad por página; predeterminado y máximo: 10. |

El backend valida `page` y `size`; `size` no puede superar 10. Cada respuesta contiene todos los campos contratados de los casos de la página solicitada, hasta 10 elementos. `totalItems` y `totalPages` describen el conjunto completo que coincide con la búsqueda y los filtros. Al cambiar búsqueda o filtro, el frontend reinicia `page` a 0. La interfaz oculta los controles de paginación cuando `totalPages` es 0 o 1.

## Respuesta propuesta

```json
{
  "items": [
    {
      "id": "caso-uuid-1",
      "referenceCode": "CAS-20260921-0002",
      "studyName": "Radiografía de tórax",
      "status": "ENABLED_FOR_PROCESSING",
      "creationStage": null,
      "createdAt": "2026-09-20T20:45:00Z",
      "updatedAt": "2026-09-23T14:10:00Z",
      "availableResultId": null
    },
    {
      "id": "caso-uuid-2",
      "referenceCode": "CAS-20260910-0005",
      "studyName": "TAC de abdomen",
      "status": "RESULT_AVAILABLE",
      "creationStage": null,
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
    "RESULT_AVAILABLE": 4,
    "COMPLETED": 3
  },
  "appliedFilters": {
    "q": "torax",
    "status": "IN_PROGRESS",
    "sort": "createdAt,desc"
  }
}
```

Ejemplo ilustrativo: reemplazar UUID, fechas y conteos por datos reales. Cuando no haya resultados, `items` será `[]`, `totalItems` y `totalPages` serán 0; `statusCounts` seguirá mostrando los totales de los grupos para la búsqueda actual.

## Comportamiento de búsqueda

- La búsqueda empieza mientras el paciente escribe; no requiere pulsar Enter.
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
| `creationStage` | Primera etapa pendiente del flujo de creación; `null` cuando el paciente ya confirmó y envió el caso. Es independiente de `status`. |
| `createdAt` | Fecha de creación del caso, mostrada en la columna “Fecha”; enviar ISO 8601 UTC y formatear en el cliente. |
| `updatedAt` | Último cambio relevante del caso, mostrado en “Última actualización”; enviar ISO 8601 UTC y formatear en el cliente. Actualizarlo cuando cambie el estado o se registre una acción/archivo/resultado que afecte al caso. |
| `availableResultId` | Identificador del resultado vigente solo cuando su estado es `AVAILABLE`; si está `UPLOADED`, `CORRECTION_REQUIRED` o `DELETED`, devolver `null`. Permite enlazar a la descarga segura del resultado. |

### Etapa de creación (`creationStage`)

La etapa de creación indica dónde debe retomar el paciente un caso que todavía no ha confirmado. Los valores propuestos para el contrato son:

| Valor | Etiqueta visible | Criterio para avanzar |
| --- | --- | --- |
| `INFORMATION_PENDING` | Información pendiente | La información obligatoria está diligenciada y es válida. |
| `CONSENT_PENDING` | Consentimiento pendiente | El consentimiento requerido quedó registrado. |
| `FILE_PENDING` | Archivo pendiente | El archivo requerido se cargó correctamente. |
| `CONFIRMATION_PENDING` | Confirmación pendiente | El paciente revisó y confirmó el envío. |
| `null` | Sin etapa pendiente | El caso fue confirmado y enviado; continúa su ciclo operativo indicado por `status`. |

Mientras `creationStage` tenga un valor, `status` sigue representando el ciclo operativo y no debe utilizarse para deducir cuál etapa del formulario falta. Una corrección puede devolver `creationStage` a una etapa anterior si invalida información posterior.

La interfaz deriva la etiqueta de avance desde `creationStage` y la etiqueta operativa desde `status`; la respuesta no incluye `primaryAction`. Actualmente las acciones de la lista son demostrativas y no ejecutan operaciones.

## Estados y grupos de filtro

El backend hoy define estos estados de caso:

```text
CREATED
FILES_RECEIVED
ENABLED_FOR_PROCESSING
RESULT_UPLOADED
RESULT_AVAILABLE
```

La interfaz usa etiquetas agrupadas que no coinciden uno a uno con el enum operativo:

| Filtro de la interfaz/API | Estados incluidos | Etiqueta que puede mostrar la fila |
| --- | --- | --- |
| `PENDING` | `creationStage != null` | Información pendiente, Consentimiento pendiente, Archivo pendiente o Confirmación pendiente |
| `IN_PROGRESS` | `FILES_RECEIVED`, `ENABLED_FOR_PROCESSING`, `RESULT_UPLOADED` | Archivos recibidos, En procesamiento o Resultado cargado, respectivamente |
| `RESULT_AVAILABLE` | `RESULT_AVAILABLE` con resultado vigente en `AVAILABLE` | Resultado disponible |
| `COMPLETED` | Pendiente de definición de negocio | Finalizado |

La fila muestra `creationStage` para casos sin enviar. Para casos enviados, `FILES_RECEIVED` indica que los archivos llegaron y `RESULT_UPLOADED` puede seguir esperando revisión/publicación. El dominio actual no tiene un estado `COMPLETED`; no se debe inferir que `RESULT_AVAILABLE` significa “Finalizado” sin decisión de producto.

Si el resultado pasa a `CORRECTION_REQUIRED` o `DELETED`, el caso puede seguir siendo visible para su paciente, pero no debe aparecer como «Resultado disponible» ni ofrecer descarga. El frontend no muestra al paciente el registro del resultado eliminado ni su motivo; coordinación e investigación sí lo ven en sus vistas de resultados. El estado de caso que corresponde a estas transiciones debe sincronizarse al adaptar el backend.

Acciones sugeridas según estado:

| Estado | Tipo de acción | Etiqueta de ejemplo |
| --- | --- | --- |
| `creationStage != null` | `CONTINUE_CASE` | Continuar |
| Estados intermedios | `VIEW_CASE` | Ver caso |
| `RESULT_AVAILABLE` | `VIEW_RESULT` | Ver resultado |

La acción de detalle debe abrir `/mis_casos/{referenceCode}`. `id` (UUID) queda para consultar o descargar mediante los endpoints protegidos; una dirección directa debe resolverlo según [la decisión de identificadores](../casos/identificadores-y-rutas.md). No incluir URL permanente de archivo en esta lista.

## Contadores de filtros

`statusCounts` evita que el frontend cargue todas las páginas solo para mostrar los números de las pestañas. Corresponde a los casos que coinciden con `q`, ignorando el grupo seleccionado. `totalItems` cuenta los elementos que coinciden con `q` y el grupo `status` seleccionado.

## Errores esperados

- `401 Unauthorized`: sesión no válida o ausente.
- `403 Forbidden`: usuario autenticado que no tiene rol paciente.
- `400 Bad Request`: parámetros inválidos, como página negativa, orden no permitido o tamaño fuera de rango.

No devolver casos de otro paciente aunque se manipulen parámetros o identificadores.

## Estado actual del proyecto

- Existe `GET /api/v1/cases`, pero actualmente devuelve una lista completa de `CaseSummary` sin búsqueda, filtros, orden ni paginación.
- El OpenAPI y backend actuales devuelven `CaseSummary[]`; `CaseSummary` incluye `id`, `referenceCode`, `status`, `studyName` y `createdAt`. Aún faltan `updatedAt`, `creationStage` y la respuesta paginada propuesta aquí.
- La vista actual usa datos de ejemplo y calcula búsqueda, filtros, contadores, orden y paginación en el cliente.
- La vista usa hasta 10 filas por página y presenta los números desde 1; el contrato HTTP usa páginas desde 0. El frontend convierte el índice visual (1-based) al índice del API (0-based) y oculta el paginador si hay como máximo una página.
- El componente de demostración llamaba `study` al campo, aunque el contrato compartido y backend usan `studyName`; el modelo de respuesta conserva `studyName`.
- El backend crea actualmente el caso en `CREATED` mediante `POST /api/v1/cases`, y cambia a `FILES_RECEIVED` cuando confirma el primer archivo. No persiste las cuatro etapas del borrador. `creationStage` y su persistencia requieren implementación backend para cumplir este contrato.
- El dominio actual no tiene un estado `COMPLETED`; el filtro “Finalizados” sigue pendiente de definición de negocio.
