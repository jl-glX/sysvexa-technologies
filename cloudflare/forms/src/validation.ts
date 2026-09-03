export const serviceKeys = [
  "maintenance",
  "computers",
  "networks",
  "security",
  "consulting_30",
  "consulting_60",
  "consulting_90",
] as const;

export type ServiceKey = (typeof serviceKeys)[number];

const legacyConsultingKeys = [
  "consulting_30",
  "consulting_60",
  "consulting_90",
] as const satisfies readonly ServiceKey[];

export interface ServiceRequestInput {
  name: string;
  email: string;
  phone: string | null;
  service: ServiceKey;
  details: string;
  locale: string;
  consent: true;
  captchaToken: string;
}

export class ServiceRequestValidationError extends Error {
  readonly code = "INVALID_REQUEST";
}

const allowedFields = new Set([
  "name",
  "email",
  "phone",
  "service",
  "productOption",
  "details",
  "locale",
  "consent",
  "captchaToken",
  "website",
]);

function requiredString(
  value: unknown,
  field: string,
  minimum: number,
  maximum: number,
): string {
  if (typeof value !== "string") {
    throw new ServiceRequestValidationError(`${field} is required`);
  }
  const normalized = value.trim();
  if (normalized.length < minimum || normalized.length > maximum) {
    throw new ServiceRequestValidationError(`${field} has an invalid length`);
  }
  return normalized;
}

export function parseServiceRequest(value: unknown): ServiceRequestInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ServiceRequestValidationError("A JSON object is required");
  }
  const body = value as Record<string, unknown>;
  const unknownFields = Object.keys(body).filter(
    (field) => !allowedFields.has(field),
  );
  if (unknownFields.length > 0) {
    throw new ServiceRequestValidationError("Unknown fields are not allowed");
  }
  if (typeof body.website === "string" && body.website.trim()) {
    throw new ServiceRequestValidationError("Automated submission rejected");
  }

  const name = requiredString(body.name, "name", 2, 100);
  const email = requiredString(body.email, "email", 3, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ServiceRequestValidationError("email is invalid");
  }
  const phoneValue = typeof body.phone === "string" ? body.phone.trim() : "";
  if (phoneValue.length > 40) {
    throw new ServiceRequestValidationError("phone has an invalid length");
  }
  const serviceValue = requiredString(body.service, "service", 1, 32);
  const legacyOption = typeof body.productOption === "string"
    ? body.productOption.trim()
    : "";
  let service: ServiceKey;
  if (serviceValue === "consulting") {
    if (!legacyConsultingKeys.includes(
      legacyOption as (typeof legacyConsultingKeys)[number],
    )) {
      throw new ServiceRequestValidationError("service is invalid");
    }
    service = legacyOption as ServiceKey;
  } else {
    if (!serviceKeys.includes(serviceValue as ServiceKey) || legacyOption) {
      throw new ServiceRequestValidationError("service is invalid");
    }
    service = serviceValue as ServiceKey;
  }
  const details = requiredString(body.details, "details", 10, 4000);
  const locale = requiredString(body.locale, "locale", 2, 20);
  const captchaToken = requiredString(
    body.captchaToken,
    "captchaToken",
    1,
    2048,
  );
  if (body.consent !== true) {
    throw new ServiceRequestValidationError("consent is required");
  }

  return {
    name,
    email,
    phone: phoneValue || null,
    service,
    details,
    locale,
    consent: true,
    captchaToken,
  };
}
