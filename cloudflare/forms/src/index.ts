import { saveServiceRequest } from "./repository";
import { sendServiceRequestNotification } from "./notifications";
import { verifyTurnstile } from "./turnstile";
import {
  parseServiceRequest,
  ServiceRequestValidationError,
} from "./validation";

const maxBodyBytes = 16 * 1024;

function json(payload: object, status = 200): Response {
  return Response.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function allowedHostnames(env: Env): Set<string> {
  return new Set(
    env.ALLOWED_HOSTNAMES.split(",")
      .map((hostname) => hostname.trim().toLowerCase())
      .filter(Boolean),
  );
}

function requestOriginIsAllowed(request: Request, hostnames: Set<string>): boolean {
  const origin = request.headers.get("Origin");
  if (!origin) return false;
  try {
    const url = new URL(origin);
    return url.protocol === "https:" && hostnames.has(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

async function readBoundedJson(request: Request): Promise<unknown> {
  const declaredLength = Number(request.headers.get("Content-Length") ?? 0);
  if (declaredLength > maxBodyBytes) {
    throw new ServiceRequestValidationError("Request body is too large");
  }
  if (!request.body) {
    throw new ServiceRequestValidationError("Request body is required");
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBodyBytes) {
      await reader.cancel("Request body is too large");
      throw new ServiceRequestValidationError("Request body is too large");
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new ServiceRequestValidationError("Request body must be valid JSON");
  }
}

async function handleRequest(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  const url = new URL(request.url);
  const hostnames = allowedHostnames(env);

  if (
    request.method === "GET" &&
    url.pathname === "/api/service-requests/captcha-config"
  ) {
    const siteKey = env.TURNSTILE_SITE_KEY.trim();
    return json({
      available: Boolean(siteKey && !siteKey.startsWith("<")),
      siteKey: siteKey && !siteKey.startsWith("<") ? siteKey : null,
    });
  }

  if (url.pathname !== "/api/service-requests") {
    return json({ code: "NOT_FOUND" }, 404);
  }
  if (request.method !== "POST") {
    return json({ code: "METHOD_NOT_ALLOWED" }, 405);
  }
  if (!requestOriginIsAllowed(request, hostnames)) {
    return json({ code: "ORIGIN_NOT_ALLOWED" }, 403);
  }
  if (!request.headers.get("Content-Type")?.startsWith("application/json")) {
    return json({ code: "UNSUPPORTED_MEDIA_TYPE" }, 415);
  }

  const input = parseServiceRequest(await readBoundedJson(request));
  const verification = await verifyTurnstile({
    token: input.captchaToken,
    secret: env.TURNSTILE_SECRET_KEY,
    allowedHostnames: hostnames,
  });
  if (!verification.success) {
    console.warn(
      JSON.stringify({
        event: "service_request_captcha_rejected",
        reason: verification.reason,
        detail: verification.detail,
      }),
    );
    const status = verification.reason === "not_configured" ? 503 : 403;
    return json({ code: "CAPTCHA_FAILED" }, status);
  }

  const requestId = crypto.randomUUID();
  await saveServiceRequest(env, requestId, input);
  ctx.waitUntil(
    sendServiceRequestNotification(env, {
      requestId,
      service: input.service,
      productOption: input.productOption,
      createdAt: new Date().toISOString(),
    }).catch((error) => {
      console.error(
        JSON.stringify({
          event: "service_request_notification_failed",
          requestId,
          message: error instanceof Error ? error.message : "Unknown error",
        }),
      );
    }),
  );
  console.log(
    JSON.stringify({ event: "service_request_created", requestId }),
  );
  return json({ submitted: true, requestId }, 201);
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    try {
      return await handleRequest(request, env, ctx);
    } catch (error) {
      if (error instanceof ServiceRequestValidationError) {
        return json({ code: error.code }, 400);
      }
      console.error(
        JSON.stringify({
          event: "service_request_failed",
          message: error instanceof Error ? error.message : "Unknown error",
        }),
      );
      return json({ code: "INTERNAL_ERROR" }, 500);
    }
  },
} satisfies ExportedHandler<Env>;
