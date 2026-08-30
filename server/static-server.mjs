import { createReadStream } from "node:fs";
import { access, stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MIME_TYPES = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"],
  [".webmanifest", "application/manifest+json"],
  [".webp", "image/webp"],
]);

const HASHED_ASSET = /[.-][A-Za-z0-9_-]{8,}\.[^./]+$/;

export function cacheControlFor(filePath) {
  if (path.extname(filePath).toLowerCase() === ".html") return "no-store";
  if (HASHED_ASSET.test(path.basename(filePath))) {
    return "public, max-age=31536000, immutable";
  }
  return "public, max-age=3600";
}

export function resolveRequestPath(rootDirectory, requestUrl) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(requestUrl, "http://localhost").pathname);
  } catch {
    return null;
  }

  const root = path.resolve(rootDirectory);
  const candidate = path.resolve(root, pathname.replace(/^[/\\]+/, ""));
  const safePrefix = `${root}${path.sep}`;
  if (candidate !== root && !candidate.startsWith(safePrefix)) return null;
  return candidate;
}

function applySecurityHeaders(response) {
  response.setHeader("Content-Security-Policy", "default-src 'self'; base-uri 'self'; connect-src 'self'; font-src 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data:; object-src 'none'; script-src 'self'; style-src 'self'");
  response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
}

async function existingFile(filePath) {
  try {
    const fileStat = await stat(filePath);
    return fileStat.isFile() ? fileStat : null;
  } catch {
    return null;
  }
}

function sendFile(request, response, filePath, fileStat) {
  response.statusCode = 200;
  response.setHeader("Cache-Control", cacheControlFor(filePath));
  response.setHeader("Content-Length", fileStat.size);
  response.setHeader("Content-Type", MIME_TYPES.get(path.extname(filePath).toLowerCase()) ?? "application/octet-stream");
  if (request.method === "HEAD") {
    response.end();
    return;
  }
  createReadStream(filePath).pipe(response);
}

export function createStaticServer({ rootDirectory }) {
  const root = path.resolve(rootDirectory);
  const indexPath = path.join(root, "index.html");

  return createServer(async (request, response) => {
    applySecurityHeaders(response);

    if (request.method !== "GET" && request.method !== "HEAD") {
      response.statusCode = 405;
      response.setHeader("Allow", "GET, HEAD");
      response.end("Method not allowed");
      return;
    }

    const requestedPath = resolveRequestPath(root, request.url ?? "/");
    if (!requestedPath) {
      response.statusCode = 400;
      response.end("Bad request");
      return;
    }

    const requestedFile = await existingFile(requestedPath);
    if (requestedFile) {
      sendFile(request, response, requestedPath, requestedFile);
      return;
    }

    const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
    if (pathname === "/api" || pathname.startsWith("/api/")) {
      response.statusCode = 404;
      response.setHeader("Content-Type", "application/json; charset=utf-8");
      response.end(JSON.stringify({ error: "Not found" }));
      return;
    }

    const indexFile = await existingFile(indexPath);
    if (!indexFile) {
      response.statusCode = 503;
      response.end("Production build not found. Run npm run build first.");
      return;
    }
    sendFile(request, response, indexPath, indexFile);
  });
}

function configuredPort(value) {
  const port = Number.parseInt(value ?? "3000", 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }
  return port;
}

export async function startProductionServer({
  rootDirectory = path.join(process.cwd(), "dist"),
  host = process.env.HOST ?? "0.0.0.0",
  port = configuredPort(process.env.PORT),
} = {}) {
  await access(path.join(rootDirectory, "index.html"));
  const server = createStaticServer({ rootDirectory });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, resolve);
  });
  return server;
}

const isEntrypoint = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isEntrypoint) {
  const server = await startProductionServer();
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : configuredPort(process.env.PORT);
  console.log(`Sysvexa Technologies listening on http://${process.env.HOST ?? "0.0.0.0"}:${port}`);

  const shutdown = () => server.close(() => process.exit(0));
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}
