import { describe, expect, it, vi } from "vitest";
import { verifyTurnstile } from "./turnstile";

const allowedHostnames = new Set(["sysvexatechnologies.com"]);

describe("Turnstile verification", () => {
  it("accepts only the service request action on the trusted hostname", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      Response.json({
        success: true,
        action: "service_request",
        hostname: "sysvexatechnologies.com",
      }),
    );
    await expect(
      verifyTurnstile({
        token: "token",
        secret: "secret",
        remoteIp: "192.0.2.1",
        allowedHostnames,
        fetcher,
      }),
    ).resolves.toEqual({ success: true, reason: "verified" });
  });

  it("rejects action and hostname mismatches", async () => {
    const wrongAction = vi.fn().mockResolvedValue(
      Response.json({
        success: true,
        action: "login",
        hostname: "sysvexatechnologies.com",
      }),
    );
    const wrongHostname = vi.fn().mockResolvedValue(
      Response.json({
        success: true,
        action: "service_request",
        hostname: "example.com",
      }),
    );
    await expect(
      verifyTurnstile({
        token: "token",
        secret: "secret",
        remoteIp: null,
        allowedHostnames,
        fetcher: wrongAction,
      }),
    ).resolves.toMatchObject({ success: false, reason: "action_mismatch" });
    await expect(
      verifyTurnstile({
        token: "token",
        secret: "secret",
        remoteIp: null,
        allowedHostnames,
        fetcher: wrongHostname,
      }),
    ).resolves.toMatchObject({ success: false, reason: "hostname_mismatch" });
  });

  it("fails closed when the secret or provider is unavailable", async () => {
    await expect(
      verifyTurnstile({
        token: "token",
        secret: "<TURNSTILE_SECRET_KEY>",
        remoteIp: null,
        allowedHostnames,
      }),
    ).resolves.toMatchObject({ success: false, reason: "not_configured" });
    await expect(
      verifyTurnstile({
        token: "token",
        secret: "secret",
        remoteIp: null,
        allowedHostnames,
        fetcher: vi.fn().mockRejectedValue(new Error("offline")),
      }),
    ).resolves.toMatchObject({
      success: false,
      reason: "provider_unavailable",
    });
  });
});
