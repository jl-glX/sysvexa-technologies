# Formularios de Sysvexa en Cloudflare

Este Worker adapta el flujo público de formularios y CAPTCHA de Umbravia Forge
sin importar su servidor, sus cuentas ni su base multiempresa. Cloudflare
intercepta `/api/service-requests`, valida Turnstile y persiste la solicitud en
un PostgreSQL externo mediante Hyperdrive.

## Preparación

1. Crear una base PostgreSQL externa y aplicar `schema.sql` con una cuenta de
   migración. El Worker debe usar después una cuenta limitada a `INSERT` sobre
   `sysvexa_service_requests`.
2. Crear la configuración Hyperdrive:

   ```sh
   npx wrangler hyperdrive create sysvexa-requests --connection-string="postgres://USUARIO:CLAVE@HOST:5432/BASE"
   ```

3. Sustituir `<HYPERDRIVE_ID>` en `wrangler.jsonc` por el identificador devuelto.
4. Crear un widget Turnstile para `sysvexatechnologies.com`, sustituir
   `<TURNSTILE_SITE_KEY>` por su clave pública y guardar el secreto sin
   escribirlo en el repositorio:

   ```sh
   npx wrangler secret put TURNSTILE_SECRET_KEY --config cloudflare/forms/wrangler.jsonc
   ```

5. Regenerar tipos, validar y desplegar:

   ```sh
   npm run worker:types
   npm run worker:check
   npm run worker:deploy
   ```

Las credenciales de PostgreSQL quedan dentro de Hyperdrive y el secreto de
Turnstile dentro de Cloudflare. El navegador solo recibe la clave pública.
Las cabeceras CSP de Caddy, Nginx y del servidor Node permiten únicamente el
script y el marco de `https://challenges.cloudflare.com` que necesita el
widget.
