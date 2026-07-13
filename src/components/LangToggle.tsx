import { useLocale } from "../i18n/LocaleContext";

export default function LangToggle() {
  const { toggle, t } = useLocale();
  return (
    <button type="button" className="lang-toggle" onClick={toggle} aria-label={t("switchLangAria")}>
      {t("switchLang")}
    </button>
  );
}
