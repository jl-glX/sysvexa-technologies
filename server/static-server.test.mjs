import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { cacheControlFor, createStaticServer, resolveRequestPath } from "./static-server.mjs";

const temporaryDirectories = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), "sysvexa-static-"));
  temporaryDirectories.push(root);
  await mkdir(path.join(root, "assets"));
  await writeFile(path.join(root, "index.html"), "<!doctype html><title>Sysvexa</title>");
  await writeFile(path.join(root, "assets", "index-AbCd1234.js"), "console.log('ok')");
  return root;
}

async function listeningServer(rootDirectory) {
  const server = createStaticServer({ rootDirectory });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Expected a TCP address");
  return { server, origin: `http://127.0.0.1:${address.port}` };
}

describe("production static server", () => {
  it("applies immutable caching only to hashed assets", () => {
    expect(cacheControlFor("/dist/assets/index-AbCd1234.js")).toBe("public, max-age=31536000, immutable");
    expect(cacheControlFor("/dist/index.html")).toBe("no-store");
  });

  it("keeps resolved paths inside the build directory", () => {
    const root = path.resolve("dist");
    expect(resolveRequestPath(root, "/assets/app.js")).toBe(path.join(root, "assets", "app.js"));
    expect(resolveRequestPath(root, "/../../outside.txt")).toBe(path.join(root, "outside.txt"));
    expect(resolveRequestPath(root, "/%E0%A4%A")).toBeNull();
  });

  it("serves assets, SPA routes and secure headers", async () => {
    const root = await fixture();
    const { server, origin } = await listeningServer(root);
    try {
      const asset = await fetch(`${origin}/assets/index-AbCd1234.js`);
      expect(asset.status).toBe(200);
      expect(asset.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");

      const route = await fetch(`${origin}/solicitudes/nueva`);
      expect(route.status).toBe(200);
      expect(await route.text()).toContain("Sysvexa");
      expect(route.headers.get("content-security-policy")).toContain("default-src 'self'");

      const api = await fetch(`${origin}/api/unknown`);
      expect(api.status).toBe(404);
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
