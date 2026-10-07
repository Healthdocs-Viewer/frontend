# Contratos de endpoints guiados por la interfaz

Esta carpeta define los datos y operaciones que necesitan las pantallas del frontend. El backend se implementó antes de conocer por completo las interfaces y reglas actuales; por eso su estado presente es un punto de comparación posterior, no el límite de estos contratos.

## Orden de trabajo

1. **Cerrar la pantalla y su regla de negocio.** Identificar quién la usa, qué puede ver y hacer, qué datos muestra, qué filtros y estados necesita, y a dónde navega cada acción. Distinguir datos reales de los ejemplos locales de la interfaz.
2. **Definir el contrato deseado.** Precisar método y ruta HTTP, parámetros, respuesta, errores y reglas de autorización. Usar nombres y estados coherentes entre pantallas. Marcar como pendiente cualquier regla aún no decidida; no convertir un dato de demostración en regla de negocio sin acordarlo.
3. **Comparar con el backend.** Para cada contrato, registrar qué endpoint o dato ya existe, qué se debe ajustar, qué se debe crear y qué comportamiento anterior quedaría sin uso. Esta comparación no cambia el contrato deseado por sí sola.
4. **Acordar e incorporar al OpenAPI.** Los documentos de esta carpeta son propuestas de trabajo hasta que las decisiones queden acordadas y pasen al contrato OpenAPI. Después se implementan backend y conexión del frontend contra ese contrato.

En cada documento, las secciones «Qué necesita la interfaz» y «Contrato propuesto» expresan el objetivo. Las secciones «Estado actual del backend» o «Brechas» son inventario para la etapa 3. Si hay conflicto, se resuelve como una decisión explícita de producto o diseño, no copiando automáticamente la implementación anterior.

## Identificadores de caso

La [decisión de rutas de caso](casos/identificadores-y-rutas.md) fija `CAS-...` como identificador visible en las direcciones del frontend. El UUID `id` queda para las operaciones internas del API. Abrir o recargar una dirección requiere resolver el código visible con autorización.

## Antes de dar un contrato por cerrado

- La pantalla, sus acciones y sus reglas de acceso están definidas.
- Los campos, estados, filtros, conteos y errores tienen significado acordado.
- La navegación usa las rutas reales del frontend.
- Los ejemplos locales se han separado de los datos que el producto realmente necesita.
- Las diferencias con el backend están clasificadas como **crear**, **ajustar**, **conservar** o **retirar** para la etapa de implementación.
