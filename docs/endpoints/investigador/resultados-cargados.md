# Contrato de datos: Resultados cargados

Documento de la vista `/resultados_cargados`, dentro del espacio de trabajo del investigador. La pantalla usa `GET /api/v1/internal/results` en modo API y conserva datos locales en modo mock. La integración de esta lista es independiente del detalle de caso en `/casos_asignados/{referenceCode}`.

## Qué muestra la interfaz

- Buscador por nombre de archivo, código de caso o estudio.
- Filtros: todos, cargado, corrección requerida y disponible para el propietario del caso; cada filtro muestra su contador.
- Tabla con resultado y metadatos de archivo, caso y `studyName`, fecha de carga, estado, última actualización y acción «Ver caso».
- Orden por resultado, caso, fecha de carga, estado y última actualización. También hay un selector para más reciente, más antiguo o resultado A–Z.
- Paginación de ocho filas por página.
- «Ver caso» abre el detalle académico del caso.

El endpoint limita la consulta a resultados de casos asignados al investigador autenticado. La vista de coordinación usa su propio endpoint y alcance.

## Fuente de datos existente

El backend ya entrega resultados dentro de cada caso asignado y también ofrece un listado plano:

```http
GET /api/v1/internal/cases
Authorization: Bearer <token>
```

La respuesta de casos incluye un resumen `result`. Para la vista independiente existe además `GET /api/v1/internal/results`, con resultados, metadatos de caso, versión y estado. Consulta el esquema `ResearcherResultsPage` del OpenAPI para los campos vigentes.

## Endpoint existente para esta vista

```http
GET /api/v1/internal/results
Authorization: Bearer <token>
```

El servidor obtiene el usuario desde el token y limita la consulta a resultados de sus casos asignados. El endpoint admite `q`, `status`, `sort`, `page` y `size`, y pagina hasta 100 filas por respuesta. La pantalla solicita todas las páginas para aplicar búsqueda, estado, orden y paginación de ocho filas en el navegador; el resumen de estados proviene de la respuesta del servidor.

El esquema canónico de respuesta es el del OpenAPI. La lista pide páginas con `page` y `size=100`; no envía búsqueda, estado ni orden al servidor porque esos controles operan sobre el conjunto completo ya cargado.

Parámetros disponibles en el endpoint:

