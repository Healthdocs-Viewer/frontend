# Contrato de datos: Resultados de docencia

Contrato de datos y estado de implementación de la vista `/resultados`, usada por el rol coordinador. El OpenAPI es la referencia canónica para las operaciones y modelos.

## Qué muestra la interfaz

- Buscador por nombre del resultado, identificador del caso y investigador responsable.
- Filtros: todos, cargados, con corrección requerida, disponibles para el paciente y eliminados. Cada filtro muestra su contador.
- Tabla con resultado, caso y `studyName`, investigador responsable, fecha de carga, versión, estado y última actualización.
- Orden por nombre, identificador del caso, investigador, fecha de carga, versión, estado y última actualización.
- Paginación local de ocho filas por página.
- Acción «Ver caso», que abre `/casos_academicos/:referenceCode`.

Cada fila representa un resultado asociado a un caso. La interfaz todavía contiene datos locales de demostración. El backend ya ofrece `GET /api/v1/operations/results`; la conexión de la tabla sigue pendiente.

## Endpoint existente para listar resultados

```http
GET /api/v1/operations/results
Authorization: Bearer <token>
```

El backend determina al coordinador desde el token y limita los resultados a su ámbito autorizado. No se debe aceptar un `coordinatorId` libre enviado por el cliente para ampliar el alcance. Actualmente devuelve la lista completa; no implementa los parámetros de búsqueda, filtros, orden ni paginación mostrados aquí. La vista puede procesarlos localmente.

| Parámetro | Significado |
| --- | --- |
Los parámetros `q`, `status`, `sort`, `page` y `size` del ejemplo son una posible evolución; no forman parte de la implementación actual y no deben enviarse desde el cliente.

### Respuesta propuesta

```json
{
  "items": [
    {
      "id": "result-uuid",
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
      "publicationType": null,
      "availableAt": null
    }
  ],
  "summary": {
    "total": 22,
    "uploaded": 10,
    "correctionRequired": 4,
    "available": 8
  },
  "page": 0,
  "size": 8,
  "totalItems": 22,
  "totalPages": 3,
  "appliedFilters": {
    "q": "CAS-2026",
    "status": "UPLOADED",
    "sort": "uploadedAt,desc"
  }
}
```

`id` es el UUID técnico de resultado para las operaciones. `case.referenceCode` se usa para navegar y se muestra en la tabla; `case.id` es el UUID para consultar y operar sobre el caso. El nombre del resultado se toma de `file.originalFilename`; no existe un campo `name` separado. `studyName` mantiene el nombre de estudio libre definido en el contrato común de casos.

La respuesta contiene únicamente la versión vigente por caso. **Una versión de resultado es un solo archivo**, no un paquete de varios archivos. Cada nueva carga ocupa el siguiente número de versión de ese caso; las versiones anteriores y las bajas lógicas conservan su archivo y auditoría (`deletedAt`, `deletedBy`, `deletionReason`) en el historial, fuera de estas tablas habituales. `correctionRequest` contiene el motivo cuando el estado es `CORRECTION_REQUIRED`; en los demás estados es `null`.

Las fechas se envían como instantes ISO 8601 en UTC. El frontend las presenta en hora local con el formato acordado para la interfaz, por ejemplo `20/9/2026, 16:20`; no se debe enviar una fecha ya formateada como texto desde el backend.

`sizeBytes` es el valor numérico canónico; la interfaz puede convertirlo a `1.2 MB`. `extension` puede inferirse de `originalFilename`, por lo que se puede omitir si no se requiere explícitamente. No se deben enviar enlaces permanentes de descarga en el listado: la descarga debe autorizarse y generar una URL temporal mediante una operación específica.

En esta etapa el archivo de resultado solo se **descarga**. No se ofrece vista previa ni visualización integrada. Hay una sola versión vigente por caso y cada versión corresponde a un archivo.

## Estados y acciones

| Estado de API | Etiqueta de interfaz | Significado |
| --- | --- | --- |
| `UPLOADED` | Cargado | El investigador cargó el resultado; aún no está disponible para el propietario del caso. |
| `CORRECTION_REQUIRED` | Corrección requerida | Un coordinador detectó que un resultado ya publicado necesita reemplazo. El archivo publicado deja de estar disponible para descarga del propietario. No significa que la corrección ya esté hecha. |
| `AVAILABLE` | Disponible para el propietario | El coordinador publicó el resultado para consulta del propietario del caso. |

### Flujo acordado para el producto

La primera carga es la versión `1`; cuando coordinación la publica, queda como tipo `INITIAL`. Si el investigador detecta un error antes de publicar, reemplaza la versión `UPLOADED` mediante dos operaciones: elimina primero la pendiente con motivo (pasa a `DELETED` en historial y el caso vuelve a `ENABLED_FOR_PROCESSING`) y después carga la siguiente versión. La nueva versión queda pendiente de revisión y coordinación la publica. No existe reemplazo directo durante la carga. Si el investigador quiere retirar la pendiente sin reemplazo, puede eliminarla y el caso queda habilitado para procesamiento.

