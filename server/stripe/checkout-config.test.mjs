import { describe, expect, it } from "vitest";
import { resolveStripeCheckoutConfiguration } from "./checkout-config.mjs";

const configuredEnvironment = {
  STRIPE_CHECKOUT_ENABLED: "true",
  STRIPE_CHECKOUT_MODE: "test",
  STRIPE_RESTRICTED_API_KEY: "rk_test_example",
  STRIPE_WEBHOOK_SECRET: "whsec_example",
  STRIPE_PUBLIC_ORIGIN: "http://localhost:3000/path-is-ignored",
  STRIPE_INTEGRATION_IDENTIFIER: "sysvexa_abcdefgh",
  STRIPE_PRICE_MAINTENANCE: "price_maintenance",
  STRIPE_PRICE_COMPUTERS: "price_computers",
  STRIPE_PRICE_NETWORKS: "price_networks",
  STRIPE_PRICE_SECURITY: "price_security",
};

describe("Stripe Checkout configuration", () => {
  it("is closed unless explicitly enabled", () => {
    expect(resolveStripeCheckoutConfiguration({})).toBeNull();
  });

  it("accepts a complete restricted test configuration", () => {
    expect(resolveStripeCheckoutConfiguration(configuredEnvironment)).toMatchObject({
      mode: "test",
      liveMode: false,
      publicOrigin: "http://localhost:3000",
      prices: {
        maintenance: "price_maintenance",
        computers: "price_computers",
        networks: "price_networks",
        security: "price_security",
      },
    });
  });

  it("rejects unrestricted keys and repeated Prices", () => {
    expect(() => resolveStripeCheckoutConfiguration({
      ...configuredEnvironment,
      STRIPE_RESTRICTED_API_KEY: "sk_test_example",
    })).toThrow("restricted Stripe test key");
    expect(() => resolveStripeCheckoutConfiguration({
      ...configuredEnvironment,
      STRIPE_PRICE_SECURITY: "price_networks",
    })).toThrow("different Stripe Price");
  });

  it("requires production HTTPS before accepting live mode", () => {
    const liveEnvironment = {
      ...configuredEnvironment,
      STRIPE_CHECKOUT_MODE: "live",
      STRIPE_RESTRICTED_API_KEY: "rk_live_example",
    };
    expect(() => resolveStripeCheckoutConfiguration(liveEnvironment)).toThrow("NODE_ENV=production");
    expect(() => resolveStripeCheckoutConfiguration({
      ...liveEnvironment,
      NODE_ENV: "production",
    })).toThrow("HTTPS public origin");
    expect(resolveStripeCheckoutConfiguration({
      ...liveEnvironment,
      NODE_ENV: "production",
      STRIPE_PUBLIC_ORIGIN: "https://sysvexatechnologies.com",
    })).toMatchObject({ mode: "live", liveMode: true });
  });
});
