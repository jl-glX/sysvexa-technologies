# Preparación de Stripe

Estado: **preparado y desactivado**. La web no cobra ni envía el formulario a
Stripe en esta fase.

Se ha adaptado la frontera de configuración de Umbravia Forge al caso de
Sysvexa. Aquí no hay suscripciones SaaS: el diseño previsto usa Checkout alojado
por Stripe y pagos puntuales de servicios.

## Controles ya implementados

- Stripe permanece cerrado salvo `STRIPE_CHECKOUT_ENABLED=true`.
- Solo se admiten claves restringidas coherentes con Test o Live.
- Live exige producción y origen HTTPS.
- Los Price se eligen en el servidor mediante una lista permitida por servicio;
  el navegador nunca proporciona un Price arbitrario.
- La creación de Checkout es idempotente por solicitud.
- No se fuerza una lista de métodos de pago ni se activa Stripe Tax sin haber
  configurado antes las obligaciones fiscales.
- La firma del webhook se comprueba con el cuerpo HTTP original sin modificar.
- Ninguna clave o secreto se versiona ni se entrega al frontend.

## Lo que falta antes de activar cobros

1. Definir qué servicios se pueden pagar en línea y en qué momento del proceso.
2. Crear Products y Prices primero en Stripe Test.
3. Guardar la clave restringida y el secreto del webhook fuera del repositorio.
4. Añadir rutas autenticadas para crear Checkout y recibir webhooks.
5. Persistir y deduplicar los eventos antes de vincular el pago a una solicitud.
6. Probar éxito, cancelación, reintentos y eventos fuera de orden.

La configuración de Stripe es independiente de Caddy o Nginx. El servidor web
solo publica la aplicación y, cuando exista la API, encaminará sus rutas.
