import { describe, expect, it } from "vitest";
import caValencia from "./locales/ca-valencia.json";
import ca from "./locales/ca.json";
import de from "./locales/de.json";
import enUS from "./locales/en-US.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import gl from "./locales/gl.json";
import italian from "./locales/it.json";
import ocAranes from "./locales/oc-aranes.json";

function keys(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object") return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    keys(child, prefix ? `${prefix}.${key}` : key),
  );
}

const fullCatalogs = { es, gl, ca, "oc-aranes": ocAranes, fr, "en-US": enUS, de, it: italian };

describe("translation catalogs", () => {
  const canonicalKeys = keys(es).sort();

  it.each(Object.entries(fullCatalogs))("keeps full key parity for %s", (_locale, catalog) => {
    expect(keys(catalog).sort()).toEqual(canonicalKeys);
  });

  it("keeps Valencian as a strict regional override of Catalan", () => {
    const catalanKeys = new Set(keys(ca));
    expect(keys(caValencia).every((key) => catalanKeys.has(key))).toBe(true);
  });
});
