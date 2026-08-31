import { describe, expect, it } from "vitest";
import {
  parseServiceRequest,
  ServiceRequestValidationError,
} from "./validation";

const validRequest = {
  name: "Javier",
  email: "javi@example.com",
  phone: "+34 600 000 000",
  service: "maintenance",
  details: "El equipo se apaga de forma inesperada.",
  locale: "es",
  consent: true,
  captchaToken: "verified-token",
  website: "",
};

describe("service request validation", () => {
  it("normalizes a valid public request", () => {
    expect(parseServiceRequest(validRequest)).toMatchObject({
      email: "javi@example.com",
      service: "maintenance",
      consent: true,
    });
  });

  it("rejects honeypot submissions", () => {
    expect(() =>
      parseServiceRequest({ ...validRequest, website: "https://spam.test" }),
    ).toThrow(ServiceRequestValidationError);
  });

  it("rejects unknown fields and invalid services", () => {
    expect(() =>
      parseServiceRequest({ ...validRequest, administrator: true }),
    ).toThrow(ServiceRequestValidationError);
    expect(() =>
      parseServiceRequest({ ...validRequest, service: "unknown" }),
    ).toThrow(ServiceRequestValidationError);
  });

  it("requires explicit consent and a captcha token", () => {
    expect(() =>
      parseServiceRequest({ ...validRequest, consent: false }),
    ).toThrow(ServiceRequestValidationError);
    expect(() =>
      parseServiceRequest({ ...validRequest, captchaToken: "" }),
    ).toThrow(ServiceRequestValidationError);
  });
});
