import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { sortedLanguageOptions } from "../i18n/language-options";
import { canonicalizeLocale } from "../i18n/supported-locales";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const current = canonicalizeLocale(i18n.resolvedLanguage ?? i18n.language);
  const options = sortedLanguageOptions((key) => t(key), current);

  return (
    <label className="language-switcher">
      <Languages size={17} aria-hidden="true" />
      <span className="sr-only">{t("languages.label")}</span>
      <select value={current} aria-label={t("languages.label")} onChange={(event) => void i18n.changeLanguage(event.target.value)}>
        {options.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}
      </select>
    </label>
  );
}
