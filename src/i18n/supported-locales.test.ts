import { describe, expect, it } from "vitest";
import { canonicalizeLocale, resolveIntlLocale } from "./supported-locales";

describe("browser locale detection", () => {
  it.each([
    ["es-ES", "es"], ["gl-ES", "gl"], ["ca-ES", "ca"],
    ["ca-ES-valencia", "ca-valencia"], ["oc-ES-aranes", "oc-aranes"],
    ["fr-CA", "fr"], ["en-GB", "en-US"], ["de-AT", "de"], ["it-CH", "it"],
  ])("maps %s to %s", (input, expected) => {
    expect(canonicalizeLocale(input)).toBe(expected);
  });

  it("uses US English for an unsupported browser language", () => {
    expect(canonicalizeLocale("ja-JP")).toBe("en-US");
  });

  it("keeps Spanish as the base when no browser preference exists", () => {
    expect(canonicalizeLocale(undefined)).toBe("es");
  });

  it("uses the requested US formatting locale", () => {
    expect(resolveIntlLocale("en-GB")).toBe("en-US");
  });
});
