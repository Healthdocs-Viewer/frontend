# Contrato de datos: Casos asignados

Documento de trabajo para la vista `/casos_asignados`, usada en el espacio de trabajo de docencia por investigadores y coordinadores con acceso interno. Registra lo que la tabla muestra, el endpoint de backend existente y los campos/estados que aún deben definirse. Las propuestas no sustituyen el OpenAPI canónico hasta que se acuerden e incorporen allí.

## Qué muestra la interfaz

- Título «Casos Académicos» y una tabla de casos asignados.
- Búsqueda por identificador de caso y investigador asignado.
- Filtros por todos, asignado, en procesamiento, resultado cargado, corrección requerida y disponible para el paciente. Cada filtro tiene contador.
- Columnas: identificador del caso, fecha de recepción, estado, última actualización y acciones.
- Orden ascendente/descendente por fecha de recepción.
- Paginación de ocho casos por página.
- Acción «Ver detalle», que abre `/casos_academicos/:referenceCode`.

La pantalla filtra los casos «Sin asignar» y solo presenta casos asignados. Por el momento usa datos locales de demostración; no consulta el API.

## Endpoint existente

El endpoint que corresponde a los casos del usuario interno autenticado ya existe:

```http
GET /api/v1/internal/cases
Authorization: Bearer <token>
```

El backend determina el usuario y su rol desde el token. Devuelve una lista JSON (sin paginación, búsqueda ni filtros de servidor) de casos asignados al usuario con estado `ENABLED_FOR_PROCESSING`, `RESULT_UPLOADED` o `RESULT_AVAILABLE`.

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

## Ajuste necesario para cubrir la tabla

La respuesta actual puede alimentar el identificador, la fecha de recepción y el estado básico, pero faltan campos que usa la interfaz de demostración. Si la tabla mantiene la columna «Última actualización», se propone añadir `updatedAt` al objeto de caso:

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

Las fechas deben seguir siendo ISO 8601 en UTC en el API; no enviar el texto localizado ya formateado. El listado actual tampoco entrega datos del investigador asignado. Para mostrar/buscar por investigador, solo deben añadirse los datos de asignación que correspondan al alcance del usuario, por ejemplo:

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
| `ENABLED_FOR_PROCESSING` | En procesamiento | Caso asignado y habilitado para trabajo interno. |
| `RESULT_UPLOADED` | Resultado cargado | Se cargó un resultado, pendiente de disponibilidad al paciente. |
| `RESULT_AVAILABLE` | Disponible para el paciente | El resultado ya fue publicado. |

La UI de demostración también presenta «Asignado», «Corrección requerida» y «Sin asignar». El endpoint actual no devuelve casos sin asignar y el modelo de estados no permite distinguir «Asignado» de «En procesamiento» ni expresa «Corrección requerida». No mapear dos conceptos distintos al mismo estado sin una decisión de producto. Si esos estados deben aparecer aquí, hay que acordar su significado y persistencia en el backend.

## Paginación, búsqueda y orden

Hoy el backend devuelve todos los casos asignados en un arreglo; búsqueda, filtro, ordenamiento y paginación son responsabilidades locales del frontend. Si el volumen de casos lo requiere, se puede evolucionar el endpoint para aceptar:

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

El cambio a paginación de servidor es opcional mientras el listado sea pequeño; el cliente no debe combinar `page` local con paginación del servidor.

## Navegación al detalle

El detalle académico se abre con `/casos_academicos/{referenceCode}`. La tabla debe conservar también `id` (UUID) para las llamadas al API. En la implementación de demostración `item.id` contiene un código `CAS-...`; al integrar el API, separar los dos campos y resolver las direcciones directas según [la decisión de identificadores](../casos/identificadores-y-rutas.md).

## Brechas actuales

- El componente de `/casos_asignados` usa datos locales y el backend ya ofrece `GET /api/v1/internal/cases`.
- El backend entrega `createdAt`, pero no `updatedAt` en su objeto de caso; se necesita ese dato para poblar la última actualización.
- No entrega nombre/código de investigadores asignados para la búsqueda que anuncia la UI.
- Los filtros «Sin asignar» y «Corrección requerida» no corresponden a los estados/listado actuales.
- La interfaz tiene un estado «Asignado» que no se distingue de `ENABLED_FOR_PROCESSING` en el dominio actual.
- La pantalla tiene paginación/orden/búsqueda local; el endpoint no ofrece aún esos parámetros.
- Aunque la tabla presenta un control de orden en “Última actualización”, el cálculo local sigue ordenando por fecha de recepción. El control de la segunda columna no cambia el campo de orden; corregir la interfaz o documentar solo orden por una columna.
- La ruta `/casos_asignados` está protegida por el guard de rol investigador en `AppRoutes`; el backend debe validar también el rol, la cuenta y las asignaciones.

## Decisiones pendientes

1. Confirmar si `/casos_asignados` es solo para investigador, solo coordinador o compartida. El menú la ubica bajo “Investigadores” y el endpoint admite usuarios internos; las rutas de `AppRoutes` no tienen actualmente guard de rol para esta sección.
2. Decidir si la tabla necesita mostrar al investigador asignado. Para un investigador autenticado, suele ser redundante; para el coordinador puede ser necesario.
3. Definir qué evento actualiza `updatedAt` y exponerlo desde el backend.
4. Acordar si la pantalla debe incluir casos sin asignar; el endpoint existente lista únicamente casos asignados al usuario autenticado.
5. Definir si «Corrección requerida» es un estado real del caso o del resultado y actualizar el filtro según ese modelo.
6. Mantener el UUID técnico del caso separado de `referenceCode` en los tipos del frontend.
