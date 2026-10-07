# Contrato de datos: Investigadores de docencia

Documento de trabajo para la vista `/investigadores`, usada por el rol de coordinador. Describe la tabla de investigadores y el panel donde se consultan y gestionan sus casos asignados. Las propuestas no sustituyen el OpenAPI canónico hasta que se acuerden e incorporen allí.

## Qué muestra la interfaz

### Tabla de investigadores

- Búsqueda por nombre, identificador o correo.
- Resumen de investigadores autorizados y cantidad total de casos asignados.
- Columnas: nombre, identificador, correo, estado de autorización, casos asignados y acción.
- Orden por nombre, identificador, correo, estado o número de casos asignados.
- Paginación local de ocho investigadores por página.

### Panel “Gestionar casos”

- Muestra los casos asignados y disponibles para un investigador.
- Busca por identificador del caso, ordena por fecha de recepción y pagina los casos.
- Permite seleccionar o retirar varios casos y guardar el conjunto de cambios.
- Pide confirmar antes de retirar accesos.

## Contrato propuesto para listar investigadores

```http
GET /api/v1/operations/researchers?q=ana&status=AUTHORIZED&sort=name,asc&page=0&size=8
Authorization: Bearer <token>
```

El servidor determina al coordinador desde el token. No se envía un identificador de coordinador para elegir el alcance.

| Parámetro | Significado |
| --- | --- |
| `q` | Búsqueda parcial por nombre, código institucional o correo. |
| `status` | Filtro opcional por `AUTHORIZED`, `PENDING` o `RESTRICTED`. |
| `sort` | Orden por `name`, `researcherCode`, `email`, `authorizationStatus` o `assignedCaseCount`, con `asc` o `desc`. |
| `page` | Índice de página empezando en 0. |
| `size` | Investigadores por página; valor inicial 8 y máximo sugerido 100. |

### Respuesta propuesta

```json
{
  "summary": {
    "totalResearchers": 18,
    "authorizedResearchers": 15,
    "totalAssignedCases": 38
  },
  "items": [
    {
      "userId": "researcher-uuid",
      "researcherCode": "EST-1187",
      "fullName": "Ana Ruiz",
      "email": "aruiz@unal.edu.co",
      "authorizationStatus": "AUTHORIZED",
      "assignedCaseCount": 5
    }
  ],
  "page": 0,
  "size": 8,
  "totalItems": 18,
  "totalPages": 3,
  "appliedFilters": {
    "q": "ana",
    "status": "AUTHORIZED",
    "sort": "name,asc"
  }
}
```

`userId` es la identidad técnica que se envía al gestionar asignaciones; `researcherCode` es el identificador legible que se muestra en pantalla. `assignedCaseCount` y `totalAssignedCases` cuentan asignaciones investigador-caso, no casos únicos: un mismo caso asignado a dos investigadores cuenta dos veces en el total de asignaciones.

### Estados de autorización

Los estados visibles actuales son “Autorizado”, “Pendiente” y “Restringido”. Propuesta de códigos:

```text
AUTHORIZED
PENDING
RESTRICTED
```

El backend actual solo distingue si el usuario interno está habilitado o deshabilitado. No tiene un estado explícito de autorización académica ni de invitación pendiente; estos estados requieren una regla/dato de negocio acordado. No asumir que todo usuario deshabilitado está “Pendiente”.

## Contrato propuesto para los casos de un investigador

La interfaz del panel guarda cambios en lote, por lo que necesita conocer la lista de casos y cuáles están asignados al investigador seleccionado.

```http
GET /api/v1/operations/researchers/{researcherId}/cases?q=CAS-2026&sort=receivedAt,desc&page=0&size=10
PUT /api/v1/operations/researchers/{researcherId}/case-assignments
Authorization: Bearer <token>
```

`researcherId` es el `userId` interno. El coordinador que ejecuta la operación debe estar autorizado para gestionar esa asignación.

### Respuesta de casos del investigador

