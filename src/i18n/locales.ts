// Contract 05: Locale 타입의 유일한 정의 위치.
export type Locale = "ko" | "en";
export type LocalizedText = Record<Locale, string>;

export const messages = {
  ko: {
    open: "바로가기",
    switchLang: "English",
    switchLangAria: "Switch to English",
  },
  en: {
    open: "Open",
    switchLang: "한국어",
    switchLangAria: "한국어로 전환",
  },
} satisfies Record<Locale, Record<string, string>>;

export type MessageKey = keyof (typeof messages)["ko"];
