# Contrato de datos: Resultados de docencia

Documento de trabajo para la vista `/resultados`, usada por el rol de docencia. Describe los datos que necesita la tabla y propone un contrato para consultarlos y gestionarlos. Las propuestas no sustituyen el OpenAPI canónico hasta que se acuerden e incorporen allí.

## Qué muestra la interfaz

- Buscador por nombre del resultado, identificador del caso y investigador responsable.
- Filtros: todos, cargados, con corrección requerida, disponibles para el paciente y eliminados. Cada filtro muestra su contador.
- Tabla con resultado, caso y `studyName`, investigador responsable, fecha de carga, versión, estado y última actualización.
- Orden por nombre, identificador del caso, investigador, fecha de carga, versión, estado y última actualización.
- Paginación local de ocho filas por página.
- Acción «Ver caso», que abre `/casos_academicos/:referenceCode`.

Cada fila representa un resultado asociado a un caso. La interfaz actual contiene datos locales de demostración; todavía no obtiene estas filas de un endpoint de listado.

## Contrato propuesto para listar resultados

```http
GET /api/v1/operations/results?q=CAS-2026&status=UPLOADED&sort=uploadedAt,desc&page=0&size=8
Authorization: Bearer <token>
```

El backend determina al coordinador desde el token y limita los resultados a su ámbito autorizado. No se debe aceptar un `coordinatorId` libre enviado por el cliente para ampliar el alcance.

| Parámetro | Significado |
| --- | --- |
| `q` | Búsqueda por nombre del archivo/resultado, código del caso o nombre/código del investigador. |
| `status` | Filtro opcional por estado canónico: `UPLOADED`, `AVAILABLE`, `CORRECTION_REQUIRED` o `DELETED`. Sin valor lista todos, incluidos los eliminados. |
| `sort` | Orden por `name`, `referenceCode`, `researcherName`, `uploadedAt`, `version`, `status` o `updatedAt`, con `asc`/`desc`. |
| `page` | Índice de página empezando en 0. |
| `size` | Resultados por página; valor inicial 8 y máximo sugerido 100. |

### Respuesta propuesta

```json
{
  "items": [
    {
      "id": "result-uuid",
      "name": "Informe radiológico tórax",
      "file": {
        "id": "file-uuid",
        "originalFilename": "informe.pdf",
        "contentType": "application/pdf",
        "sizeBytes": 1258291,
        "extension": "pdf"
      },
      "case": {
        "id": "case-uuid",
        "referenceCode": "CAS-20260921-0042",
        "studyName": "Radiografía de tórax"
      },
      "uploadedBy": {
        "userId": "researcher-uuid",
        "researcherCode": "EST-1187",
        "fullName": "Ana Ruiz"
      },
      "uploadedAt": "2026-09-21T14:32:00Z",
      "updatedAt": "2026-09-21T14:32:00Z",
      "version": 1,
      "status": "UPLOADED",
      "correctionRequest": null,
      "availableAt": null,
      "deletedAt": null,
      "deletedBy": null,
      "deletionReason": null
    }
  ],
  "summary": {
    "total": 24,
    "uploaded": 10,
    "correctionRequired": 4,
    "available": 8,
    "deleted": 2
  },
  "page": 0,
  "size": 8,
  "totalItems": 24,
  "totalPages": 3,
  "appliedFilters": {
    "q": "CAS-2026",
    "status": "UPLOADED",
    "sort": "uploadedAt,desc"
  }
}
```

`id` es el UUID técnico de resultado para las operaciones. `case.referenceCode` se usa para navegar y se muestra en la tabla; `case.id` es el UUID para consultar y operar sobre el caso. `name` es el título de presentación del resultado y puede derivarse inicialmente del nombre de archivo si producto no necesita un título distinto. `studyName` mantiene el nombre de estudio libre definido en el contrato común de casos.

Cuando `status=DELETED`, `deletedAt`, `deletedBy` y `deletionReason` son obligatorios; en los demás estados son `null`. La fila sigue presente para usuarios internos autorizados. La pantalla de demostración todavía no tiene el filtro «Eliminados» ni presenta estos datos; ambos forman parte del contrato de interfaz acordado.

Las fechas se envían como instantes ISO 8601 en UTC. El frontend las presenta en hora local con el formato acordado para la interfaz, por ejemplo `20/9/2026, 16:20`; no se debe enviar una fecha ya formateada como texto desde el backend.

`sizeBytes` es el valor numérico canónico; la interfaz puede convertirlo a `1.2 MB`. `extension` puede inferirse de `originalFilename`, por lo que se puede omitir si no se requiere explícitamente. No se deben enviar enlaces permanentes de descarga en el listado: la descarga debe autorizarse y generar una URL temporal mediante una operación específica.

En esta etapa el archivo de resultado solo se **descarga**. No se ofrece vista previa ni visualización integrada, y solo hay un archivo vigente por caso.

## Estados y acciones

| Estado de API | Etiqueta de interfaz | Significado |
| --- | --- | --- |
| `UPLOADED` | Cargado | El investigador cargó el resultado; aún no está disponible para el paciente. |
| `CORRECTION_REQUIRED` | Corrección requerida | Un coordinador detectó que un resultado ya publicado necesita reemplazo. El archivo publicado deja de estar disponible para descarga del paciente. No significa que la corrección ya esté hecha. |
| `AVAILABLE` | Disponible para el paciente | El coordinador publicó el resultado para consulta del paciente. |
| `DELETED` | Eliminado | El resultado se retiró. Sigue visible en el listado y detalle internos para coordinación e investigación, con motivo, actor y fecha; no aparece para el paciente ni se puede descargar. |

