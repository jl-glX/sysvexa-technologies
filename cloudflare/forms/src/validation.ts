export const serviceKeys = [
  "maintenance",
  "computers",
  "networks",
  "security",
  "consulting",
] as const;

export type ServiceKey = (typeof serviceKeys)[number];

export const consultingOptionKeys = [
  "consulting_30",
  "consulting_60",
  "consulting_90",
] as const;

export type ConsultingOptionKey = (typeof consultingOptionKeys)[number];

export interface ServiceRequestInput {
  name: string;
  email: string;
  phone: string | null;
  service: ServiceKey;
  productOption: ConsultingOptionKey | null;
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
  const service = requiredString(body.service, "service", 1, 32);
  if (!serviceKeys.includes(service as ServiceKey)) {
    throw new ServiceRequestValidationError("service is invalid");
  }
  const productOptionValue = typeof body.productOption === "string"
    ? body.productOption.trim()
    : "";
  const productOption = productOptionValue || null;
  if (service === "consulting") {
    if (!productOption || !consultingOptionKeys.includes(productOption as ConsultingOptionKey)) {
      throw new ServiceRequestValidationError("productOption is invalid");
    }
  } else if (productOption) {
    throw new ServiceRequestValidationError("productOption is only valid for consulting");
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
    service: service as ServiceKey,
    productOption: productOption as ConsultingOptionKey | null,
    details,
    locale,
    consent: true,
    captchaToken,
  };
}
