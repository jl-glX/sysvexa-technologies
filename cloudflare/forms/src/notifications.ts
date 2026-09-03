export interface ServiceRequestNotification {
  requestId: string;
  service: string;
  productOption: string | null;
  createdAt: string;
}

export function buildServiceRequestNotification(
  env: Env,
  notification: ServiceRequestNotification,
): EmailMessageBuilder {
  return {
    from: {
      name: "Sysvexa Technologies",
      email: env.NOTIFICATION_FROM,
    },
    to: env.NOTIFICATION_TO,
    subject: "Nueva solicitud de servicio en Sysvexa",
    text: [
      "Se ha recibido y guardado una nueva solicitud en Sysvexa Technologies.",
      "",
      `Identificador: ${notification.requestId}`,
      `Servicio: ${notification.service}`,
      ...(notification.productOption ? [`Modalidad: ${notification.productOption}`] : []),
      `Fecha UTC: ${notification.createdAt}`,
      "",
      "Consulta los datos de contacto y la descripción en Cloudflare D1.",
      "Base: sysvexa-service-requests",
      "Tabla: sysvexa_service_requests",
    ].join("\n"),
  };
}

export async function sendServiceRequestNotification(
  env: Env,
  notification: ServiceRequestNotification,
): Promise<void> {
  await env.SERVICE_REQUEST_NOTIFICATIONS.send(
    buildServiceRequestNotification(env, notification),
  );
}
