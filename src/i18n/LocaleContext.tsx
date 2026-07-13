import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { messages, type Locale, type MessageKey } from "./locales";

const STORAGE_KEY = "lsl.locale";

// Contract 05: localStorage 저장값 → navigator.language 순으로 결정.
export function detectLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "ko" || stored === "en") return stored;
  } catch {
    // 프라이빗 모드 등 — 무시하고 브라우저 언어로
  }
  return navigator.language?.toLowerCase().startsWith("ko") ? "ko" : "en";
}

type LocaleCtx = {
  locale: Locale;
  toggle: () => void;
  selectLocale: (locale: Locale) => void;
  t: (key: MessageKey) => string;
};

const Ctx = createContext<LocaleCtx | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(detectLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // 저장 실패는 치명적이지 않다
    }
  }, [locale]);

  const value: LocaleCtx = {
    locale,
    toggle: () => setLocale((l) => (l === "ko" ? "en" : "ko")),
    selectLocale: setLocale,
    t: (key) => messages[locale][key],
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLocale(): LocaleCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
