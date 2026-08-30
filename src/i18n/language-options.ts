import { resolveIntlLocale, supportedLocales, type SupportedLocale } from "./supported-locales";

const labelKeys: Record<SupportedLocale, string> = {
  es: "languages.es",
  gl: "languages.gl",
  ca: "languages.ca",
  "oc-aranes": "languages.ocAranes",
  "ca-valencia": "languages.valencia",
  fr: "languages.fr",
  "en-US": "languages.enUS",
  de: "languages.de",
  it: "languages.it",
};

export function sortedLanguageOptions(translate: (key: string) => string, locale?: string) {
  const collator = new Intl.Collator(resolveIntlLocale(locale), { sensitivity: "base" });
  return supportedLocales
    .map((code) => ({ code, label: translate(labelKeys[code]) }))
    .sort((a, b) => collator.compare(a.label, b.label) || a.code.localeCompare(b.code));
}