| Parámetro | Significado |
| --- | --- |
| `q` | Búsqueda por nombre de archivo, código de caso o nombre de estudio. |
| `status` | Filtro opcional por estado vigente: `UPLOADED`, `AVAILABLE` o `CORRECTION_REQUIRED`. Sin valor lista la versión vigente de cada caso; el historial queda fuera de esta tabla. |
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
      "version": 1,
      "publicationType": null,
      "correctionRequest": null,
      "availableAt": null
    }
  ],
  "summary": {
    "total": 11,
    "uploaded": 5,
    "available": 4,
    "correctionRequired": 2
  },
  "page": 0,
  "size": 8,
  "totalItems": 11,
  "totalPages": 2,
  "appliedFilters": {
    "q": "informe",
    "status": "UPLOADED",
    "sort": "uploadedAt,desc"
  }
}
```

`id` es el UUID técnico del resultado. `case.referenceCode` se usa en la dirección de detalle; `case.id` es el UUID para las llamadas al API. `case.studyName` es el nombre del estudio. El nombre visible del resultado se toma de `originalFilename`; no se guarda un campo `name` separado ni se inventa un código público `RES-...`.

Cada fila/version representa exactamente un archivo de resultado; no se agrupan varios archivos en una entrega. `version` es secuencial por caso. `correctionRequest` contiene el motivo cuando `status=CORRECTION_REQUIRED`; en los demás estados es `null`. Los resultados eliminados registran `deletedAt`, `deletedBy` y `deletionReason` junto con el archivo como historial, pero no aparecen en esta lista habitual.

Las fechas deben transmitirse como ISO 8601 UTC; el frontend las presenta en formato local, por ejemplo `20/9/2026, 16:20`. El tamaño debe venir como `sizeBytes` numérico y la UI lo convierte a KB/MB. No incluir una URL permanente de descarga en el listado.

## Estados

| Estado de API | Etiqueta en pantalla |
| --- | --- |
| `UPLOADED` | Cargado |
| `AVAILABLE` | Disponible para el propietario del caso |
| `CORRECTION_REQUIRED` | Corrección requerida |

La primera carga es la versión `1`; al publicarla, coordinación la registra como `INITIAL`. Si el investigador asignado necesita reemplazar una versión `UPLOADED` pendiente, primero la elimina con motivo; el caso vuelve a `ENABLED_FOR_PROCESSING` y luego puede cargar una nueva versión. Son dos operaciones, no un reemplazo directo durante la carga. La versión retirada queda como `DELETED` en el historial y la numeración no se reutiliza. Una carga pendiente también se puede eliminar sin reemplazo, dejando el caso listo para procesamiento. Si coordinación pide corregir un resultado ya publicado, este pasa a `CORRECTION_REQUIRED`; el investigador carga una nueva versión y coordinación debe publicarla como `CORRECTED`. Véase [el flujo completo](../coordinador/resultados.md#estados-y-acciones).

## Acciones y descarga

La acción «Ver caso» en el espacio del investigador debe navegar a `/casos_asignados/{case.referenceCode}`. El UUID `case.id` se usa para las llamadas al API; el código legible se usa en la ruta SPA. La ruta de coordinación es `/casos_academicos/{referenceCode}`.

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

La URL de descarga es temporal. El endpoint valida el acceso interno al caso y al resultado. Por ahora los resultados solo se descargan; no se ofrece vista previa o visualización integrada. Los registros eliminados quedan fuera de esta lista habitual y no son descargables. La lista mantiene «Ver caso» como única acción; desde el detalle académico se descarga el archivo. Así, la acción de descarga conserva el contexto del caso y no duplica controles en dos pantallas.

## Estado actual y brechas

- `GET /api/v1/internal/results` existe y entrega los resultados consultables por el investigador autenticado. `GET /api/v1/internal/cases` también incluye un resumen `result` anidado.
- En modo API, el frontend solicita todas las páginas del listado y aplica búsqueda, filtros, orden y páginas de ocho filas en el navegador; en modo mock usa datos de demostración.
- La lista ofrece «Ver caso»; la descarga se realiza desde el detalle académico.
- El resumen `ResultView` de casos no expone `updatedAt`; no confundirlo con el DTO del listado plano de resultados.
- La carga nueva no reemplaza directamente una versión `UPLOADED` pendiente: primero debe eliminarse mediante `DELETE /api/v1/internal/cases/{caseId}/results/{resultId}`, y luego se crea otra carga cuando el caso vuelve a `ENABLED_FOR_PROCESSING`.
- La eliminación del backend es lógica: valida que el resultado esté `UPLOADED` y que el caso esté `RESULT_UPLOADED`, conserva auditoría e historial y devuelve el caso a `ENABLED_FOR_PROCESSING`. Los resultados `AVAILABLE` requieren solicitud de corrección por coordinación.
- El objeto local usa `study` y presenta `caseId` como código legible; al integrar el contrato común usar `case.studyName`, `case.id` (UUID para API) y `case.referenceCode` (dirección visible) por separado.
- La ruta `/resultados_cargados` está protegida por el guard de rol investigador en `AppRoutes`; el backend debe validar también el rol, la cuenta y el alcance de las asignaciones.
- Para investigadores, el backend devuelve `uploadedBy` como UUID. Esta pantalla no necesita exponer nombres/códigos de otros investigadores; la restricción de alcance debe garantizar que no se filtren resultados de terceros.

## Decisiones vigentes

1. `/resultados_cargados` lista resultados dentro del alcance del investigador autenticado; la vista de coordinación tiene un endpoint separado.
2. El endpoint pagina en bloques de hasta 100; la pantalla carga todas las páginas y pagina localmente en bloques de ocho.
3. La lista mantiene únicamente «Ver caso»; la descarga se inicia desde el detalle académico.
4. El historial auditable de versiones eliminadas se conserva fuera de esta lista habitual.
5. El frontend conserva UUID de caso separado de `referenceCode`, que se usa para la ruta SPA.

## Notas de implementación del flujo de carga

- La intención de carga incluye `expiresAt`, pero el backend actualmente no persiste ni valida ese vencimiento al confirmar el archivo. La expiración está descrita en el contrato; falta hacerla cumplir en la implementación.
- Al reemplazar una primera carga pendiente eliminada, el contador de versión avanza. El backend puede asignar `CORRECTED` solo porque la versión sea mayor que 1, aunque nunca se haya publicado una versión anterior. El tipo debe depender de si hubo una publicación previa o una solicitud de corrección; hay que alinear esa regla en implementación.
- El formulario usa el MIME reportado por el navegador y, si viene vacío, aplica un fallback que reconoce PDF y MP4. Para otros formatos permitidos, como DICOM o ZIP, puede enviar un MIME incorrecto y el backend rechazarlo.
- El mock de carga no reproduce todas las restricciones del backend: no valida consistentemente rol, asignación y estado, y su eliminación física no conserva el historial/auditoría que sí conserva el backend. No usarlo como referencia del contrato.
