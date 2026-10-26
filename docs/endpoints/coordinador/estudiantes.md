# Contrato de datos: Investigadores de docencia

Contrato de interfaz para `/investigadores` y el drawer de asignaciones que también se abre desde `/casos_academicos`. Los esquemas y rutas canónicas del API se mantienen en OpenAPI; este documento describe su uso desde la interfaz.

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
| `status` | Filtro opcional por `AUTHORIZED` o `RESTRICTED`. |
| `sort` | Orden por `name`, `researcherCode`, `email`, `authorizationStatus` o `assignedCaseCount`, con `asc` o `desc`. |
| `page` | Índice de página empezando en 0. |
| `size` | Investigadores por página; valor inicial 8 y máximo sugerido 100. |

### Respuesta propuesta

```json
{
  "summary": {
    "totalResearchers": 18,
    "authorizedResearchers": 17,
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

Los únicos estados de autorización son “Autorizado” y “Restringido”. `app_user.enabled` es independiente: controla si la cuenta puede iniciar sesión.

```text
AUTHORIZED
RESTRICTED
```

Cuando un coordinador o administrador cambia el rol de una cuenta de paciente a investigador, el nuevo estado es `AUTHORIZED`. No se usa `PENDING`. Cambiar a `RESTRICTED` impide nuevas asignaciones y conserva el rol, las asignaciones existentes y el historial.

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

El objeto de caso reutiliza los campos comunes: `id`, `referenceCode`, `studyName`, `status`, más `receivedAt` para la bandeja académica. `receivedAt` es la fecha oficial guardada en el caso cuando su propietario confirma el envío y el estado cambia a `FILES_RECEIVED`; no se deriva de `stored_file.updated_at`. La bandeja de asignación contiene casos en `FILES_RECEIVED`, incluidos los que sean propiedad del propio coordinador. Al asignar a un investigador habilitado y autorizado, el caso pasa a `ENABLED_FOR_PROCESSING`. `id` se usa para operaciones; `referenceCode` es el identificador mostrado.

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

## Gestión de investigadores desde un caso

El drawer «Gestionar acceso» se abre para un caso y muestra inicialmente solo las asignaciones vigentes. Si el caso no tiene investigadores asignados, presenta un estado vacío que invita a usar el buscador. El directorio no se carga hasta que se escribe una búsqueda. La búsqueda usa nombre, correo o código institucional. El cliente conserva las asignaciones originales y la selección del borrador visibles mientras cambian los resultados; buscar no guarda ni modifica las asignaciones.

### Cargar directorio y asignaciones actuales

Se reutiliza el listado de investigadores de este documento, incluyendo `q` para buscar por nombre, correo o `researcherCode`:

```http
GET /api/v1/operations/researchers?q=ana%40unal.edu.co&sort=name,asc&page=0&size=100
Authorization: Bearer <token>
```

El tamaño 100 permite mostrar una lista amplia; si hay más páginas, el cliente podrá solicitarlas al escribir o paginar el directorio. Las asignaciones vigentes y las personas seleccionadas en el borrador se conservan visibles aunque no coincidan con la búsqueda actual, y no se desmarcan al cambiar el término.

Para obtener directamente las asignaciones vigentes del caso:

```http
GET /api/v1/operations/cases/{caseId}/assignments
Authorization: Bearer <token>
```

`caseId` es el UUID técnico. Respuesta propuesta:

```json
{
  "caseId": "case-uuid",
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

`researchers` incluye el detalle de las asignaciones vigentes para que sigan identificables aunque no aparezcan en una página o búsqueda del directorio. `researcherIds` permite comparar la selección actual con el borrador del cliente. Ambas propiedades reflejan la relación vigente entre casos e investigadores; no existe un contador `assignmentVersion`.

### Guardar el conjunto seleccionado

```http
PUT /api/v1/operations/cases/{caseId}/assignments
Authorization: Bearer <token>
Content-Type: application/json
```

Solicitud:

```json
{
  "researcherIds": ["researcher-uuid"]
}
```

La operación reemplaza de forma atómica el conjunto completo de asignaciones: `researcherIds` puede contener varios identificadores únicos. Los cambios se permiten cuando el caso está en `FILES_RECEIVED`, `ENABLED_FOR_PROCESSING`, `RESULT_UPLOADED` o `RESULT_AVAILABLE` y conserva un archivo de entrada activo. No se permiten cambios durante `INPUT_CHANGE_DRAFT` ni `INPUT_CHANGE_REVIEW`; la asignación vigente se conserva mientras se resuelve la solicitud. Las altas requieren investigadores habilitados con `authorizationStatus=AUTHORIZED`. Una asignación ya existente con autorización `RESTRICTED` se conserva aunque no se incluya en la lista solicitada. Esta operación no cambia el estado del caso. La respuesta devuelve `caseId`, `researcherIds` y `researchers`.

### Reglas de interacción y elegibilidad

- Al abrir el drawer, el frontend carga las asignaciones actuales. Muestra un estado vacío si no hay ninguna. El directorio se carga al iniciar una búsqueda; ambas consultas muestran estados de carga, error y reintento.
- La búsqueda es insensible a mayúsculas y tildes y puede usar debounce. Buscar por nombre, correo o código institucional.
- La selección admite varios investigadores autorizados. El resumen muestra cuántas personas se agregarán y quitarán; «Guardar cambios» permanece deshabilitado si no hay cambios.
- Un clic fuera, Escape, la X y «Cancelar» cierran directamente solo cuando no hay cambios. Con cambios pendientes abren una confirmación con «Seguir editando» y «Descartar cambios».
- Los casos en `INPUT_CHANGE_DRAFT` o `INPUT_CHANGE_REVIEW` son de solo consulta: se muestran las asignaciones, pero los controles de selección y guardado quedan deshabilitados. El backend rechaza cambios durante estos estados.
- Las altas requieren estado `AUTHORIZED`; una persona `RESTRICTED` no puede recibir nuevas asignaciones, pero una asignación vigente se conserva.
- Si falla el guardado, el drawer queda abierto y conserva el borrador. Una respuesta exitosa actualiza la selección base y muestra confirmación dentro del drawer, que permanece abierto.
- El identificador enviado es `userId`; correo, nombre y código son datos de presentación/búsqueda. El cliente nunca decide el permiso final.
- El backend valida que el token corresponda a un coordinador autorizado, que el caso pertenezca a su ámbito y que los usuarios sean investigadores válidos. El ID del coordinador no se recibe desde el cliente.
- El acceso operativo del coordinador que opera el caso es independiente de `researcherIds`; la asignación al investigador no retira el acceso del coordinador.
- La respuesta de directorio es paginada. El frontend conserva en su borrador todas las selecciones, incluso si se ocultan al cambiar de página o búsqueda.

Errores recomendados: `401` sesión ausente/expirada, `403` rol o permiso insuficiente, `404` caso o investigador fuera del ámbito visible y `422` selección inválida o investigador no elegible. Las respuestas de error usan el formato común del API.

## Cómo se obtiene el total de casos asignados

El número de la tabla es específico para cada investigador. Se calcula contando las relaciones caso-investigador vigentes. La respuesta de listado puede incluir `assignedCaseCount` para evitar una consulta por investigador. El contador de resumen cuenta las relaciones visibles para el coordinador y respeta las reglas de alcance acordadas.

## Estado actual del backend

- `GET /api/v1/operations/researchers` proporciona el directorio paginado, con búsqueda por nombre, correo o `researcherCode` y filtros de autorización.
- `GET /api/v1/operations/cases/{caseId}/assignments` y `PUT /api/v1/operations/cases/{caseId}/assignments` permiten consultar y reemplazar atómicamente las asignaciones vigentes de un caso.
- `GET /api/v1/operations/cases/academic` alimenta la tabla `/casos_academicos` con búsqueda, filtro por estado, orden y paginación. Devuelve identificador, fecha de recepción, estado y última actualización; el investigador asignado se consulta aparte al abrir el drawer.
- `GET /api/v1/internal/cases` lista los casos asignados al usuario interno autenticado; no permite que coordinación consulte los casos de otra persona.
- La ruta `/investigadores` está protegida por el guard de rol coordinador en `AppRoutes`; el backend debe validar también el rol y los permisos de cada operación.
- El acceso a gestionar investigadores desde `/casos_academicos` y el detalle debe limitarse al rol coordinador; el backend debe verificar permisos para cada operación aunque la ruta del frontend esté protegida.
