# Despliegue portable

La release de Sysvexa es exclusivamente el contenido de `dist/`. Se publica en
`/var/www/sysvexa/releases/<id>` y el enlace
`/var/www/sysvexa/current` selecciona la versión activa. Tanto Caddy como Nginx
leen ese mismo enlace, por lo que cambiar de servidor web no modifica ni
recompila la aplicación.

## Caddy (implementación actual)

1. Instalar Caddy desde su repositorio oficial para Ubuntu.
2. Copiar `deploy/Caddyfile` a `/etc/caddy/Caddyfile`.
3. Validar la configuración y recargar el servicio.

Caddy solicita y renueva automáticamente los certificados públicos de los dos
dominios. Los puertos TCP 80 y 443 deben estar abiertos en Lightsail.

## Alternativa Nginx

`deploy/nginx.conf` reproduce la misma raíz, fallback SPA, caché y cabeceras.
Antes de activarlo hay que instalar certificados públicos válidos en las rutas
indicadas, validar con `nginx -t`, detener Caddy y arrancar Nginx. Cloudflare
puede permanecer en modo Full (strict) porque el certificado del origen sigue
siendo válido.

## Publicar o revertir

La construcción se hace fuera del servidor web:

```sh
npm ci
npm run build
sudo deploy/activate-release.sh dist <commit-o-version>
```

Para revertir no se alteran los archivos de una release: se cambia de forma
atómica el enlace `current` a una release anterior ya verificada y se comprueba
la URL pública.
