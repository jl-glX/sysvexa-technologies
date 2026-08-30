# Sysvexa Technologies

Primer MVP web de una plataforma de servicios informáticos para particulares y
pequeños negocios. Presenta el catálogo inicial, explica el proceso de trabajo y
permite recorrer una solicitud de servicio antes de conectar el backend.

## Alcance actual

- Mantenimiento y reparación de equipos.
- Montaje y mejora de ordenadores.
- Redes domésticas y de pequeños negocios.
- Seguridad básica y protección de datos.
- Interfaz responsive con castellano como contenido base.
- Detección del idioma del navegador, persistencia de la elección manual y
  fallback a inglés estadounidense cuando el navegador no está soportado.
- Catálogos completos en castellano, gallego, catalán, aranés, francés, inglés
  estadounidense, alemán e italiano, más overrides regionales valencianos.

## Desarrollo local

```bash
npm install
npm run dev
```

Comprobaciones:

```bash
npm test
npm run typecheck
npm run build
```

## Siguiente etapa

Conectar el formulario a una API segura y crear el panel privado con el ciclo
`Nuevo → En diagnóstico → Presupuesto enviado → Aceptado → En reparación →
Completado`.
