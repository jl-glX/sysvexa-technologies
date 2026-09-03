import { describe, expect, it, vi } from "vitest";
import {
  assertSecureFormTransport,
  navigateToStripePayment,
  TransportSecurityError,
  trustedStripePaymentUrl,
} from "./transport-security";

describe("transport security", () => {
  it.each([
    "https://buy.stripe.com/example",
    "https://book.stripe.com/example",
  ])("accepts a trusted hosted Stripe payment URL: %s", (url) => {
    expect(trustedStripePaymentUrl(url)).toBe(url);
  });

  it.each([
    "http://buy.stripe.com/example",
    "https://buy.stripe.com.evil.test/example",
    "https://stripe.com/example",
    "https://user@buy.stripe.com/example",
    "https://buy.stripe.com:444/example",
    "https://buy.stripe.com/example#redirect",
  ])("rejects an unsafe payment destination: %s", (url) => {
    expect(() => trustedStripePaymentUrl(url)).toThrow(
      expect.objectContaining<Partial<TransportSecurityError>>({
        code: "UNTRUSTED_PAYMENT_URL",
      }),
    );
  });

  it("allows HTTPS in production and HTTP only on loopback development hosts", () => {
    expect(() => assertSecureFormTransport("https://sysvexatechnologies.com/#request")).not.toThrow();
    expect(() => assertSecureFormTransport("http://localhost:3000/")).not.toThrow();
    expect(() => assertSecureFormTransport("http://127.0.0.1:3000/")).not.toThrow();
    expect(() => assertSecureFormTransport("http://sysvexatechnologies.com/")).toThrow(
      expect.objectContaining<Partial<TransportSecurityError>>({
        code: "INSECURE_FORM_TRANSPORT",
      }),
    );
  });

  it("validates the destination immediately before navigation", () => {
    const navigate = vi.fn();
    navigateToStripePayment("https://buy.stripe.com/example", navigate);
    expect(navigate).toHaveBeenCalledWith("https://buy.stripe.com/example");

    expect(() => navigateToStripePayment("https://example.com/phishing", navigate)).toThrow();
    expect(navigate).toHaveBeenCalledTimes(1);
  });
});