```json
{
  "items": [
    {
      "id": "case-uuid",
      "referenceCode": "CAS-20260921-0042",
      "studyName": "Radiografía de tórax",
      "status": "ENABLED_FOR_PROCESSING",
      "receivedAt": "2026-09-21T14:32:00Z",
      "isAssigned": true
    }
  ],
  "page": 0,
  "size": 10,
  "totalItems": 24,
  "totalPages": 3,
  "appliedFilters": {
    "q": "CAS-2026",
    "sort": "receivedAt,desc"
  }
}
```

El objeto de caso reutiliza los campos comunes: `id`, `referenceCode`, `studyName`, `status`, más `receivedAt` para la bandeja académica. `id` se usa para operaciones; `referenceCode` es el identificador mostrado.

### Solicitud para guardar asignaciones

```json
{
  "caseIds": [
    "case-uuid",
    "case-uuid-2"
  ]
}
```

La solicitud reemplaza el conjunto de casos asignados al investigador por el conjunto enviado. El backend debe validar todas las altas y bajas antes de guardar para que el cambio sea atómico. Si algún caso no se puede asignar o retirar, responder con error sin guardar parcialmente. Debe conservarse el acceso operativo del coordinador cuando las reglas del flujo lo exijan.

## Contrato propuesto para gestionar investigadores desde un caso

El drawer «Gestionar acceso» se abre para un caso y presenta el directorio de investigadores con los accesos actuales marcados. La búsqueda usa nombre, correo o código institucional. El cliente conserva el borrador mientras se busca; cambiar el término no modifica la selección.

### Cargar directorio y asignaciones actuales

Se reutiliza el listado de investigadores de este documento, incluyendo `q` para buscar por nombre, correo o `researcherCode`:

```http
GET /api/v1/operations/researchers?q=ana%40unal.edu.co&sort=name,asc&page=0&size=100
Authorization: Bearer <token>
```

El tamaño 100 permite mostrar una lista amplia; si hay más páginas, el cliente podrá solicitarlas al escribir o paginar el directorio. Las filas seleccionadas que no coincidan con el término actual se conservan visibles en el drawer y no se desmarcan al cambiar de búsqueda.

Para obtener la selección inicial y detectar ediciones concurrentes:

```http
GET /api/v1/operations/cases/{caseId}/assignments
Authorization: Bearer <token>
```

`caseId` es el UUID técnico. Respuesta propuesta:

```json
{
  "caseId": "case-uuid",
  "assignmentVersion": 3,
  "researchers": [
    {
      "userId": "researcher-uuid",
      "researcherCode": "EST-1187",
      "fullName": "Ana Ruiz",
      "email": "aruiz@unal.edu.co",
      "authorizationStatus": "AUTHORIZED",
      "assignedCaseCount": 5
    }
  ],
  "researcherIds": ["researcher-uuid"]
}
```

`researchers` incluye el detalle de las asignaciones vigentes para que sigan identificables aunque no aparezcan en una página o búsqueda del directorio. `researcherIds` es la selección inicial compacta que el cliente usa para calcular altas y bajas. `assignmentVersion` es una versión opaca/monótona para control de concurrencia.

### Guardar el conjunto seleccionado

```http
PUT /api/v1/operations/cases/{caseId}/assignments
Authorization: Bearer <token>
Content-Type: application/json
```

Solicitud:

```json
{
  "researcherIds": ["researcher-uuid", "researcher-uuid-2"],
  "expectedVersion": 3
}
```

El servidor reemplaza el conjunto de investigadores asignados por `researcherIds`, valida todas las adiciones y retiros y confirma el cambio de forma atómica. La respuesta devuelve `caseId`, `researcherIds`, `researchers` y el nuevo `assignmentVersion`. Si `expectedVersion` ya no coincide con la versión vigente, responde `409 Conflict` sin guardar cambios; el cliente informa el conflicto y ofrece recargar las asignaciones. No se debe cerrar el drawer ni borrar el borrador si el guardado falla.

### Reglas de interacción y elegibilidad

