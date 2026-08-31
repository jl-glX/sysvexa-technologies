const siteverifyUrl =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface TurnstileResponse {
  success?: boolean;
  hostname?: string;
  action?: string;
}

export type TurnstileVerificationReason =
  | "verified"
  | "not_configured"
  | "provider_unavailable"
  | "provider_rejected"
  | "action_mismatch"
  | "hostname_mismatch";

export interface TurnstileVerificationResult {
  success: boolean;
  reason: TurnstileVerificationReason;
}

export async function verifyTurnstile(options: {
  token: string;
  secret: string;
  remoteIp: string | null;
  allowedHostnames: ReadonlySet<string>;
  fetcher?: typeof fetch;
}): Promise<TurnstileVerificationResult> {
  const secret = options.secret.trim();
  if (!secret || secret.startsWith("<")) {
    return { success: false, reason: "not_configured" };
  }

  const body = new FormData();
  body.set("secret", secret);
  body.set("response", options.token);
  body.set("idempotency_key", crypto.randomUUID());
  if (options.remoteIp) body.set("remoteip", options.remoteIp);

  try {
    const response = await (options.fetcher ?? fetch)(siteverifyUrl, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) {
      return { success: false, reason: "provider_unavailable" };
    }
    const result: TurnstileResponse = await response.json();
    if (!result.success) {
      return { success: false, reason: "provider_rejected" };
    }
    if (result.action !== "service_request") {
      return { success: false, reason: "action_mismatch" };
    }
    const hostname = result.hostname?.trim().toLowerCase();
    if (!hostname || !options.allowedHostnames.has(hostname)) {
      return { success: false, reason: "hostname_mismatch" };
    }
    return { success: true, reason: "verified" };
  } catch {
    return { success: false, reason: "provider_unavailable" };
  }
}
