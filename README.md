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
- Voz en primera persona, coherente con un profesional independiente.

## Desarrollo local

```bash
npm install
npm run dev
```

## Ejecución en producción

Requiere Node.js 24.15 o posterior dentro de la versión 24 y npm 12.0.2 o
posterior dentro de la versión 12. El servidor incluido escucha en todas las
interfaces para poder ejecutarse detrás de un proxy HTTPS en Linux, Windows o
macOS:

```bash
npm ci
npm run build
npm start
```

Se puede cambiar el puerto con `PORT` y la interfaz con `HOST`. En una instancia
pública debe situarse detrás de Caddy, Nginx o el balanceador del proveedor para
terminar HTTPS; `npm start` no gestiona certificados.

La carpeta `deploy/` contiene configuraciones equivalentes para Caddy y Nginx,
ambas sobre el mismo artefacto y enlace de release. La preparación de Stripe se
documenta en `docs/STRIPE.md`; permanece desactivada y sin secretos por defecto.
El actualizador reutiliza y adapta el modelo de releases seguras de Umbravia
Forge: construcción aislada, activación atómica, salud HTTPS y rollback.

La instancia no requiere base de datos. La futura API de solicitudes se plantea
como un Cloudflare Worker con D1; la decisión y los límites se documentan en
`docs/ARCHITECTURE.md`.

Comprobaciones:

```bash
npm test
npm run typecheck
npm run build
npm run portability:clean
npm run portability:check
npm run deploy:check
```

## Siguiente etapa

Conectar el formulario a una API segura y crear el panel privado con el ciclo
`Nuevo → En diagnóstico → Presupuesto enviado → Aceptado → En reparación →
Completado`.