Si coordinación solicita una corrección de una versión ya publicada, esta pasa a `CORRECTION_REQUIRED` y guarda el motivo en `correctionRequest`; deja de estar disponible para el propietario. El investigador carga la siguiente versión (`UPLOADED`) y coordinación debe publicarla. Esa publicación es de tipo `CORRECTED`, reemplaza a la anterior como vigente y conserva todas las versiones en historial. El ciclo puede repetirse. La numeración es secuencial por caso y nunca se reutiliza, incluso cuando una versión pendiente se elimina o reemplaza.

Solo la versión vigente en `AVAILABLE` permite descargar al propietario del caso. Al solicitar una corrección o eliminarla, deja de aparecer en las tablas habituales y no se emiten nuevas URL de descarga. Las URL temporales ya emitidas pueden seguir vigentes hasta que expiren; se debe definir una vigencia corta o revocación si se necesita retirada inmediata.

**Permisos de edición y eliminación:** el investigador asignado puede eliminar una versión `UPLOADED` antes de publicarse, sin aprobación previa; para reemplazarla debe completar la eliminación y luego iniciar otra carga. Coordinación conserva la decisión de publicar la nueva versión. Una versión `AVAILABLE` no se puede editar ni borrar directamente por el investigador: coordinación inicia el flujo con una solicitud de corrección. La baja lógica guarda `deletedAt`, `deletedBy` y `deletionReason`; el registro y el archivo quedan en el historial y no se descargan desde las vistas normales.

El backend implementa `UPLOADED`, `AVAILABLE`, `CORRECTION_REQUIRED` y `DELETED`, con versionado por caso, historial y sincronización del estado del caso. `DELETED` se conserva como historial auditable y se excluye del listado normal.

Acciones sugeridas:

- «Ver caso»: navegar a `/casos_academicos/{case.referenceCode}`; usar `case.id` para las llamadas al API. Una dirección directa se resuelve según [la decisión de identificadores](../casos/identificadores-y-rutas.md).
- Publicar para el propietario del caso: reutilizar `POST /api/v1/operations/results/{resultId}/availability`.
- Solicitar corrección de un resultado `AVAILABLE`: `POST /api/v1/operations/results/{resultId}/correction-requests` con `{ "reason": "..." }`. Pasa a `CORRECTION_REQUIRED`, guarda el motivo, devuelve el caso a procesamiento y retira el acceso de descarga del propietario. La nueva carga del investigador queda pendiente de revisión.
- Eliminar un resultado pendiente: el investigador asignado usa `DELETE /api/v1/internal/cases/{caseId}/results/{resultId}?reason=...`. Es una baja lógica con `deletedAt`, `deletedBy` y `deletionReason`; conserva archivo e historial.

La pantalla actual solo presenta la acción de navegación al caso en la tabla; no asumir que ya existe una acción directa para publicar, corregir o descargar desde esta vista.

## Estado actual del backend

- `GET /api/v1/operations/results` lista resultados en el alcance autorizado del coordinador. Es una lista completa, sin paginación ni filtros de servidor.
- `GET /api/v1/internal/cases` es para casos asignados a investigadores e incluye un resumen de resultado; no es el endpoint del listado de coordinación.
- `POST /api/v1/operations/results/{resultId}/availability` publica el resultado para el propietario del caso. La operación requiere coordinador habilitado y asignación explícita al caso.
- El resultado se carga con `POST /api/v1/internal/cases/{caseId}/result-uploads` y se completa mediante el flujo de archivos. El resultado queda asociado al caso.
- El backend conserva versiones por caso. Cada versión representa un solo archivo; las anteriores y las eliminadas permanecen en el historial.
- El listado y las operaciones de publicar, solicitar corrección y consultar historial ya existen. La página frontend aún usa datos locales y debe conectarse al endpoint antes de afirmar que el flujo está integrado de extremo a extremo.
- El modelo de demostración usa `study` y `caseId` como código visible; al conectarlo al contrato común, mapear a `case.studyName`, `case.id` (UUID) y `case.referenceCode` de forma separada.
- La ruta `/resultados` está protegida por el guard de rol coordinador en `AppRoutes`; el backend debe validar también el rol y los permisos del listado.

## Decisiones pendientes

1. Acordar si el listado incluye resultados de todos los casos del coordinador o solo los que están asignados al coordinador autenticado; aplicar el mismo alcance en los contadores.
2. Una versión de resultado corresponde a un único archivo. Una entrega compuesta por varios archivos queda fuera de este alcance.
3. Definir de dónde salen `fullName` y `researcherCode`; el listado de usuarios internos existente no los entrega.
4. Corregir la navegación para utilizar `case.referenceCode` en la dirección y `case.id` (UUID) en las operaciones de API.

## Brechas conocidas del flujo

- El backend devuelve `expiresAt` al crear la intención de carga, pero aún no persiste ni valida el vencimiento al confirmar. El contrato exige rechazar confirmaciones vencidas; la implementación debe completarse.
- Al eliminar una primera carga pendiente y crear la versión siguiente, el backend puede inferir `CORRECTED` a partir del número de versión aunque nunca haya existido una publicación. La clasificación `INITIAL`/`CORRECTED` debe basarse en el historial de publicación/corrección.
- El mock del frontend permite operaciones en combinaciones de rol/estado que el backend rechaza y elimina registros físicamente. Los escenarios de prueba visual deben respetar el contrato y no presentar al mock como comportamiento autoritativo.
