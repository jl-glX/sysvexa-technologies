import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import es from "./locales/es.json";
import gl from "./locales/gl.json";
import ca from "./locales/ca.json";
import ocAranes from "./locales/oc-aranes.json";
import caValencia from "./locales/ca-valencia.json";
import fr from "./locales/fr.json";
import enUS from "./locales/en-US.json";
import de from "./locales/de.json";
import it from "./locales/it.json";
import { canonicalizeLocale, regionalLocaleFallbacks, supportedLocales } from "./supported-locales";

void i18n.use(LanguageDetector).use(initReactI18next).init({
  resources: {
    es: { translation: es }, gl: { translation: gl }, ca: { translation: ca },
    "oc-aranes": { translation: ocAranes }, "ca-valencia": { translation: caValencia },
    fr: { translation: fr }, "en-US": { translation: enUS }, de: { translation: de }, it: { translation: it },
  },
  supportedLngs: supportedLocales,
  fallbackLng: { ...Object.fromEntries(Object.entries(regionalLocaleFallbacks).map(([key, value]) => [key, [value, "es"]])), default: ["es"] },
  load: "currentOnly",
  detection: {
    order: ["localStorage", "navigator"],
    lookupLocalStorage: "sysvexa-language",
    caches: ["localStorage"],
    convertDetectedLanguage: canonicalizeLocale,
  },
  interpolation: { escapeValue: false },
}).then(() => {
  document.documentElement.lang = canonicalizeLocale(i18n.resolvedLanguage);
});

i18n.on("languageChanged", (language) => {
  document.documentElement.lang = canonicalizeLocale(language);
});

export default i18n;
