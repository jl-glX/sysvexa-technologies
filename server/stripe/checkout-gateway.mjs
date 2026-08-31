import Stripe from "stripe";

const API_VERSION = "2026-07-29.dahlia";

export function createStripeClient(configuration) {
  if (!configuration) throw new Error("Stripe Checkout is disabled");
  return new Stripe(configuration.restrictedApiKey, {
    apiVersion: API_VERSION,
    maxNetworkRetries: 2,
  });
}

export async function createCheckoutSession({ stripe, configuration, service, customerEmail, requestId }) {
  if (!configuration) throw new Error("Stripe Checkout is disabled");
  const price = configuration.prices[service];
  if (!price) throw new Error("Unknown or unpriced Sysvexa service");
  if (!requestId?.trim()) throw new Error("A request identifier is required");

  return stripe.checkout.sessions.create({
    cancel_url: `${configuration.publicOrigin}/?checkout=cancelled`,
    client_reference_id: requestId,
    customer_email: customerEmail || undefined,
    integration_identifier: configuration.integrationIdentifier,
    line_items: [{ price, quantity: 1 }],
    metadata: { requestId, service },
    mode: "payment",
    success_url: `${configuration.publicOrigin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
  }, {
    idempotencyKey: `sysvexa-checkout-${requestId}`,
  });
}

export function verifyStripeWebhook({ stripe, configuration, rawBody, signature }) {
  if (!configuration) throw new Error("Stripe Checkout is disabled");
  if (!signature) throw new Error("Missing Stripe-Signature header");
  return stripe.webhooks.constructEvent(rawBody, signature, configuration.webhookSecret);
}
