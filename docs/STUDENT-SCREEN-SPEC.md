# Especificación de pantallas — Estudiante

Este documento traduce el contrato del estudiante en una guía concreta para diseñar e implementar sus ventanas y componentes.

## 1. Dashboard del estudiante

### Navegación principal

El estudiante conserva las funcionalidades del paciente y además tiene un área académica propia.

- Inicio.
- Mis casos.
- Estudiante.
- Notificaciones.
- Perfil.

La pestaña `Estudiante` contiene las funciones académicas. `Mis casos`, resultados personales y notificaciones pertenecen al área personal y no deben mezclarse con los casos asignados por un profesor.

## 2. Estudiante — Casos asignados

### Objetivo

Consultar los casos que fueron asignados al estudiante, descargar sus archivos autorizados y acceder a los resultados asociados.

### Elementos de la vista

- Título `Casos asignados`.
- Descripción breve.
- Buscador por identificador del caso.
- Filtros: `Todos`, `Pendiente`, `En procesamiento`, `Resultado cargado`, `Corrección requerida` y `Disponible para el paciente`.
- Tabla o lista de casos.

### Columnas del listado

- Identificador del caso.
- Fecha de asignación.
- Estado del caso.
- Cantidad de resultados asociados.
- Última actualización.
- Acción `Ver detalle`.

El estudiante solo ve casos asignados a su usuario. No aparecen acciones para asignar, reasignar o habilitar resultados.

### Estados de la vista

- Cargando.
- Sin casos asignados.
- Sin coincidencias de búsqueda o filtros.
- Error al cargar.
- Sesión expirada.

## 3. Detalle del caso asignado

Al seleccionar un caso se abre su detalle como página o panel.

### Información del caso

- Identificador.
- Fecha de asignación.
- Estado.
- Última actualización.

### Archivos de trabajo

- Lista de archivos autorizados.
- Nombre del archivo.
- Fecha.
- Tamaño.
- Acción `Descargar`.

### Seguimiento académico

- Observaciones del profesor.
- Estado del procesamiento.
- Fecha de última asignación o actualización.

### Resultados del caso

- Lista de uno o varios resultados.
- Nombre o identificador.
- Tipo.
- Fecha de carga.
- Versión.
- Estado.
- Acciones permitidas.
- Botón `Añadir resultado`.

## 4. Panel lateral — Añadir resultado

La acción `Añadir resultado` abre un panel lateral derecho.

### Contenido

- Encabezado `Añadir resultado`.
- Identificador del caso relacionado.
- Nombre o identificador del resultado.
- Tipo de resultado, si aplica.
- Selector o zona para arrastrar el archivo.
- Comentario opcional.
- Botón `Cargar resultado`.
- Botón `Cancelar`.

### Validaciones y estados

- Validar campos obligatorios.
- Validar tipo y tamaño del archivo.
- Mostrar progreso de carga.
- Mostrar error y permitir reintentar.
- Actualizar el listado solo después de confirmar el éxito del backend.

## 5. Panel lateral — Editar resultado

La acción `Editar` reutiliza el panel lateral, en modo edición.

### Contenido

- Encabezado `Editar resultado`.
- Caso relacionado.
- Nombre y tipo actuales.
- Archivo y versión actuales.
- Opción para reemplazar el archivo.
- Comentario u observación.
- Botón `Guardar cambios`.
- Botón `Cancelar`.

Solo se pueden editar resultados `Cargados` o en `Corrección requerida`, si el permiso lo permite. Los resultados disponibles para el paciente no se editan directamente.

## 6. Confirmación — Eliminar resultado

La acción `Eliminar` abre un diálogo de confirmación.

Debe mostrar:

- Nombre o identificador del resultado.
- Caso relacionado.
- Mensaje indicando que la acción no se puede deshacer.
- Botón `Eliminar`.
- Botón `Cancelar`.

Solo pueden eliminarse resultados que todavía no estén disponibles para el paciente. El listado cambia únicamente después de confirmar el éxito de la eliminación.

## 7. Estudiante — Resultados

### Objetivo

Consultar y gestionar todos los resultados que el estudiante ha cargado.

### Elementos de la vista

- Título `Resultados`.
- Buscador por identificador del caso o nombre del resultado.
- Filtros del resultado: `Todos`, `Pendiente`, `Cargado`, `Corrección requerida` y `Disponible para el paciente`.
- Tabla o lista de resultados.

### Columnas del listado

- Identificador del caso.
- Nombre o identificador del resultado.
- Fecha de carga.
- Versión.
- Estado.
- Última actualización.
- Acción `Ver detalle`.

`Pendiente` representa un caso asignado que todavía no tiene resultados cargados. `Cargado` representa un resultado enviado y pendiente de revisión. Estos estados corresponden al resultado y no sustituyen el estado general del caso.

### Acciones

- Descargar.
- Editar.
- Eliminar.
- Cargar nueva versión cuando exista una solicitud de corrección.
- Añadir otro resultado al caso relacionado.

El estudiante no puede aprobar, habilitar ni publicar resultados para el paciente.

## 8. Versiones y correcciones

Cuando el profesor solicita una corrección:

```text
Resultado original
      ↓
Corrección requerida
      ↓
Nueva versión
      ↓
Nueva revisión del profesor
```

La nueva versión conserva la relación con el mismo caso. El resultado anterior debe mantenerse como referencia y no sobrescribirse silenciosamente.

## 9. Estados alternativos y errores

Todas las vistas deben contemplar:

- Cargando.
- Vacío.
- Sin coincidencias.
- Error de carga, descarga o guardado.
- Validación de archivo fallida.
- Carga exitosa.
- Sesión expirada.
- Permiso insuficiente.

Los mensajes deben explicar qué ocurrió y cuál es la siguiente acción. No deben exponer información personal innecesaria del paciente.

## 10. Flujo completo

```text
Estudiante → Casos asignados → Seleccionar caso
                         ↓
              Descargar archivos
                         ↓
             Procesar fuera de la plataforma
                         ↓
              Añadir uno o varios resultados
                         ↓
                 Profesor revisa
                         ├── Corrección requerida → Nueva versión
                         └── Disponible para el paciente
```

## 11. Criterios de implementación

- Respetar los permisos recibidos desde backend.
- No mostrar acciones de asignación, reasignación o habilitación.
- Mantener visible el identificador del caso en paneles y confirmaciones.
- Confirmar eliminaciones y reemplazos.
- No permitir modificar o eliminar resultados disponibles para el paciente.
- Reutilizar el panel lateral para añadir y editar resultados.
- Actualizar listados solo después de confirmar éxito en backend.