- Al abrir el drawer, el frontend carga directorio y asignaciones actuales. Muestra estados de carga, error y reintento.
- La búsqueda es insensible a mayúsculas y tildes y puede usar debounce. Buscar por nombre, correo o código institucional.
- Las casillas modifican un borrador local. El resumen compara ese borrador con la selección inicial y presenta cuántos accesos se agregarán y quitarán. «Guardar cambios» permanece deshabilitado si no hay diferencias.
- Un clic fuera, Escape, la X y «Cancelar» cierran directamente solo cuando no hay cambios. Con cambios pendientes abren una confirmación con «Seguir editando» y «Descartar cambios».
- Un investigador `AUTHORIZED` puede agregarse. `PENDING` y `RESTRICTED` no se pueden agregar; si ya tenían acceso, permanecen visibles y marcados para permitir retirar el acceso.
- Si falla el guardado, el drawer queda abierto y conserva el borrador. Solo una respuesta exitosa actualiza la asignación y cierra el panel.
- El identificador enviado es `userId`; correo, nombre y código son datos de presentación/búsqueda. El cliente nunca decide el permiso final.
- El backend valida que el token corresponda a un coordinador autorizado, que el caso pertenezca a su ámbito y que los usuarios sean investigadores válidos. El ID del coordinador no se recibe desde el cliente.
- La asignación del coordinador que opera el caso es independiente de `researcherIds`; reemplazar las asignaciones de investigadores no debe retirar su acceso operativo.
- La respuesta de directorio es paginada. El frontend conserva en su borrador todas las selecciones, incluso si se ocultan al cambiar de página o búsqueda.

Errores recomendados: `401` sesión ausente/expirada, `403` rol o permiso insuficiente, `404` caso o investigador fuera del ámbito visible, `409` versión de asignaciones desactualizada y `422` selección inválida o investigador no elegible. Las respuestas de error usan el formato común del API.

## Cómo se obtiene el total de casos asignados

El número de la tabla es específico para cada investigador. Se calcula contando las relaciones caso-investigador vigentes. La respuesta de listado puede incluir `assignedCaseCount` para evitar una consulta por investigador. El contador de resumen cuenta las relaciones visibles para el coordinador y respeta las reglas de alcance acordadas.

## Estado actual del backend

- `GET /api/v1/operations/users/internal` existe para coordinadores habilitados y devuelve usuarios internos habilitados con `id`, `email` y `role`. Aún no entrega `fullName`, `researcherCode`, estado académico ni `assignedCaseCount`.
- No encontré una consulta que liste los casos de un investigador seleccionado ni sus asignaciones actuales.
- `GET /api/v1/internal/cases` lista los casos asignados al usuario autenticado; no permite que coordinación consulte los casos de otra persona.
- `POST /api/v1/operations/cases/{caseId}/assignments` agrega acceso de forma individual y solo permite casos `FILES_RECEIVED`. El frontend del drawer implementa un mock de consulta y guardado por lote; `GET/PUT /api/v1/operations/cases/{caseId}/assignments` aún deben implementarse en backend.
- La ruta `/investigadores` está protegida por el guard de rol coordinador en `AppRoutes`; el backend debe validar también el rol y los permisos de cada operación.
- El acceso a gestionar investigadores desde `/casos_academicos` y el detalle debe limitarse al rol coordinador; el backend debe verificar permisos para cada operación aunque la ruta del frontend esté protegida.

## Decisiones pendientes

1. Definir de dónde salen `fullName` y `researcherCode`, ya que el perfil actual solo expone correo, rol e identificador interno.
2. Definir la fuente y ciclo de vida backend de `AUTHORIZED`, `PENDING` y `RESTRICTED`. El frontend propuesto solo permite agregar investigadores `AUTHORIZED` y deja retirar asignaciones existentes aunque el estado haya cambiado.
3. Definir qué casos pueden asignarse o retirarse según su estado; el endpoint actual solo permite asignar casos en `FILES_RECEIVED`, mientras que el drawer académico lista casos habilitados para procesamiento o con resultados.
4. Confirmar si coordinación puede gestionar cualquier investigador/caso o solo los que pertenecen a su ámbito.
5. Acordar el tratamiento de las asignaciones del coordinador al guardar el conjunto de investigadores.
