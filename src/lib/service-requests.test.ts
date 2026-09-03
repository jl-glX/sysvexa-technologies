import { describe, expect, it, vi } from "vitest";
import {
  ServiceRequestError,
  submitServiceRequest,
  type ServiceRequestPayload,
} from "./service-requests";

const payload: ServiceRequestPayload = {
  name: "Javier",
  email: "javi@example.com",
  phone: "",
  service: "networks",
  details: "Necesito revisar la cobertura Wi-Fi.",
  locale: "es",
  consent: true,
  captchaToken: "turnstile-token",
  website: "",
};

describe("service request client", () => {
  it("submits the normalized JSON payload", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      Response.json(
        { submitted: true, requestId: "request-123" },
        { status: 201 },
      ),
    );
    await expect(submitServiceRequest(payload, fetcher)).resolves.toEqual({
      requestId: "request-123",
    });
    expect(fetcher).toHaveBeenCalledWith(
      "/api/service-requests",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("does not report success when the Worker rejects the request", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      Response.json({ code: "CAPTCHA_FAILED" }, { status: 403 }),
    );
    await expect(submitServiceRequest(payload, fetcher)).rejects.toEqual(
      expect.any(ServiceRequestError),
    );
  });

  it("fails closed before sending form data over public HTTP", async () => {
    const fetcher = vi.fn();
    await expect(
      submitServiceRequest(payload, fetcher, "http://sysvexatechnologies.com/"),
    ).rejects.toMatchObject({ code: "INSECURE_FORM_TRANSPORT" });
    expect(fetcher).not.toHaveBeenCalled();
  });
});
