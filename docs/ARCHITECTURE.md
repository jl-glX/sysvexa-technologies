# Arquitectura evolutiva

Sysvexa empieza como una web estática deliberadamente pequeña. La instancia de
Lightsail publica únicamente los archivos compilados mediante Caddy; no ejecuta
una API, una base de datos ni un proceso Node permanente.

## Estado actual

```text
Navegador -> Cloudflare -> Caddy en Lightsail -> release estatica actual
```

- Caddy termina HTTPS en el origen y sirve `/var/www/sysvexa/current`.
- Cada versión es inmutable y el enlace `current` permite activación y reversión.
- Nginx puede sustituir a Caddy sirviendo exactamente el mismo enlace.
- El formulario actual es una demostración de interfaz: todavía no transmite ni
  persiste datos.
- Stripe está preparado y desactivado; no hay secretos en la web estática.

## Primera ampliación con datos

Cuando se active la recepción real de solicitudes se añadirá una API pequeña en
Cloudflare Workers y una base D1 enlazada al Worker:

```text
Web estatica -> Worker API -> D1
                     |
                     +-> Stripe Checkout y webhook, cuando se autorice
```

D1 es la opción prevista para solicitudes, estados e identificadores de pago:
datos relacionales pequeños que no justifican administrar PostgreSQL o MySQL.
El acceso se hará mediante un binding del Worker, no exponiendo credenciales de
base de datos al navegador.

R2 se añadirá únicamente si las solicitudes admiten fotografías o informes. No
se deben guardar archivos binarios en D1. KV o Durable Objects tampoco forman
parte de la primera ampliación; se introducirán solo cuando exista un requisito
concreto de caché, sesiones o coordinación consistente.

Referencias de diseño:

- [Opciones de almacenamiento de Workers](https://developers.cloudflare.com/workers/platform/storage-options/)
- [Bindings del runtime de Workers](https://developers.cloudflare.com/workers/runtime-apis/bindings/)

## Límites de responsabilidad

- Lightsail no almacena datos de clientes ni claves de Stripe.
- El Worker valida entrada, consentimiento, límites y autenticación antes de D1.
- D1 persiste solicitudes y eventos deduplicados; las migraciones se versionan.
- Los secretos de Stripe viven en el entorno del Worker.
- El webhook verifica la firma sobre el cuerpo original antes de escribir.
- Caddy y Nginx solo publican la web; cambiar entre ambos no altera la API ni D1.

Esta separación permite crecer sin rehacer la web, pero evita desplegar hoy una
infraestructura que todavía no aporta valor.