### Flujo acordado para el producto

`UPLOADED → AVAILABLE → CORRECTION_REQUIRED → UPLOADED → AVAILABLE`. El ciclo de corrección puede repetirse. Desde `UPLOADED`, `AVAILABLE` o `CORRECTION_REQUIRED` se puede pasar a `DELETED`; `DELETED` es terminal y no se reutiliza para una nueva carga. `CORRECTION_REQUIRED` es un estado del **resultado**, no una etiqueta para un archivo ya corregido. La nueva carga queda en `UPLOADED` para revisión; solo el coordinador la vuelve a publicar. Un archivo corregido y publicado queda en `AVAILABLE`, con un dato de auditoría que indique que reemplaza una publicación anterior. No hace falta un estado «Corregido».

Solo `AVAILABLE` permite descargar al paciente. Al solicitar una corrección o marcar `DELETED`, el resultado sale de sus listados y no se emiten nuevas URL de descarga. Las URL temporales ya emitidas pueden seguir vigentes hasta que expiren; se debe definir una vigencia corta o revocación si se necesita retirada inmediata.

**Eliminación:** `DELETED` es una eliminación lógica del resultado, no un borrado físico del registro. Coordinación puede marcarlo como eliminado indicando un motivo; el investigador puede ver el resultado y su estado, pero esta vista no le da la acción de eliminar. Se conservan identificador, metadatos, motivo, actor y fecha de eliminación para trazabilidad. El archivo eliminado no se puede descargar desde ninguna de las tres vistas. Si se necesita un nuevo resultado para ese caso, se crea otro registro; no se reactiva el eliminado. La interfaz interna incluye filtro y contador de «Eliminados».

Este es el contrato de las interfaces. El backend hoy solo implementa `UPLOADED` y `AVAILABLE`; su adaptación a `CORRECTION_REQUIRED` y `DELETED`, incluida la sincronización con el caso y la descarga, se hará por separado.

Acciones sugeridas:

- «Ver caso»: navegar a `/casos_academicos/{case.referenceCode}`; usar `case.id` para las llamadas al API. Una dirección directa se resuelve según [la decisión de identificadores](../casos/identificadores-y-rutas.md).
- Publicar para el paciente: reutilizar `POST /api/v1/operations/results/{resultId}/availability`.
- Solicitar corrección de un resultado `AVAILABLE`: definir una operación nueva, por ejemplo `POST /api/v1/operations/results/{resultId}/correction-requests`, con un cuerpo `{ "reason": "..." }`. Debe pasar a `CORRECTION_REQUIRED` y retirar la descarga pública. La ruta y sus reglas de autorización quedan pendientes de implementar.
- Marcar como eliminado: acción de coordinación con motivo obligatorio, transición a `DELETED` y actualización inmediata de los listados internos y del paciente. La operación HTTP queda por definir al actualizar el backend; el `DELETE` actual borra físicamente una carga no publicada y no implementa esta semántica.

La pantalla actual solo presenta la acción de navegación al caso en la tabla; no asumir que ya existe una acción directa para publicar, corregir o descargar desde esta vista.

## Estado actual del backend

- `GET /api/v1/internal/cases` lista casos asignados al usuario interno autenticado, e incluye un resumen de resultado cuando existe. No es un listado paginado/global de resultados para coordinación.
- El resumen de resultado existente contiene información acotada como `id`, `originalFilename`, `status`, `uploadedBy`, `uploadedAt` y opcionalmente `availableAt`; no contiene el nombre/código del investigador, la versión ni el motivo de corrección que la tabla necesita.
- `POST /api/v1/operations/results/{resultId}/availability` publica el resultado para el paciente. La operación requiere coordinador habilitado y asignación explícita al caso.
- El resultado se carga con `POST /api/v1/internal/cases/{caseId}/result-uploads` y se completa mediante el flujo de archivos. El resultado queda asociado al caso.
- El modelo actual permite un resultado y un archivo de resultado por caso (`case_result` tiene relación única con `case_id`). No mantiene historial de versiones. Antes de publicar, el resultado puede eliminarse y cargarse de nuevo; eso no equivale a versionado auditable.
- El backend no implementa aún `CORRECTION_REQUIRED` ni `DELETED`, ni un listado de resultados que consolide los datos de casos y investigadores para esta pantalla.
- El modelo de demostración usa `study` y `caseId` como código visible; al conectarlo al contrato común, mapear a `case.studyName`, `case.id` (UUID) y `case.referenceCode` de forma separada.
- La ruta `/resultados` está protegida por el guard de rol coordinador en `AppRoutes`; el backend debe validar también el rol y los permisos del listado.

## Decisiones pendientes

1. Definir si `name` es un título editable del resultado o si la interfaz mostrará directamente `file.originalFilename`.
2. Acordar si el listado incluye resultados de todos los casos del coordinador o solo los que están asignados al coordinador autenticado; aplicar el mismo alcance en los contadores.
3. Adaptar el backend al flujo de corrección y eliminación documentado, con motivo, actor, fecha, retirada de descarga y nueva revisión antes de publicar.
4. Definir la persistencia del historial y la numeración de versiones. El paciente solo necesita descargar la versión vigente; la tabla de docencia muestra «Versión», pero el modelo actual no conserva las anteriores.
5. Mantener por ahora un archivo de resultado vigente por caso. Una entrega con varios archivos queda fuera de este alcance.
6. Definir de dónde salen `fullName` y `researcherCode`; el listado de usuarios internos existente no los entrega.
7. Corregir la navegación para utilizar `case.referenceCode` en la dirección y `case.id` (UUID) en las operaciones de API.
