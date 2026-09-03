# Preparación de Stripe

Estado: **Payment Links activos; Checkout propio preparado y desactivado**.
La web ofrece pagos alojados por Stripe como alternativa si el formulario no
está disponible. Desde el formulario, `Enviar solicitud` solo registra el caso
y `Enviar y pagar ahora` lo registra primero y después abre el Payment Link del
producto o duración seleccionados.

## Catálogo público y pagos directos

La página publica únicamente enlaces de pago de Stripe. No contiene claves de
API ni permite que el navegador elija un `price_...` o un importe arbitrario.

| Producto | Precio | Payment Link |
| --- | ---: | --- |
| Diagnóstico y mantenimiento informático | 40 € | `https://buy.stripe.com/dRm8wH8lDf0KfxG8OO97G07` |
| Montaje completo y puesta en marcha de PC | 160 € | `https://buy.stripe.com/7sYcMXcBT5qa99i8OO97G04` |
| Mantenimiento y configuración de redes | 70 € | `https://buy.stripe.com/bJefZ96dv3i21GQaWW97G05` |
| Seguridad y protección de datos | 80 € | `https://buy.stripe.com/28E00b0Tb2dYetCc1097G06` |
| Consultoría informática y tecnológica, 30 min | 22 € | `https://book.stripe.com/6oU3cn6dv9Gq5X6aWW97G08` |
| Consultoría informática y tecnológica, 60 min | 43 € | `https://book.stripe.com/aFa9AL6dv05Q5X6aWW97G0a` |
| Consultoría informática y tecnológica, 90 min | 66 € | `https://book.stripe.com/28EdR131j7yigBK8OO97G09` |

Cada tarjeta abre un cajón de respaldo con el enlace y un QR. El QR se genera
localmente en el navegador a partir del mismo enlace, por lo que no depende de
un servicio externo ni puede quedar desactualizado respecto al botón.

Todos los destinos de pago se validan al construir el catálogo y otra vez justo
antes de navegar: deben usar HTTPS y pertenecer exactamente a
`buy.stripe.com` o `book.stripe.com`. Los enlaces no incorporan ningún dato del
formulario. El perfil completo está en
[`CIFRADO-EN-TRANSITO.md`](./CIFRADO-EN-TRANSITO.md).

El formulario guarda la solicitud antes de redirigir. La modalidad de
consultoría se representa directamente mediante `service=consulting_30`,
`service=consulting_60` o `service=consulting_90`; no se persiste una segunda
columna para la variante.

El precio libre de consultoría y el antiguo enlace que cobraba 60 minutos con
un selector meramente informativo no se publican. Las tres duraciones usan
Payment Links distintos para que el importe cobrado coincida con la opción.

### Fiscalidad pendiente

El 3 de septiembre de 2026 Stripe no devolvió registros activos de Stripe Tax
para esta cuenta. Por ese motivo, los nuevos enlaces de consultoría no activan
el cálculo automático de impuestos. Los enlaces antiguos de los otros cuatro
productos ya tenían `automatic_tax` activado en Stripe, pero esa opción no
recauda impuestos por sí sola si no existe un registro fiscal activo. Esta
configuración debe revisarse antes de considerar cerrada la parte fiscal.

Se ha adaptado la frontera de configuración de Umbravia Forge al caso de
Sysvexa. Aquí no hay suscripciones SaaS: los pagos actuales son puntuales y usan
Payment Links. La base opcional de Checkout queda reservada para una futura
integración dinámica desde el servidor.

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
