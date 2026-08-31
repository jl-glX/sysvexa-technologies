const SERVICE_PRICE_VARIABLES = Object.freeze({
  maintenance: "STRIPE_PRICE_MAINTENANCE",
  computers: "STRIPE_PRICE_COMPUTERS",
  networks: "STRIPE_PRICE_NETWORKS",
  security: "STRIPE_PRICE_SECURITY",
});

function requiredValue(environment, name) {
  const value = environment[name]?.trim();
  if (!value) throw new Error(`${name} is required when Stripe Checkout is enabled`);
  return value;
}

function resolvePublicOrigin(environment, mode) {
  const configuredOrigin = requiredValue(environment, "STRIPE_PUBLIC_ORIGIN");
  let origin;
  try {
    origin = new URL(configuredOrigin).origin;
  } catch {
    throw new Error("STRIPE_PUBLIC_ORIGIN must be an absolute URL");
  }
  if (mode === "live" && !origin.startsWith("https://")) {
    throw new Error("Stripe live Checkout requires an HTTPS public origin");
  }
  return origin;
}

export function resolveStripeCheckoutConfiguration(environment = process.env) {
  if (environment.STRIPE_CHECKOUT_ENABLED !== "true") return null;

  const mode = environment.STRIPE_CHECKOUT_MODE?.trim() || "test";
  if (mode !== "test" && mode !== "live") {
    throw new Error("STRIPE_CHECKOUT_MODE must be test or live");
  }
  if (mode === "live" && environment.NODE_ENV !== "production") {
    throw new Error("Stripe live Checkout requires NODE_ENV=production");
  }

  const restrictedApiKey = requiredValue(environment, "STRIPE_RESTRICTED_API_KEY");
  const expectedKeyPrefix = mode === "live" ? "rk_live_" : "rk_test_";
  if (!restrictedApiKey.startsWith(expectedKeyPrefix)) {
    throw new Error(`STRIPE_RESTRICTED_API_KEY must be a restricted Stripe ${mode} key`);
  }

  const webhookSecret = requiredValue(environment, "STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret.startsWith("whsec_")) {
    throw new Error("STRIPE_WEBHOOK_SECRET must be a Stripe webhook secret");
  }

  const integrationIdentifier = requiredValue(environment, "STRIPE_INTEGRATION_IDENTIFIER");
  if (!/^sysvexa_[a-z]{8}$/.test(integrationIdentifier)) {
    throw new Error("STRIPE_INTEGRATION_IDENTIFIER must use sysvexa_ followed by eight lowercase letters");
  }

  const prices = Object.fromEntries(
    Object.entries(SERVICE_PRICE_VARIABLES).map(([service, variable]) => {
      const price = requiredValue(environment, variable);
      if (!price.startsWith("price_")) {
        throw new Error(`${variable} must be a Stripe Price identifier`);
      }
      return [service, price];
    }),
  );
  if (new Set(Object.values(prices)).size !== Object.values(prices).length) {
    throw new Error("Each Sysvexa service must use a different Stripe Price identifier");
  }

  return Object.freeze({
    integrationIdentifier,
    liveMode: mode === "live",
    mode,
    prices: Object.freeze(prices),
    publicOrigin: resolvePublicOrigin(environment, mode),
    restrictedApiKey,
    webhookSecret,
  });
}
