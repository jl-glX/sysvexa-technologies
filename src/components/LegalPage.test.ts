import { describe, expect, it } from "vitest";
import { resolveLegalPage } from "./LegalPage";

describe("legal page routing", () => {
  it.each([
    ["/proteccion-de-datos", "data-protection"],
    ["/proteccion-de-datos/", "data-protection"],
    ["/politica-de-privacidad", "privacy"],
    ["/politica-de-privacidad/", "privacy"],
  ])("resolves %s", (pathname, expected) => {
    expect(resolveLegalPage(pathname)).toBe(expected);
  });

  it("leaves the main site and unknown paths untouched", () => {
    expect(resolveLegalPage("/")).toBeNull();
    expect(resolveLegalPage("/services")).toBeNull();
  });
});
