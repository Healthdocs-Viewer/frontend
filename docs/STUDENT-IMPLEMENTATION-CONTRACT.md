# Contrato de implementación — Área del estudiante

Este documento define el alcance de implementación del área académica del estudiante. El estudiante conserva además el área personal del paciente, con sus casos propios, resultados y notificaciones.

## 1. Estructura

El dashboard del estudiante tendrá:

- Área personal: `Inicio`, `Mis casos`, `Notificaciones` y `Perfil`.
- Área académica: `Estudiante`.

Dentro de `Estudiante` habrá dos subpestañas:

- `Casos asignados`.
- `Resultados`.

El estudiante no puede asignar, reasignar, aprobar ni habilitar casos o resultados para el paciente.

## 2. Casos asignados

### Listado

- Buscador por identificador del caso.
- Filtros: `Pendiente`, `En procesamiento`, `Resultado cargado`, `Corrección requerida` y `Disponible para el paciente`.
- Identificador del caso.
- Fecha de asignación.
- Estado actual.
- Cantidad de resultados asociados.
- Fecha de última actualización.
- Acción para abrir el detalle.

### Detalle

- Información básica del caso.
- Archivos autorizados para descarga.
- Observaciones del profesor.
- Estado del procesamiento.
- Sección `Resultados del caso`.
- Botón `Añadir resultado`.

El estudiante puede consultar y descargar los archivos asignados, procesarlos fuera de la plataforma y cargar uno o varios resultados relacionados con el mismo caso.

## 3. Resultados

### Listado y seguimiento

- Buscador por identificador del caso o nombre del resultado.
- Filtros del resultado: `Todos`, `Pendiente`, `Cargado`, `Corrección requerida` y `Disponible para el paciente`.
- Caso relacionado.
- Nombre o identificador del resultado.
- Fecha de carga.
- Versión.
- Estado y última actualización.
- Acción para abrir el detalle.

`Pendiente` representa un caso asignado que todavía no tiene un resultado cargado. `Cargado` representa un resultado enviado y pendiente de revisión.

### Panel lateral para añadir o editar

Las acciones `Añadir resultado` y `Editar` se realizan en un panel lateral derecho.

El modo añadir contiene:

- Caso relacionado.
- Nombre o identificador.
- Tipo, si aplica.
- Selector o zona para arrastrar el archivo.
- Comentario opcional.
- Botones `Cargar resultado` y `Cancelar`.

El modo editar contiene:

- Caso relacionado.
- Nombre, tipo, archivo y versión actuales.
- Opción para reemplazar el archivo.
- Comentario u observación.
- Botones `Guardar cambios` y `Cancelar`.

El panel valida campos obligatorios, tipo y tamaño del archivo, muestra el progreso y confirma el resultado de la operación.

### Reglas de resultados

- Los resultados `Cargados` o en `Corrección requerida` pueden editarse o reemplazarse si el permiso lo permite.
- Los resultados `Disponibles para el paciente` no pueden editarse ni eliminarse directamente.
- Un resultado disponible que requiera cambios debe gestionarse como nueva versión o nuevo resultado.
- La eliminación requiere confirmación y solo está disponible antes de habilitar el resultado.
- La nueva versión conserva la relación con el mismo caso y vuelve a revisión.

## 4. Estados de interfaz

- Cargando.
- Sin casos asignados.
- Caso sin resultados.
- Sin resultados o sin coincidencias.
- Error al cargar, descargar o guardar.
- Carga exitosa.

Los mensajes deben explicar qué ocurrió y qué acción puede realizar el estudiante. No deben exponer información personal innecesaria del paciente.

## 5. Flujo principal

```text
Casos asignados → Seleccionar caso → Descargar archivos
       ↓
Procesar fuera de la plataforma
       ↓
Añadir uno o varios resultados
       ↓
Profesor revisa
       ├── Corrección requerida → Nueva versión → Nueva revisión
       └── Disponible para el paciente
```
