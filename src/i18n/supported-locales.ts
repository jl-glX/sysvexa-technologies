export const supportedLocales = [
  "es",
  "gl",
  "ca",
  "oc-aranes",
  "ca-valencia",
  "fr",
  "en-US",
  "de",
  "it",
] as const;

export type SupportedLocale = (typeof supportedLocales)[number];

export const regionalLocaleFallbacks = {
  "ca-valencia": "ca",
} as const satisfies Partial<Record<SupportedLocale, SupportedLocale>>;

const exactLocales = new Map(
  supportedLocales.map((locale) => [locale.toLowerCase(), locale]),
);

const intlLocales: Record<SupportedLocale, string> = {
  es: "es-ES",
  gl: "gl-ES",
  ca: "ca-ES",
  "oc-aranes": "oc-ES",
  "ca-valencia": "ca-ES-valencia",
  fr: "fr-FR",
  "en-US": "en-US",
  de: "de-DE",
  it: "it-IT",
};

export function canonicalizeLocale(value?: string | null): SupportedLocale {
  const normalized = value?.trim().replaceAll("_", "-");
  if (!normalized) return "es";

  let canonical: string;
  try {
    [canonical] = Intl.getCanonicalLocales(normalized);
  } catch {
    return "es";
  }

  const lower = canonical.toLowerCase();
  const exact = exactLocales.get(lower);
  if (exact) return exact;
  if (lower === "en" || lower.startsWith("en-")) return "en-US";
  if (lower === "ca-es-valencia" || lower === "ca-valencia") return "ca-valencia";
  if (lower === "oc-es-aranes" || lower === "oc-aranes") return "oc-aranes";

  const base = lower.split("-")[0];
  return exactLocales.get(base) ?? "en-US";
}

export function resolveIntlLocale(value?: string | null): string {
  return intlLocales[canonicalizeLocale(value)];
}
