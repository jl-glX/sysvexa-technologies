const trustedStripePaymentHosts = new Set([
  "buy.stripe.com",
  "book.stripe.com",
]);

const localDevelopmentHosts = new Set([
  "localhost",
  "127.0.0.1",
  "[::1]",
]);

declare const trustedStripePaymentUrlBrand: unique symbol;
export type TrustedStripePaymentUrl = string & {
  readonly [trustedStripePaymentUrlBrand]: true;
};

export class TransportSecurityError extends Error {
  constructor(readonly code: "INSECURE_FORM_TRANSPORT" | "UNTRUSTED_PAYMENT_URL") {
    super("Secure transport validation failed");
    this.name = "TransportSecurityError";
  }
}

export function trustedStripePaymentUrl(value: string): TrustedStripePaymentUrl {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new TransportSecurityError("UNTRUSTED_PAYMENT_URL");
  }

  if (
    url.protocol !== "https:" ||
    !trustedStripePaymentHosts.has(url.hostname.toLowerCase()) ||
    url.port ||
    url.username ||
    url.password ||
    url.hash ||
    url.pathname === "/"
  ) {
    throw new TransportSecurityError("UNTRUSTED_PAYMENT_URL");
  }

  return url.href as TrustedStripePaymentUrl;
}

export function assertSecureFormTransport(pageUrl: string | URL): void {
  const url = pageUrl instanceof URL ? pageUrl : new URL(pageUrl);
  if (
    url.protocol !== "https:" &&
    !(url.protocol === "http:" && localDevelopmentHosts.has(url.hostname))
  ) {
    throw new TransportSecurityError("INSECURE_FORM_TRANSPORT");
  }
}

export function navigateToStripePayment(
  paymentUrl: string,
  navigate: (url: string) => void = (url) => window.location.assign(url),
): void {
  navigate(trustedStripePaymentUrl(paymentUrl));
}
