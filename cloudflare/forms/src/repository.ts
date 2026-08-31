import { Client } from "pg";
import type { ServiceRequestInput } from "./validation";

export async function saveServiceRequest(
  env: Env,
  id: string,
  input: ServiceRequestInput,
): Promise<void> {
  const client = new Client({
    connectionString: env.HYPERDRIVE.connectionString,
  });
  await client.connect();
  try {
    await client.query(
      `INSERT INTO sysvexa_service_requests
        (id, name, email, phone, service, details, locale, consent_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, now())`,
      [
        id,
        input.name,
        input.email,
        input.phone,
        input.service,
        input.details,
        input.locale,
      ],
    );
  } finally {
    await client.end();
  }
}
