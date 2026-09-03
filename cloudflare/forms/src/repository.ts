import type { ServiceRequestInput } from "./validation";

export async function saveServiceRequest(
  env: Env,
  id: string,
  input: ServiceRequestInput,
): Promise<void> {
  const result = await env.DB.prepare(
    `INSERT INTO sysvexa_service_requests
      (id, name, email, phone, service, product_option, details, locale, consent_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      input.name,
      input.email,
      input.phone,
      input.service,
      input.productOption,
      input.details,
      input.locale,
      new Date().toISOString(),
    )
    .run();
  if (!result.success || result.meta.changes !== 1) {
    throw new Error("Service request was not persisted");
  }
}
