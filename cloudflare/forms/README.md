# Formularios de Sysvexa en Cloudflare

Este Worker adapta el flujo público de formularios y CAPTCHA de Umbravia Forge
sin importar su servidor, sus cuentas ni su base multiempresa. Cloudflare
intercepta `/api/service-requests`, valida Turnstile y persiste la solicitud en
Cloudflare D1 mediante un binding privado.

D1 evita administrar otro proveedor, credenciales y conexiones de red. El
esquema empieza con estados e índices versionados para permitir crecimiento
controlado. La capa `repository.ts` mantiene aislada la persistencia para poder
migrar en el futuro a PostgreSQL con Hyperdrive sin cambiar el formulario.

## Preparación

1. Crear la base D1:

   ```sh
   npx wrangler d1 create sysvexa-service-requests
   ```

2. Sustituir `<D1_DATABASE_ID>` en `wrangler.jsonc` por el identificador devuelto
   y aplicar las migraciones versionadas:

   ```sh
   npx wrangler d1 migrations apply sysvexa-service-requests --remote --config cloudflare/forms/wrangler.jsonc
   ```

3. Crear un widget Turnstile para `sysvexatechnologies.com`, sustituir
   `<TURNSTILE_SITE_KEY>` por su clave pública y guardar el secreto sin
   escribirlo en el repositorio:

   ```sh
   npx wrangler secret put TURNSTILE_SECRET_KEY --config cloudflare/forms/wrangler.jsonc
   ```

4. Regenerar tipos, validar y desplegar:

   ```sh
   npm run worker:types
   npm run worker:check
   npm run worker:deploy
   ```

El binding de D1 y el secreto de Turnstile quedan dentro de Cloudflare. El
navegador solo recibe la clave pública.
Las cabeceras CSP de Caddy, Nginx y del servidor Node permiten únicamente el
script y el marco de `https://challenges.cloudflare.com` que necesita el
widget.
