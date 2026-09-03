import { describe, expect, it } from "vitest";
import { requestUsesSecureTransport } from "./index";

describe("Worker transport security", () => {
  it("accepts HTTPS and loopback development requests", () => {
    expect(requestUsesSecureTransport(new Request("https://forms.sysvexatechnologies.com/api/service-requests"))).toBe(true);
    expect(requestUsesSecureTransport(new Request("http://localhost:8787/api/service-requests"))).toBe(true);
  });

  it("rejects public plaintext requests", () => {
    expect(requestUsesSecureTransport(new Request("http://forms.sysvexatechnologies.com/api/service-requests"))).toBe(false);
  });
});
