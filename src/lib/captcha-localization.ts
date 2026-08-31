import { canonicalizeLocale } from "../i18n/supported-locales";

const turnstileLanguages = {
  es: "es",
  gl: "es",
  ca: "ca",
  "oc-aranes": "es",
  "ca-valencia": "ca",
  fr: "fr",
  "en-US": "en",
  de: "de",
  it: "it",
} as const;

export function turnstileLanguage(locale?: string | null): string {
  return turnstileLanguages[canonicalizeLocale(locale)];
}
