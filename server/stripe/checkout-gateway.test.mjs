import { describe, expect, it, vi } from "vitest";
import { createCheckoutSession, verifyStripeWebhook } from "./checkout-gateway.mjs";

const configuration = {
  integrationIdentifier: "sysvexa_abcdefgh",
  prices: { maintenance: "price_maintenance" },
  publicOrigin: "https://sysvexatechnologies.com",
  webhookSecret: "whsec_example",
};

describe("Stripe Checkout gateway", () => {
  it("creates a hosted one-time Checkout session from an allowlisted Price", async () => {
    const create = vi.fn().mockResolvedValue({ id: "cs_test_example", url: "https://checkout.stripe.com/example" });
    const stripe = { checkout: { sessions: { create } } };
    await expect(createCheckoutSession({
      stripe,
      configuration,
      service: "maintenance",
      customerEmail: "cliente@example.com",
      requestId: "SYS-00001",
    })).resolves.toMatchObject({ id: "cs_test_example" });

    const [payload, options] = create.mock.calls[0];
    expect(payload).toMatchObject({
      mode: "payment",
      integration_identifier: "sysvexa_abcdefgh",
      line_items: [{ price: "price_maintenance", quantity: 1 }],
      client_reference_id: "SYS-00001",
    });
    expect(payload).not.toHaveProperty("automatic_tax");
    expect(payload).not.toHaveProperty("payment_method_types");
    expect(options).toEqual({ idempotencyKey: "sysvexa-checkout-SYS-00001" });
  });

  it("does not accept a Price selected by the browser", async () => {
    const create = vi.fn();
    await expect(createCheckoutSession({
      stripe: { checkout: { sessions: { create } } },
      configuration,
      service: "price_from_browser",
      requestId: "SYS-00002",
    })).rejects.toThrow("Unknown or unpriced");
    expect(create).not.toHaveBeenCalled();
  });

  it("verifies webhooks from the unmodified request body", () => {
    const constructEvent = vi.fn().mockReturnValue({ id: "evt_example" });
    const rawBody = Buffer.from("{\"id\":\"evt_example\"}");
    expect(verifyStripeWebhook({
      stripe: { webhooks: { constructEvent } },
      configuration,
      rawBody,
      signature: "signature",
    })).toEqual({ id: "evt_example" });
    expect(constructEvent).toHaveBeenCalledWith(rawBody, "signature", "whsec_example");
  });
});
