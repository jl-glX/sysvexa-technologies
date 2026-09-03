import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SOURCE_REPOSITORY_URL } from "../lib/site-links";
import { LegalPage, resolveLegalPage } from "./LegalPage";

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

  it.each(["data-protection", "privacy"] as const)(
    "documents encryption and links GitHub in the %s page footer",
    (kind) => {
      const html = renderToStaticMarkup(createElement(LegalPage, { kind }));
      expect(html).toContain("TLS 1.2");
      expect(html).toContain("AES-256");
      expect(html).toContain(`href="${SOURCE_REPOSITORY_URL}"`);
      expect(html).toContain("GitHub");
    },
  );
});
