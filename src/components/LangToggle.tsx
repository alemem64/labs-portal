import { useEffect, useRef, useState } from "react";
import { useLocale } from "../i18n/LocaleContext";
import type { Locale } from "../i18n/locales";

const languageOptions: { locale: Locale; label: string }[] = [
  { locale: "ko", label: "한국어" },
  { locale: "en", label: "English" },
];

export default function LangToggle() {
  const { locale, selectLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const controlRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!controlRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <div ref={controlRef} className="lang-control">
      <div
        className="lang-flyout"
        data-open={open || undefined}
        role="menu"
        aria-label={t("languageMenuAria")}
        aria-hidden={!open}
      >
        {languageOptions.map((option) => (
          <button
            key={option.locale}
            type="button"
            className="lang-option"
            data-active={locale === option.locale || undefined}
            role="menuitemradio"
            aria-checked={locale === option.locale}
            tabIndex={open ? 0 : -1}
            onClick={() => {
              selectLocale(option.locale);
              setOpen(false);
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="lang-toggle"
        onClick={() => setOpen((value) => !value)}
        aria-label={t("switchLangAria")}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <svg className="lang-icon" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.4 2.5 3.7 5.5 3.7 9S14.4 18.5 12 21M12 3C9.6 5.5 8.3 8.5 8.3 12S9.6 18.5 12 21" />
        </svg>
        <span>{locale === "ko" ? "한국어" : "English"}</span>
        <svg className="lang-chevron" viewBox="0 0 16 16" aria-hidden="true">
          <path d="m4 10 4-4 4 4" />
        </svg>
      </button>
    </div>
  );
}
